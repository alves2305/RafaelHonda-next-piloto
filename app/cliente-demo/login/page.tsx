"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "../cliente-demo.module.css";

export default function ClientDemoLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      router.push("/cliente-demo/dashboard");
    }, 450);
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginBrand}>
        <div className={styles.brandMark}>H</div>
        <span className={styles.prototypeBadge}>Protótipo visual</span>

        <h1>Seu catálogo Honda nas suas mãos.</h1>

        <p>
          Um painel simples para o vendedor personalizar o próprio perfil,
          escolher as motos exibidas e acompanhar o catálogo sem alterar preços
          ou dados de outros usuários.
        </p>

        <div className={styles.loginBenefits}>
          <article>
            <span>01</span>
            <div>
              <strong>Perfil personalizado</strong>
              <p>Foto, WhatsApp, Instagram, slogan e cores.</p>
            </div>
          </article>

          <article>
            <span>02</span>
            <div>
              <strong>Controle das próprias motos</strong>
              <p>Ative ou oculte modelos já liberados pelo administrador.</p>
            </div>
          </article>

          <article>
            <span>03</span>
            <div>
              <strong>Base protegida</strong>
              <p>Valores e estrutura continuam centralizados com Rafael.</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.loginFormArea}>
        <form className={styles.loginCard} onSubmit={handleSubmit}>
          <div className={styles.loginCardHeading}>
            <span>GD</span>
            <div>
              <small>Área do vendedor</small>
              <h2>Acessar meu catálogo</h2>
            </div>
          </div>

          <p className={styles.loginIntro}>
            Entre com seu e-mail e senha para administrar somente o seu perfil.
          </p>

          <label>
            E-mail
            <input
              type="email"
              defaultValue="gd@demo.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              defaultValue="123456"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            <span>{loading ? "Entrando..." : "Entrar no painel"}</span>
            <strong aria-hidden="true">→</strong>
          </button>

          <div className={styles.demoNotice}>
            <strong>Demonstração</strong>
            <p>
              Os campos já estão preenchidos. Este login não usa Supabase e não
              salva dados reais.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
