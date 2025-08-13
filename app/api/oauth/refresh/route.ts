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

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const config = await readCookieJson<OAuthConfig>("oauth_config");
  const tokens = await readCookieJson<OAuthTokens>("oauth_tokens");
  const refreshToken: string | undefined = tokens?.refresh_token;

  if (!config || !refreshToken) {
    return new Response("Missing config or refresh_token", { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  if (String(config.clientAuthMethod || "basic") === "body") {
    body.set("client_id", config.clientId);
    if (config.clientSecret) body.set("client_secret", config.clientSecret);
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };
  if (String(config.clientAuthMethod || "basic") === "basic") {
    const creds = Buffer.from(`${config.clientId}:${config.clientSecret || ""}`).toString("base64");
    headers["authorization"] = `Basic ${creds}`;
  }

  const res = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers,
    body: body.toString(),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    return new Response(JSON.stringify(json), { status: 400 });
  }

  const merged: OAuthTokens = {
    ...(tokens ?? {}),
    ...(typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {}),
    received_at: Math.floor(Date.now() / 1000),
  };
  cookieStore.set("oauth_tokens", Buffer.from(JSON.stringify(merged)).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return Response.redirect(new URL("/oauth/result", request.url), 302);
}


