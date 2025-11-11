import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextMind Labs | Lernübungen",
  description:
    "Sammlung interaktiver Lernübungen für Kinder – inklusive der 100 Fehlerwörter mit Audio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#mainContent">
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
