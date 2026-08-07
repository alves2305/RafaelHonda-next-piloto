"use client";

import { useEffect } from "react";

export function PanelPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    function registerServiceWorker() {
      void navigator.serviceWorker
        .register("/painel-sw.js", { scope: "/painel/" })
        .catch((error: unknown) => {
          console.warn("Não foi possível registrar o aplicativo do painel.", error);
        });
    }

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}
