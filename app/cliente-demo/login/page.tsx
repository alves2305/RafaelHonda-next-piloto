"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { loadCurrentClientAccess } from "@/lib/client-access";
import {
  getClientSupabaseClient,
  isClientSupabaseConfigured,
} from "@/lib/client-supabase";

import styles from "../cliente-demo.module.css";

function translateAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "O e-mail desta conta ainda não foi confirmado.";
  }

  if (normalizedMessage.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível entrar. Confira os dados e tente novamente.";
}

export default function ClientDemoLoginPage() {
  const router = useRouter();
  const supabaseConfigured = isClientSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(supabaseConfigured);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = getClientSupabaseClient();
    let active = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (!session) {
          setCheckingSession(false);
          return;
        }

        const access = await loadCurrentClientAccess(supabase);

        if (!active) {
          return;
        }

        if (access?.accessAllowed) {
          router.replace("/cliente-demo/dashboard");
          return;
        }

        await supabase.auth.signOut();

        if (!active) {
          return;
        }

        setError(
          access
            ? "O acesso desta conta está suspenso."
            : "Esta conta ainda não foi vinculada a um catálogo.",
        );
      } catch (sessionError) {
        console.error(sessionError);

        if (active) {
          setError("Não foi possível verificar a sessão atual.");
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkExistingSession();

    return () => {
      active = false;
    };
  }, [router, supabaseConfigured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha o e-mail e a senha para continuar.");
      return;
    }

    if (!isClientSupabaseConfigured()) {
      setError(
        "O Supabase ainda não está configurado nas variáveis de ambiente.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getClientSupabaseClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(translateAuthError(signInError.message));
        return;
      }

      const access = await loadCurrentClientAccess(supabase);

      if (!access) {
        await supabase.auth.signOut();
        setError("Esta conta ainda não foi vinculada a um catálogo.");
        return;
      }

      if (!access.accessAllowed) {
        await supabase.auth.signOut();
        setError(
          "O acesso desta conta está suspenso. Entre em contato com o administrador.",
        );
        return;
      }

      router.replace("/cliente-demo/dashboard");
      router.refresh();
    } catch (loginError) {
      console.error(loginError);
      setError("Não foi possível conectar ao Supabase.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className={styles.clientLoginChecking}>
        <span>H</span>
        <p>Verificando acesso...</p>
      </main>
    );
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginBrand}>
        <div className={styles.brandMark}>H</div>
        <span className={styles.prototypeBadge}>Acesso protegido</span>

        <h1>Seu catálogo Honda nas suas mãos.</h1>

        <p>
          Entre na área exclusiva para acompanhar seu catálogo. Cada conta fica
          vinculada somente ao vendedor autorizado pelo administrador.
        </p>

        <div className={styles.loginBenefits}>
          <article>
            <span>01</span>
            <div>
              <strong>Conta individual</strong>
              <p>Seu usuário abre somente o catálogo ligado ao seu acesso.</p>
            </div>
          </article>

          <article>
            <span>02</span>
            <div>
              <strong>Sessão protegida</strong>
              <p>O login permanece ativo até você utilizar o botão Sair.</p>
            </div>
          </article>

          <article>
            <span>03</span>
            <div>
              <strong>Controle administrativo</strong>
              <p>O acesso pode ser suspenso sem apagar seus dados.</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.loginFormArea}>
        <form className={styles.loginCard} onSubmit={handleSubmit}>
          <div className={styles.loginCardHeading}>
            <span>H</span>
            <div>
              <small>Painel do vendedor</small>
              <h2>Acessar meu catálogo</h2>
            </div>
          </div>

          <p className={styles.loginIntro}>
            Utilize o e-mail e a senha cadastrados pelo administrador.
          </p>

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              disabled={submitting}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </label>

          {error ? (
            <p className={styles.clientLoginError} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting}>
            <span>{submitting ? "Entrando..." : "Entrar no painel"}</span>
            <strong aria-hidden="true">{submitting ? "…" : "→"}</strong>
          </button>

          <div className={styles.demoNotice}>
            <strong>Primeira etapa real</strong>
            <p>
              O login, a sessão e o bloqueio já são reais. As edições internas
              do protótipo ainda não são gravadas no banco.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
