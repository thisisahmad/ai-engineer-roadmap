import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { ChatWidget } from "@/components/chat/chat-widget";
import { SessionProvider } from "@/components/auth/session-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/**
 * Three roles, deliberately separated.
 *
 *  sans     Inter, for everything that has to be read at small sizes.
 *  heading  Instrument Serif, for display type only. It carries the brand and
 *           is never used below ~24px, where its thin strokes fall apart.
 *  mono     JetBrains Mono, for figures and stage numbers, so tabular data
 *           lines up in columns.
 */
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const heading = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Roadmap — routes into AI engineering",
    template: "%s — AI Roadmap",
  },
  description:
    "Opinionated, stage-by-stage roadmaps for AI engineering careers: what to learn, in what order, what to build, and what it pays.",
  keywords: [
    "AI engineer",
    "machine learning engineer",
    "MLOps",
    "career roadmap",
    "AI career",
  ],
  openGraph: {
    type: "website",
    siteName: "AI Roadmap",
    title: "AI Roadmap — routes into AI engineering",
    description:
      "Stage-by-stage roadmaps for AI engineering careers, with honest timelines and what to build at each step.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `dark` is applied unconditionally: this site has one designed theme
    // rather than a toggle. `color-scheme` keeps native form controls and
    // scrollbars consistent with it.
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        {/*
          Entrance animations server-render their `initial` state as inline
          styles — BlurText emits opacity:0 with a 10px blur, ScrollReveal emits
          opacity:0 and a translate. Both are cleared on hydration, so without
          JavaScript the headline and every revealed section would stay
          invisible. This restores them for that case only; it has no effect
          once JS runs.
        */}
        <noscript>
          <style>{`
            .blur-text > span { opacity: 1 !important; filter: none !important; transform: none !important; }
            [data-scroll-reveal] { opacity: 1 !important; visibility: visible !important; transform: none !important; }
          `}</style>
        </noscript>
      </head>
      <body
        className={`${sans.variable} ${heading.variable} ${mono.variable} min-h-dvh antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>

        <SessionProvider>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />

          {/* Site-wide advisor. Renders nothing on /chat, where the full page
              already hosts the same conversation from the same storage key. */}
          <ChatWidget />
        </div>
        </SessionProvider>
      </body>
    </html>
  );
}
