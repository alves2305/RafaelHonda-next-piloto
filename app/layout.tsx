import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import "@/app/catalog-refinements.css";

export const metadata: Metadata = {
  title: {
    default: "Catálogo Honda",
    template: "%s | Catálogo Honda",
  },
  description:
    "Catálogo personalizado de motos Honda, consórcio e financiamento.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d90000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
