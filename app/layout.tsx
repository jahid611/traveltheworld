import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Travel-editorial serif for display, clean sans for UI, mono for coordinates.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRAVELTHEWORLD — pin your journeys",
  description:
    "An interactive 3D globe. Drop pins where you've been, attach your photos and clips, and relive every journey.",
};

export const viewport: Viewport = {
  themeColor: "#0a1723",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="app-bg h-full overflow-hidden font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
