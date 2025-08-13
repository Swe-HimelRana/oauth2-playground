import { headers } from "next/headers";
import OAuthForm from "@/app/_components/OAuthForm";

export default async function Home() {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = hdrs.get("host") || "localhost:3000";
  const defaultRedirectUri = `${proto}://${host}/api/oauth/callback`;
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">OAuth2 Playground</h1>
      <OAuthForm defaultRedirectUri={defaultRedirectUri} />
      <div className="mt-6 text-lg text-gray-100">Tip: Register the redirect URI above with the provider.</div>
    </div>
  );
}
