"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type DashboardClient = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

type DashboardData = {
  clientsCount: number;
  activeClientsCount: number;
  motorcyclesCount: number;
  plansCount: number;
  clients: DashboardClient[];
};

const initialData: DashboardData = {
  clientsCount: 0,
  activeClientsCount: 0,
  motorcyclesCount: 0,
  plansCount: 0,
  clients: [],
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const supabase = getAdminSupabaseClient();

        const [
          clientsResult,
          motorcyclesResult,
          plansResult,
          activeClientsResult,
          clientListResult,
        ] = await Promise.all([
          supabase
            .from("clientes")
            .select("id", { count: "exact", head: true }),
          supabase.from("motos").select("id", { count: "exact", head: true }),
          supabase
            .from("planos_consorcio")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("clientes")
            .select("id", { count: "exact", head: true })
            .eq("ativo", true),
          supabase
            .from("clientes")
            .select("id,nome,slug,ativo")
            .order("nome")
            .limit(4),
        ]);

        const firstError =
          clientsResult.error ??
          motorcyclesResult.error ??
          plansResult.error ??
          activeClientsResult.error ??
          clientListResult.error;

        if (firstError) {
          throw firstError;
        }

        if (!active) {
          return;
        }

        setData({
          clientsCount: clientsResult.count ?? 0,
          activeClientsCount: activeClientsResult.count ?? 0,
          motorcyclesCount: motorcyclesResult.count ?? 0,
          plansCount: plansResult.count ?? 0,
          clients: (clientListResult.data ?? []) as DashboardClient[],
        });
      } catch (error) {
        console.error("Falha ao carregar o dashboard:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = [
    {
      label: "Clientes",
      value: loading ? "—" : String(data.clientsCount),
      detail: `${data.activeClientsCount} perfis ativos`,
      icon: "C",
    },
    {
      label: "Motos",
      value: loading ? "—" : String(data.motorcyclesCount),
      detail: "Catálogo centralizado",
      icon: "M",
    },
    {
      label: "Planos",
      value: loading ? "—" : String(data.plansCount),
      detail: "Valores centralizados",
      icon: "P",
    },
    {
      label: "Segurança",
      value: "Ativa",
      detail: "Autenticação e RLS",
      icon: "S",
    },
  ];

  return (
    <AdminShell
      title="Visão geral"
      description="Acompanhe a estrutura centralizada do seu catálogo."
    >
      <section className={styles.welcomePanel}>
        <div>
          <span className={styles.sectionEyebrow}>Painel administrativo</span>
          <h2>Boa noite, Rafael! 👋</h2>
          <p>
            Clientes, motos e planos já podem ser administrados diretamente
            pelo painel, mantendo uma única base para todos os vendedores.
          </p>
        </div>

        <div className={styles.welcomeProgress}>
          <span>Fase atual</span>
          <strong>Gestão central de motos</strong>
          <div>
            <i />
          </div>
          <small>Conteúdo e ordem dos modelos disponíveis</small>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Resumo do sistema">
        {summaryCards.map((card) => (
          <article className={styles.summaryCard} key={card.label}>
            <span className={styles.summaryIcon}>{card.icon}</span>

            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.dashboardColumns}>
        <section className={styles.dashboardPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>Perfis cadastrados</span>
              <h2>Clientes</h2>
            </div>

            <Link className={styles.panelTextLink} href="/admin/clientes">
              Ver todos →
            </Link>
          </div>

          <div className={styles.clientList}>
            {data.clients.map((client) => (
              <article className={styles.clientRow} key={client.id}>
                <span className={styles.clientAvatar}>
                  {client.nome
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>

                <div className={styles.clientInfo}>
                  <strong>{client.nome}</strong>
                  <span>/{client.slug}</span>
                </div>

                <span
                  className={
                    client.ativo
                      ? styles.activeStatus
                      : styles.dashboardInactiveStatus
                  }
                >
                  <i />
                  {client.ativo ? "Ativo" : "Bloqueado"}
                </span>

                <Link
                  className={styles.dashboardManageLink}
                  href="/admin/clientes"
                >
                  Gerenciar
                </Link>
              </article>
            ))}

            {!loading && data.clients.length === 0 ? (
              <div className={styles.adminEmptyState}>
                <strong>Nenhum cliente cadastrado.</strong>
              </div>
            ) : null}
          </div>
        </section>

        <aside className={styles.dashboardPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>Desenvolvimento</span>
              <h2>Próximas entregas</h2>
            </div>
          </div>

          <div className={styles.timeline}>
            <div className={styles.timelineActive}>
              <span>1</span>
              <div>
                <strong>Listagem de clientes</strong>
                <p>Busca, status e acesso ao catálogo.</p>
              </div>
            </div>

            <div>
              <span>2</span>
              <div>
                <strong>Editar perfil</strong>
                <p>Nome, WhatsApp, Instagram, cores e imagens.</p>
              </div>
            </div>

            <div className={styles.timelineActive}>
              <span>3</span>
              <div>
                <strong>Novo cliente</strong>
                <p>Cadastro completo sem utilizar SQL.</p>
              </div>
            </div>

            <div>
              <span>4</span>
              <div>
                <strong>Catálogo individual</strong>
                <p>Selecionar as motos de cada vendedor.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className={styles.quickActionsSection}>
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>Acesso rápido</span>
            <h2>Administração do sistema</h2>
          </div>
        </div>

        <div className={styles.quickActionsGrid}>
          <article className={styles.quickActionCard}>
            <span>Disponível agora</span>
            <h3>Gerenciar clientes</h3>
            <p>Consulte os perfis e controle quais catálogos estão ativos.</p>
            <Link className={styles.quickActionLink} href="/admin/clientes">
              Abrir área
              <i aria-hidden="true">→</i>
            </Link>
          </article>

          <article className={styles.quickActionCard}>
            <span>Disponível agora</span>
            <h3>Gerenciar motos</h3>
            <p>Edite conteúdo, status e ordem do catálogo central.</p>
            <Link className={styles.quickActionLink} href="/admin/motos">
              Abrir motos
              <i aria-hidden="true">→</i>
            </Link>
          </article>

          <article className={styles.quickActionCard}>
            <span>Disponível agora</span>
            <h3>Atualizar planos</h3>
            <p>Altere os valores uma vez para todos os vendedores.</p>
            <Link className={styles.quickActionLink} href="/admin/planos">
              Abrir planos
              <i aria-hidden="true">→</i>
            </Link>
          </article>

          <article className={styles.quickActionCard}>
            <span>Disponível agora</span>
            <h3>Financiamentos</h3>
            <p>Edite os textos e a disponibilidade por modelo.</p>
            <Link
              className={styles.quickActionLink}
              href="/admin/financiamentos"
            >
              Abrir financiamentos
              <i aria-hidden="true">→</i>
            </Link>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}
