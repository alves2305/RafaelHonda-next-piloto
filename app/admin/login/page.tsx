"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import styles from "@/app/admin/admin.module.css";
import {
  getAdminSupabaseClient,
  isAdminSupabaseConfigured,
} from "@/lib/admin-supabase";

function translateAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (normalizedMessage.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível entrar. Confira os dados e tente novamente.";
}

async function userHasAdminAccess(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("usuario_e_admin");

  if (error) {
    throw error;
  }

  return data === true;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdminSupabaseConfigured()) {
      setCheckingSession(false);
      return;
    }

    const supabase = getAdminSupabaseClient();
    let active = true;

    async function checkExistingSession() {
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

      try {
        const isAdmin = await userHasAdminAccess(supabase);

        if (!active) {
          return;
        }

        if (isAdmin) {
          router.replace("/admin/dashboard");
          return;
        }

        await supabase.auth.signOut();
        setError("Este usuário não possui permissão administrativa.");
      } catch {
        setError(
          "A segurança administrativa ainda não foi configurada no Supabase.",
        );
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    void checkExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha o e-mail e a senha para continuar.");
      return;
    }

    if (!isAdminSupabaseConfigured()) {
      setError(
        "O Supabase ainda não está configurado nas variáveis de ambiente.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getAdminSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(translateAuthError(signInError.message));
        return;
      }

      const isAdmin = await userHasAdminAccess(supabase);

      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("Este usuário não possui permissão administrativa.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError(
        "Não foi possível validar sua permissão. Execute o SQL da Entrega 3 no Supabase.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className={styles.adminLoading}>
        <span className={styles.adminLoadingMark}>H</span>
        <p>Verificando acesso...</p>
      </main>
    );
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginBrandPanel}>
        <div className={styles.loginBrandContent}>
          <span className={styles.adminBadge}>Catálogo Honda 2.0</span>

          <h1>Administre todo o catálogo em um só lugar.</h1>

          <p>
            Clientes, motos e planos centralizados em uma estrutura preparada
            para crescer.
          </p>

          <div className={styles.loginBenefits}>
            <div>
              <span>01</span>
              <strong>Atualização centralizada</strong>
              <p>Altere uma vez e distribua para todos os clientes.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Perfis personalizados</strong>
              <p>Gerencie dados e identidade visual de cada vendedor.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Controle simplificado</strong>
              <p>Menos SQL e mais tempo para administrar o negócio.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.loginFormPanel}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeading}>
            <span className={styles.loginIcon} aria-hidden="true">
              H
            </span>

            <div>
              <p>Painel administrativo</p>
              <h2>Bem-vindo de volta</h2>
            </div>
          </div>

          <p className={styles.loginDescription}>
            Entre com um usuário autorizado como administrador.
          </p>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                disabled={submitting}
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
              />
            </label>

            {error ? (
              <p className={styles.loginError} role="alert">
                {error}
              </p>
            ) : null}

            <button
              className={styles.loginButton}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Validando acesso..." : "Entrar no painel"}
              <span aria-hidden="true">{submitting ? "…" : "→"}</span>
            </button>
          </form>

          <div className={styles.previewNotice}>
            <strong>Acesso administrativo protegido</strong>
            <p>
              Além da senha correta, o usuário precisa estar autorizado na
              tabela de administradores.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
