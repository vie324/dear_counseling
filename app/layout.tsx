import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dear 美容整体 問診票",
  description: "ご来院前の問診票",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
