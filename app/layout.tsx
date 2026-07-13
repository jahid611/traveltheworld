import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRAVELTHEWORLD",
  description:
    "A brutalist 3D globe. Pin your places, attach your media, own your data.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="h-full overflow-hidden bg-ink font-mono text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
