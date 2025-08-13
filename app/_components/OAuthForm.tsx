"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  defaultRedirectUri: string;
};

type FormState = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  usePkce: boolean;
  responseType: string;
  clientAuthMethod: string;
  extraAuthParams: string;
};

const STORAGE_KEY = "oauth2-playground-form";

export default function OAuthForm({ defaultRedirectUri }: Props) {
  const initialState: FormState = useMemo(
    () => ({
      authorizationEndpoint: "",
      tokenEndpoint: "",
      userInfoEndpoint: "",
      clientId: "",
      clientSecret: "",
      redirectUri: defaultRedirectUri,
      scope: "",
      usePkce: true,
      responseType: "code",
      clientAuthMethod: "basic",
      extraAuthParams: "",
    }),
    [defaultRedirectUri]
  );

  const [state, setState] = useState<FormState>(initialState);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        setState((prev) => ({ ...prev, ...parsed, redirectUri: parsed.redirectUri || prev.redirectUri }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, loaded]);

  function onChange<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target as HTMLInputElement;
      const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
      setState((prev) => ({ ...prev, [key]: value } as FormState));
    };
  }

  return (
    <form
      action="/api/oauth/start"
      method="post"
      className="grid grid-cols-1 gap-6 rounded-xl border border-zinc-200 bg-white/60 dark:bg-white/5 p-6 shadow-lg backdrop-blur"
    >
      <fieldset className="grid grid-cols-1 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Authorization Endpoint</span>
          <input name="authorizationEndpoint" required placeholder="https://provider.com/oauth2/authorize" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.authorizationEndpoint} onChange={onChange("authorizationEndpoint")} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Token Endpoint</span>
          <input name="tokenEndpoint" required placeholder="https://provider.com/oauth2/token" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.tokenEndpoint} onChange={onChange("tokenEndpoint")} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">UserInfo Endpoint (optional)</span>
          <input name="userInfoEndpoint" placeholder="https://provider.com/oauth2/userinfo" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.userInfoEndpoint} onChange={onChange("userInfoEndpoint")} />
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Client ID</span>
          <input name="clientId" required className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.clientId} onChange={onChange("clientId")} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Client Secret (if any)</span>
          <input name="clientSecret" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.clientSecret} onChange={onChange("clientSecret")} />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm text-gray-100">Redirect URI</span>
          <input name="redirectUri" required className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.redirectUri} onChange={onChange("redirectUri")} />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm text-gray-100">Scope</span>
          <input name="scope" placeholder="openid profile email" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.scope} onChange={onChange("scope")} />
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="usePkce" checked={state.usePkce} onChange={onChange("usePkce")} className="h-4 w-4" />
          <span className="text-sm text-gray-100">Use PKCE (S256)</span>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Response Type</span>
          <select name="responseType" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.responseType} onChange={onChange("responseType")}>
            <option value="code">code</option>
            <option value="token">token (implicit)</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Client Auth Method</span>
          <select name="clientAuthMethod" className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={state.clientAuthMethod} onChange={onChange("clientAuthMethod")}>
            <option value="basic">basic</option>
            <option value="body">body</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-2">
        <label className="grid gap-1">
          <span className="text-sm text-gray-100">Extra Authorization Params (key=value per line)</span>
          <textarea name="extraAuthParams" rows={4} className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder={"prompt=consent\naccess_type=offline"} value={state.extraAuthParams} onChange={onChange("extraAuthParams")} />
        </label>
      </fieldset>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">Start OAuth</button>
        <button
          type="button"
          className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            fetch("/api/oauth/clear", { method: "POST" }).finally(() => window.location.reload());
          }}
          title="Clear saved form values from this browser"
        >
          Clear Saved
        </button>
      </div>
    </form>
  );
}


