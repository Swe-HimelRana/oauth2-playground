import { NextRequest } from "next/server";
import { cookies } from "next/headers";

type OAuthConfig = {
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  clientAuthMethod: "basic" | "body";
  usePkce?: boolean;
};

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  received_at?: number;
  [key: string]: unknown;
};

async function readCookieJson<T>(name: string): Promise<T | null> {
  const store = await cookies();
  const value = store.get(name)?.value;
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state")?.value;
  const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;
  const config = await readCookieJson<OAuthConfig>("oauth_config");

  if (error) {
    const resultUrl = new URL("/oauth/result", request.url);
    resultUrl.searchParams.set("error", error);
    return Response.redirect(resultUrl, 302);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response("Invalid or missing state/code", { status: 400 });
  }

  if (!config) {
    return new Response("Missing oauth configuration", { status: 400 });
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: String(config.redirectUri || ""),
  });
  if (config.usePkce && codeVerifier) {
    tokenBody.set("code_verifier", codeVerifier);
  }
  if (String(config.clientAuthMethod || "basic") === "body") {
    tokenBody.set("client_id", config.clientId);
    if (config.clientSecret) tokenBody.set("client_secret", config.clientSecret);
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };
  if (String(config.clientAuthMethod || "basic") === "basic") {
    if (!config.clientId) return new Response("Missing clientId", { status: 400 });
    const creds = Buffer.from(`${config.clientId}:${config.clientSecret || ""}`).toString("base64");
    headers["authorization"] = `Basic ${creds}`;
  }

  const tokenRes = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers,
    body: tokenBody.toString(),
  });

  const tokenJson: unknown = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok) {
    const tj = (typeof tokenJson === "object" && tokenJson !== null ? (tokenJson as Record<string, unknown>) : {}) as Record<string, unknown>;
    const msg = (typeof tj.error_description === "string" ? tj.error_description : undefined) ||
      (typeof tj.error === "string" ? tj.error : undefined) ||
      tokenRes.statusText;
    const resultUrl = new URL("/oauth/result", request.url);
    resultUrl.searchParams.set("error", String(msg || "Token exchange failed"));
    return Response.redirect(resultUrl, 302);
  }

  const now = Math.floor(Date.now() / 1000);
  const tokens: OAuthTokens = {
    ...(typeof tokenJson === "object" && tokenJson !== null ? (tokenJson as Record<string, unknown>) : {}),
    received_at: now,
  };

  cookieStore.set("oauth_tokens", Buffer.from(JSON.stringify(tokens)).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // Cleanup single-use cookies
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_code_verifier");

  return Response.redirect(new URL("/oauth/result", request.url), 302);
}


