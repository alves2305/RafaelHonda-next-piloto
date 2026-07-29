"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getSupabaseClient } from "@/lib/supabase";

import styles from "./PublicCatalogAnalytics.module.css";

type AnalyticsConsent =
  | "loading"
  | "pending"
  | "granted"
  | "denied";

const CONSENT_KEY =
  "rafael-honda-catalog-analytics-consent";
const VISITOR_KEY =
  "rafael-honda-anonymous-visitor-id";
const SESSION_KEY =
  "rafael-honda-anonymous-session-id";

function createAnonymousId() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return "00000000-0000-4000-8000-000000000000".replace(
    /[08]/g,
    (character) =>
      (
        Number(character) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] &
          (15 >> (Number(character) / 4)))
      ).toString(16),
  );
}

function getOrCreateId(
  storage: Storage,
  key: string,
) {
  const currentValue = storage.getItem(key);

  if (currentValue) {
    return currentValue;
  }

  const nextValue = createAnonymousId();
  storage.setItem(key, nextValue);

  return nextValue;
}

function getMotorcycleSlug(
  pathname: string,
  clientSlug: string,
) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== clientSlug) {
    return null;
  }

  if (
    !["moto", "consorcio", "financiamento"].includes(
      parts[1] ?? "",
    )
  ) {
    return null;
  }

  return parts[2] ?? null;
}

export function PublicCatalogAnalytics({
  clientId,
  clientSlug,
  active,
}: {
  clientId: string;
  clientSlug: string;
  active: boolean;
}) {
  const pathname = usePathname();
  const [consent, setConsent] =
    useState<AnalyticsConsent>("loading");

  const motorcycleSlug = useMemo(
    () => getMotorcycleSlug(pathname, clientSlug),
    [clientSlug, pathname],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!active) {
        setConsent("denied");
        return;
      }

      try {
        const storedConsent =
          window.localStorage.getItem(CONSENT_KEY);

        if (storedConsent === "granted") {
          setConsent("granted");
        } else if (storedConsent === "denied") {
          setConsent("denied");
        } else {
          setConsent("pending");
        }
      } catch {
        setConsent("denied");
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active]);

  useEffect(() => {
    if (
      consent !== "granted" ||
      !active ||
      !pathname.startsWith(`/${clientSlug}`)
    ) {
      return;
    }

    let cancelled = false;

    async function registerAccess() {
      try {
        const supabase = getSupabaseClient();

        if (!supabase) {
          return;
        }

        const visitorId = getOrCreateId(
          window.localStorage,
          VISITOR_KEY,
        );
        const sessionId = getOrCreateId(
          window.sessionStorage,
          SESSION_KEY,
        );

        const trackedPageKey = [
          "rafael-honda-tracked",
          clientId,
          sessionId,
          pathname,
        ].join(":");

        if (
          window.sessionStorage.getItem(
            trackedPageKey,
          ) === "1"
        ) {
          return;
        }

        const { error } = await supabase.rpc(
          "registrar_acesso_catalogo",
          {
            p_cliente_id: clientId,
            p_visitante_id: visitorId,
            p_sessao_id: sessionId,
            p_caminho: pathname,
            p_moto_slug: motorcycleSlug,
          },
        );

        if (error) {
          throw error;
        }

        if (!cancelled) {
          window.sessionStorage.setItem(
            trackedPageKey,
            "1",
          );
        }
      } catch (trackingError) {
        console.warn(
          "Não foi possível registrar a métrica anônima:",
          trackingError,
        );
      }
    }

    void registerAccess();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    clientId,
    clientSlug,
    consent,
    motorcycleSlug,
    pathname,
  ]);

  function acceptAnalytics() {
    try {
      window.localStorage.setItem(
        CONSENT_KEY,
        "granted",
      );
      setConsent("granted");
    } catch {
      setConsent("denied");
    }
  }

  function declineAnalytics() {
    try {
      window.localStorage.setItem(
        CONSENT_KEY,
        "denied",
      );
    } finally {
      setConsent("denied");
    }
  }

  if (consent !== "pending") {
    return null;
  }

  return (
    <aside
      className={styles.consent}
      aria-label="Preferência de métricas do catálogo"
    >
      <div>
        <strong>Métricas anônimas</strong>
        <p>
          Este catálogo gostaria de contar visitas e
          motos acessadas. Não coletamos nome, telefone,
          CPF ou conteúdo das mensagens.
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={declineAnalytics}
        >
          Não agora
        </button>

        <button
          className={styles.accept}
          type="button"
          onClick={acceptAnalytics}
        >
          Permitir
        </button>
      </div>
    </aside>
  );
}
