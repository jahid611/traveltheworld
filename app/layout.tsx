import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Google-style UI type: Roboto for chrome, Roboto Mono for coordinate readouts.
const sans = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRAVELTHEWORLD — pin your journeys",
  description:
    "An interactive photoreal 3D globe. Drop pins where you've been, attach your photos and clips, and relive every journey.",
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="h-full overflow-hidden font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
