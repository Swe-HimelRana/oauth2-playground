import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import pkg from "../package.json" assert { type: "json" };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://himosoft.com.bd"),
  title: {
    default: "HimoSoft OAuth2 Playground",
    template: "%s | HimoSoft OAuth2 Playground",
  },
  description:
    "Test and debug OAuth 2.0 / OpenID Connect providers with Authorization Code + PKCE, token refresh, and userinfo viewer.",
  applicationName: "HimoSoft OAuth2 Playground",
  authors: [{ name: "HimoSoft", url: "https://himosoft.com.bd" }],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "any" },
    ],
    shortcut: ["/logo.png"],
    apple: [{ url: "/logo.png", sizes: "any" }],
  },
  openGraph: {
    title: "HimoSoft OAuth2 Playground",
    description:
      "Test and debug OAuth 2.0 / OpenID Connect providers with Authorization Code + PKCE, token refresh, and userinfo viewer.",
    url: "https://himosoft.com.bd",
    siteName: "HimoSoft OAuth2 Playground",
    images: [{ url: "/logo.png" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HimoSoft OAuth2 Playground",
    description:
      "Test and debug OAuth 2.0 / OpenID Connect providers with Authorization Code + PKCE, token refresh, and userinfo viewer.",
    images: ["/logo.png"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="wave-bg" aria-hidden>
          <div className="waves">
            <div className="wave wave-1" />
            <div className="wave wave-2" />
            <div className="wave wave-3" />
          </div>
        </div>
        <header className="w-full border-b bg-white/70 dark:bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="HimoSoft logo" width={32} height={32} priority />
              <span className="font-semibold">HimoSoft OAuth2 Playground</span>
            </Link>
          </div>
        </header>
        <main className="min-h-[calc(100vh-112px)]">{children}</main>
        <footer className="w-full border-t">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex items-center justify-between">
            <span>© {new Date().getFullYear()} HimoSoft. All rights reserved. · v{pkg.version}</span>
            <nav className="flex items-center gap-4">
              <a className="hover:underline" href="https://himosoft.com.bd" target="_blank" rel="noreferrer">
                himosoft.com.bd
              </a>
              <a className="hover:underline" href="mailto:bug@himelrana.com">
                bug@himelrana.com
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
