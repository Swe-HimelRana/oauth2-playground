import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  const names = [
    "oauth_state",
    "oauth_code_verifier",
    "oauth_config",
    "oauth_tokens",
  ];
  for (const name of names) {
    try {
      store.delete(name);
    } catch {}
  }
  return new Response(null, { status: 204 });
}


