"use client";

import { useState } from "react";

type UserInfo = Record<string, unknown> | null;

export default function UserInfoClient() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserInfo>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oauth/userinfo");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch userinfo");
      }
      setData(json);
    } catch (e) {
      const err = e as { message?: string };
      setError(String(err?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={onClick} disabled={loading} className="px-3 py-2 rounded border disabled:opacity-50">
        {loading ? "Loading..." : "Get UserInfo"}
      </button>
      {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      {data ? (
        <pre className="text-xs bg-black/5 dark:bg-white/10 p-3 rounded overflow-auto max-h-64 min-w-[300px]">
{JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}


