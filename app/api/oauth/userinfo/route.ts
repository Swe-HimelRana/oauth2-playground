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

export async function GET() {
  const config = await readCookieJson<OAuthConfig>("oauth_config");
  const tokens = await readCookieJson<OAuthTokens>("oauth_tokens");
  let accessToken: string | undefined = tokens?.access_token;

  if (!config?.userInfoEndpoint || !accessToken) {
    return new Response(JSON.stringify({ error: "Missing userInfoEndpoint or access_token" }), { status: 400 });
  }

  const authScheme = (typeof tokens?.token_type === "string" && tokens.token_type) ? String(tokens.token_type) : "Bearer";
  let res = await fetch(config.userInfoEndpoint, {
    headers: { authorization: `${authScheme} ${accessToken}`, accept: "application/json" },
  });

  // If token is invalid/expired, try to refresh once and retry userinfo
  if ((res.status === 401 || res.status === 403) && tokens?.refresh_token) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });
    const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
    if (String(config.clientAuthMethod || "basic") === "basic") {
      const creds = Buffer.from(`${config.clientId}:${config.clientSecret || ""}`).toString("base64");
      headers["authorization"] = `Basic ${creds}`;
    } else {
      body.set("client_id", config.clientId);
      if (config.clientSecret) body.set("client_secret", config.clientSecret);
    }

    const refreshRes = await fetch(config.tokenEndpoint, { method: "POST", headers, body: body.toString() });
    const refreshJson: unknown = await refreshRes.json().catch(() => ({}));
    if (refreshRes.ok && typeof refreshJson === "object" && refreshJson) {
      const newTokens = {
        ...(tokens ?? {}),
        ...(refreshJson as Record<string, unknown>),
        received_at: Math.floor(Date.now() / 1000),
      };
      const store = await cookies();
      store.set("oauth_tokens", Buffer.from(JSON.stringify(newTokens)).toString("base64"), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      accessToken = (newTokens as OAuthTokens).access_token;
      if (accessToken) {
        res = await fetch(config.userInfoEndpoint, { headers: { authorization: `${authScheme} ${accessToken}`, accept: "application/json" } });
      }
    }
  }

  // Fallback: some providers accept access_token as query param
  if (res.status === 401 || res.status === 403) {
    try {
      const url = new URL(config.userInfoEndpoint);
      url.searchParams.set("access_token", String(accessToken));
      const alt = await fetch(url.toString(), { headers: { accept: "application/json" } });
      if (alt.ok) {
        const altJson: unknown = await alt.json().catch(() => ({}));
        return new Response(JSON.stringify(altJson), { status: alt.status });
      }
    } catch {}
  }

  const json: unknown = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(json), { status: res.status });
}



