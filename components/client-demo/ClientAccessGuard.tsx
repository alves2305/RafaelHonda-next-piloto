"use client";

import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  loadCurrentClientAccess,
  type ClientAccess,
} from "@/lib/client-access";
import {
  getClientSupabaseClient,
  isClientSupabaseConfigured,
} from "@/lib/client-supabase";

import styles from "./client-access.module.css";

type AccessState =
  | { status: "checking"; access: null; message: "" }
  | { status: "allowed"; access: ClientAccess; message: "" }
  | { status: "blocked"; access: ClientAccess; message: string }
  | { status: "unlinked"; access: null; message: string }
  | { status: "error"; access: null; message: string };

const ClientAccessContext = createContext<ClientAccess | null>(null);

export function useClientAccess() {
  const access = useContext(ClientAccessContext);

  if (!access) {
    throw new Error(
      "useClientAccess precisa ser utilizado dentro de ClientAccessGuard.",
    );
  }

  return access;
}

export function ClientAccessGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseConfigured = isClientSupabaseConfigured();
  const [state, setState] = useState<AccessState>(() =>
    supabaseConfigured
      ? {
          status: "checking",
          access: null,
          message: "",
        }
      : {
          status: "error",
          access: null,
          message:
            "O Supabase não está configurado nas variáveis de ambiente deste projeto.",
        },
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = getClientSupabaseClient();
    let active = true;

    async function verifyAccess() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.replace("/painel/login");
          return;
        }

        const access = await loadCurrentClientAccess(supabase);

        if (!active) {
          return;
        }

        if (!access) {
          setState({
            status: "unlinked",
            access: null,
            message:
              "Esta conta existe, mas ainda não foi vinculada a um catálogo.",
          });
          return;
        }

        if (!access.userActive) {
          setState({
            status: "blocked",
            access,
            message:
              "Seu acesso ao painel está suspenso. Entre em contato com o administrador.",
          });
          return;
        }

        const isSubscriptionPage = pathname === "/painel/assinatura";

        if (!access.clientActive && !isSubscriptionPage) {
          setState({
            status: "blocked",
            access,
            message:
              "Seu catálogo está suspenso. Acesse a assinatura para consultar ou regularizar a mensalidade.",
          });
          return;
        }

        setState({
          status: "allowed",
          access,
          message: "",
        });
      } catch (error) {
        console.error(error);

        if (active) {
          setState({
            status: "error",
            access: null,
            message:
              "Não foi possível verificar seu acesso. Confira a conexão e tente novamente.",
          });
        }
      }
    }

    void verifyAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/painel/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabaseConfigured]);

  async function signOut() {
    try {
      const supabase = getClientSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/painel/login");
      router.refresh();
    }
  }

  if (state.status === "checking") {
    return (
      <main className={styles.accessPage}>
        <section className={styles.accessCard}>
          <span className={styles.accessMark}>H</span>
          <div className={styles.accessSpinner} />
          <h1>Verificando seu acesso</h1>
          <p>Estamos confirmando sua conta e o catálogo vinculado.</p>
        </section>
      </main>
    );
  }

  if (state.status === "blocked") {
    const canRegularize =
      state.access.userActive && !state.access.clientActive;

    return (
      <main className={styles.accessPage}>
        <section className={styles.accessCard}>
          <span className={styles.accessMark}>H</span>
          <span className={styles.blockedBadge}>Acesso suspenso</span>
          <h1>{state.access.clientName}</h1>
          <p>{state.message}</p>
          {canRegularize ? (
            <Link href="/painel/assinatura">
              Abrir minha assinatura
            </Link>
          ) : null}
          <button type="button" onClick={signOut}>
            Voltar para o login
          </button>
        </section>
      </main>
    );
  }

  if (state.status === "unlinked" || state.status === "error") {
    return (
      <main className={styles.accessPage}>
        <section className={styles.accessCard}>
          <span className={styles.accessMark}>H</span>
          <span className={styles.errorBadge}>Acesso não liberado</span>
          <h1>Não foi possível abrir o painel</h1>
          <p>{state.message}</p>
          <div className={styles.accessActions}>
            <button type="button" onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
            <button type="button" onClick={signOut}>
              Sair
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ClientAccessContext.Provider value={state.access}>
      {children}
    </ClientAccessContext.Provider>
  );
}
