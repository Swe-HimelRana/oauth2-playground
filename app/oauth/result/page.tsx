import { cookies } from "next/headers";
import Link from "next/link";
import UserInfoClient from "@/app/oauth/result/userinfo-client";
import ReauthClient from "@/app/oauth/result/reauth-client";

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

export default async function ResultPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const error = sp?.error;
  const tokens = await readCookieJson<OAuthTokens>("oauth_tokens");
  const config = await readCookieJson<OAuthConfig>("oauth_config");
  const errorToShow = !tokens?.access_token ? error : undefined;
  const hasRefresh = !!tokens?.refresh_token;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">OAuth2 Result</h1>
        <div className="flex items-center gap-2">
          <Link className="px-3 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors" href="/">Back to Home</Link>
          <Link className="px-3 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors" href="/">Start Over</Link>
        </div>
      </div>
      {errorToShow ? (
        <div className="rounded border border-red-400 bg-red-50 text-red-700 p-3">Error: {errorToShow}</div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="space-y-2 rounded-xl border bg-white/60 dark:bg-white/5 p-4 shadow-sm backdrop-blur">
          <h2 className="font-medium">Tokens</h2>
          <pre className="text-xs bg-black/5 dark:bg-white/10 p-3 rounded overflow-auto">
{JSON.stringify(tokens ?? { message: "No tokens" }, null, 2)}
          </pre>
          <form action="/api/oauth/refresh" method="post" className="flex gap-2">
            <button disabled={!hasRefresh} className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Refresh Token</button>
            {!hasRefresh ? <ReauthClient /> : null}
          </form>
          {!hasRefresh ? (
            <p className="text-xs text-gray-100">No refresh_token returned. To receive one, ensure you use Authorization Code flow and request offline access (e.g., scope &quot;offline_access&quot; or extra params like access_type=offline and prompt=consent).</p>
          ) : null}
        </section>

        <section className="space-y-2 rounded-xl border bg-white/60 dark:bg-white/5 p-4 shadow-sm backdrop-blur">
          <h2 className="font-medium">Config</h2>
          <pre className="text-xs bg-black/5 dark:bg-white/10 p-3 rounded overflow-auto">
{JSON.stringify(config ?? { message: "No config" }, null, 2)}
          </pre>
          <div className="flex gap-2">
            <UserInfoClient />
          </div>
        </section>
      </div>
    </div>
  );
}


