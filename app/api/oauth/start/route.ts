import { NextRequest } from "next/server";
import { cookies } from "next/headers";

function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = Buffer.from(buffer);
	return bytes
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

async function generateCodeVerifierAndChallenge(): Promise<{
	codeVerifier: string;
	codeChallenge: string;
}> {
	const randomBytes = crypto.getRandomValues(new Uint8Array(32));
	const codeVerifier = base64UrlEncode(randomBytes.buffer);
	const digest = await crypto.subtle.digest("SHA-256", Buffer.from(codeVerifier));
	const codeChallenge = base64UrlEncode(digest);
	return { codeVerifier, codeChallenge };
}

function parseExtraParams(extra: string | null | undefined): Record<string, string> {
	if (!extra) return {};
	const out: Record<string, string> = {};
	extra
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean)
		.forEach((line) => {
			const idx = line.indexOf("=");
			if (idx > 0) {
				const key = line.slice(0, idx).trim();
				const value = line.slice(idx + 1).trim();
				out[key] = value;
			}
		});
	return out;
}

export async function POST(request: NextRequest) {
	const form = await request.formData();
	const authorizationEndpoint = String(form.get("authorizationEndpoint") || "");
	const tokenEndpoint = String(form.get("tokenEndpoint") || "");
	const userInfoEndpoint = String(form.get("userInfoEndpoint") || "");
	const clientId = String(form.get("clientId") || "");
	const clientSecret = String(form.get("clientSecret") || "");
	const redirectUri = String(form.get("redirectUri") || "");
	const scope = String(form.get("scope") || "");
	const usePkce = String(form.get("usePkce") || "on") === "on";
	const codeChallengeMethod = String(form.get("codeChallengeMethod") || "S256");
	const responseType = String(form.get("responseType") || "code");
	const clientAuthMethod = String(form.get("clientAuthMethod") || "basic");
	const extraAuthParams = parseExtraParams(String(form.get("extraAuthParams") || ""));

	if (!authorizationEndpoint || !tokenEndpoint || !clientId || !redirectUri) {
		return new Response("Missing required fields", { status: 400 });
	}

	const state = crypto.randomUUID();
	let codeVerifier: string | undefined;
	let codeChallenge: string | undefined;
	if (usePkce && codeChallengeMethod.toUpperCase() === "S256") {
		const pair = await generateCodeVerifierAndChallenge();
		codeVerifier = pair.codeVerifier;
		codeChallenge = pair.codeChallenge;
	}

	const params = new URLSearchParams({
		response_type: responseType,
		client_id: clientId,
		redirect_uri: redirectUri,
		scope,
		state,
	});

	if (usePkce && codeChallenge && codeChallengeMethod.toUpperCase() === "S256") {
		params.set("code_challenge", codeChallenge);
		params.set("code_challenge_method", "S256");
	}

	for (const [k, v] of Object.entries(extraAuthParams)) {
		if (k && v !== undefined) params.set(k, v);
	}

	const cookieStore = await cookies();
	cookieStore.set("oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
	});
	if (codeVerifier) {
		cookieStore.set("oauth_code_verifier", codeVerifier, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
		});
	}

	const config = {
		tokenEndpoint,
		userInfoEndpoint,
		clientId,
		clientSecret,
		redirectUri,
		clientAuthMethod,
		usePkce: !!codeVerifier,
	};
	cookieStore.set("oauth_config", Buffer.from(JSON.stringify(config)).toString("base64"), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
	});

	const url = `${authorizationEndpoint}${authorizationEndpoint.includes("?") ? "&" : "?"}${params.toString()}`;
	return Response.redirect(url, 302);
}


