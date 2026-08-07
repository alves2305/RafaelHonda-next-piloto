import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { PanelPwaRegistration } from "@/components/client-demo/PanelPwaRegistration";

export const metadata: Metadata = {
  applicationName: "Painel Catálogo Honda",
  title: {
    default: "Painel do vendedor",
    template: "%s | Painel Catálogo Honda",
  },
  description: "Área exclusiva para administrar o seu catálogo Honda.",
  manifest: "/painel.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Painel Honda",
  },
  icons: {
    icon: [
      { url: "/painel-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/painel-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/painel-app-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17233a",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PanelPwaRegistration />
      {children}
    </>
  );
}
