"use client";

export default function ReauthClient() {
  async function onClick() {
    try {
      const raw = localStorage.getItem("oauth2-playground-form");
      if (!raw) {
        window.location.href = "/";
        return;
      }
      const data = JSON.parse(raw) as Record<string, unknown>;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/oauth/start";
      form.style.display = "none";

      const keys = [
        "authorizationEndpoint",
        "tokenEndpoint",
        "userInfoEndpoint",
        "clientId",
        "clientSecret",
        "redirectUri",
        "scope",
        "responseType",
        "clientAuthMethod",
        "extraAuthParams",
      ];

      for (const key of keys) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        const value = data[key];
        input.value = value == null ? "" : String(value);
        form.appendChild(input);
      }

      const usePkce = document.createElement("input");
      usePkce.type = "hidden";
      usePkce.name = "usePkce";
      usePkce.value = data["usePkce"] ? "on" : "";
      form.appendChild(usePkce);

      // Default to S256 if PKCE
      const codeMethod = document.createElement("input");
      codeMethod.type = "hidden";
      codeMethod.name = "codeChallengeMethod";
      codeMethod.value = "S256";
      form.appendChild(codeMethod);

      document.body.appendChild(form);
      form.submit();
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <button onClick={onClick} className="px-3 py-2 rounded border hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
      Re-authorize
    </button>
  );
}


