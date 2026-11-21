import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-display",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jorge Velazquez — Portfolio",
  description: "Systems, AI Agent Harnesses & Software Engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${interTight.variable} ${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="bg-[var(--bg)] text-[var(--ink)] antialiased font-[var(--font-sans)] selection:bg-[var(--green)] selection:text-black">
        {children}
      </body>
    </html>
  );
}
