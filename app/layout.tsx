import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deutsch Hörübung",
  description:
    "Interaktive Übung für Kinder, um tricky deutsche Wörter mit Audio zu lernen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

