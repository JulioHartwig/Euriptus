import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Euriptus — Simulador da cadeia produtiva do café",
    template: "%s · Euriptus",
  },
  description:
    "Simulador educacional multiplayer para aprender como funciona a cadeia produtiva do café, da fazenda à venda.",
  applicationName: "Euriptus",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173a2f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
