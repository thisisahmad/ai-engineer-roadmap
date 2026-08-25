import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>

        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
