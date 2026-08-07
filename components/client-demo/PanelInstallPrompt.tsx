"use client";

import { useEffect, useState } from "react";

import styles from "@/components/client-demo/panel-install-prompt.module.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function PanelInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");

    function updateInstalledState() {
      const navigatorWithStandalone = navigator as NavigatorWithStandalone;
      setIsInstalled(displayMode.matches || navigatorWithStandalone.standalone === true);
    }

    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setIsInstalled(true);
    }

    const initialStateTimer = window.setTimeout(() => {
      setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
      updateInstalledState();
    }, 0);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener("change", updateInstalledState);

    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode.removeEventListener("change", updateInstalledState);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (isInstalled) {
    return (
      <div className={styles.installed}>
        <span aria-hidden="true">✓</span>
        <p><strong>Aplicativo instalado</strong><small>Abra o painel pelo ícone na tela inicial.</small></p>
      </div>
    );
  }

  return (
    <div className={styles.installCard}>
      <div className={styles.installHeading}>
        <span aria-hidden="true">▣</span>
        <div>
          <strong>Instale o painel no celular</strong>
          <p>Ele ganha um ícone próprio e abre separado do catálogo.</p>
        </div>
      </div>

      {installPrompt ? (
        <button type="button" onClick={() => void handleInstall()}>
          Instalar aplicativo
        </button>
      ) : isIos ? (
        <p className={styles.instructions}>
          No Safari, toque em <strong>Compartilhar</strong> e depois em
          <strong> Adicionar à Tela de Início</strong>.
        </p>
      ) : (
        <p className={styles.instructions}>
          Abra o menu do navegador e escolha <strong>Instalar aplicativo</strong>
          ou <strong>Adicionar à tela inicial</strong>.
        </p>
      )}
    </div>
  );
}
