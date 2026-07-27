"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type ClientRow = {
  id: string;
  nome: string;
  slug: string;
  foto_url: string;
  whatsapp: string;
  instagram_url: string | null;
  ativo: boolean;
  criado_em: string;
};

type ClientMotorcycleRow = {
  cliente_id: string;
  ativo: boolean;
};

type ClientView = ClientRow & {
  motorcyclesCount: number;
};

type StatusFilter = "todos" | "ativos" | "inativos";

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return value;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientView[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: clientData, error: clientError },
        { data: linkData, error: linkError },
      ] = await Promise.all([
        supabase
          .from("clientes")
          .select(
            "id,nome,slug,foto_url,whatsapp,instagram_url,ativo,criado_em",
          )
          .order("nome"),
        supabase.from("cliente_motos").select("cliente_id,ativo"),
      ]);

      if (clientError) {
        throw clientError;
      }

      if (linkError) {
        throw linkError;
      }

      const motorcycleCountByClient = new Map<string, number>();

      for (const link of (linkData ?? []) as ClientMotorcycleRow[]) {
        if (!link.ativo) {
          continue;
        }

        motorcycleCountByClient.set(
          link.cliente_id,
          (motorcycleCountByClient.get(link.cliente_id) ?? 0) + 1,
        );
      }

      const nextClients = ((clientData ?? []) as ClientRow[]).map((client) => ({
        ...client,
        motorcyclesCount: motorcycleCountByClient.get(client.id) ?? 0,
      }));

      setClients(nextClients);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar os clientes. Verifique sua conexão e as políticas do Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 3500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        client.nome.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        client.slug.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        client.whatsapp.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && client.ativo) ||
        (statusFilter === "inativos" && !client.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const activeCount = clients.filter((client) => client.ativo).length;
  const inactiveCount = clients.length - activeCount;

  async function toggleClientStatus(client: ClientView) {
    const nextStatus = !client.ativo;

    if (
      !nextStatus &&
      !window.confirm(
        `Bloquear o catálogo de ${client.nome}? O endereço público deixará de exibir as motos até ser reativado.`,
      )
    ) {
      return;
    }

    setUpdatingId(client.id);
    setError("");
    setFeedback("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data, error: updateError } = await supabase
        .from("clientes")
        .update({ ativo: nextStatus })
        .eq("id", client.id)
        .select(
          "id,nome,slug,foto_url,whatsapp,instagram_url,ativo,criado_em",
        )
        .single<ClientRow>();

      if (updateError) {
        throw updateError;
      }

      setClients((currentClients) =>
        currentClients.map((currentClient) =>
          currentClient.id === client.id
            ? {
                ...currentClient,
                ...data,
              }
            : currentClient,
        ),
      );

      setFeedback(
        nextStatus
          ? `${client.nome} foi reativado com sucesso.`
          : `${client.nome} foi bloqueado com sucesso.`,
      );
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível alterar o status. Confirme se o SQL de segurança foi executado com seu administrador.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminShell
      title="Clientes"
      description="Gerencie os perfis que utilizam o catálogo centralizado."
    >
      <section className={styles.clientsHero}>
        <div>
          <span className={styles.sectionEyebrow}>Gestão de clientes</span>
          <h2>Perfis do catálogo</h2>
          <p>
            Consulte os vendedores cadastrados e bloqueie ou reative cada
            catálogo sem acessar o Table Editor.
          </p>
        </div>

        <Link
          className={styles.primaryAdminButton}
          href="/admin/clientes/novo"
        >
          <span aria-hidden="true">+</span>
          Novo cliente
          <small>Cadastrar perfil</small>
        </Link>
      </section>

      <section className={styles.clientStatsGrid} aria-label="Resumo de clientes">
        <article>
          <span>Total</span>
          <strong>{clients.length}</strong>
          <small>perfis cadastrados</small>
        </article>

        <article>
          <span>Ativos</span>
          <strong>{activeCount}</strong>
          <small>catálogos funcionando</small>
        </article>

        <article>
          <span>Bloqueados</span>
          <strong>{inactiveCount}</strong>
          <small>catálogos indisponíveis</small>
        </article>
      </section>

      <section className={styles.clientsPanel}>
        <div className={styles.clientsToolbar}>
          <label className={styles.adminSearchField}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, endereço ou WhatsApp"
              aria-label="Pesquisar clientes"
            />
          </label>

          <div className={styles.statusFilters} aria-label="Filtrar por status">
            {(
              [
                ["todos", "Todos"],
                ["ativos", "Ativos"],
                ["inativos", "Bloqueados"],
              ] as const
            ).map(([value, label]) => (
              <button
                className={
                  statusFilter === value ? styles.statusFilterActive : ""
                }
                type="button"
                key={value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {feedback ? (
          <p className={styles.adminSuccessMessage} role="status">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <div className={styles.adminErrorBox} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadClients()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.adminListLoading}>
            <span />
            <p>Carregando clientes...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className={styles.clientsTable}>
            <div className={styles.clientsTableHeader} aria-hidden="true">
              <span>Cliente</span>
              <span>Contato</span>
              <span>Catálogo</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {filteredClients.map((client) => (
              <article className={styles.adminClientRow} key={client.id}>
                <div className={styles.adminClientIdentity}>
                  <Image
                    src={client.foto_url}
                    alt={`Foto de ${client.nome}`}
                    width={52}
                    height={52}
                    unoptimized
                  />

                  <div>
                    <strong>{client.nome}</strong>
                    <span>/{client.slug}</span>
                  </div>
                </div>

                <div className={styles.adminClientContact}>
                  <strong>{formatWhatsApp(client.whatsapp)}</strong>
                  <span>
                    {client.instagram_url
                      ? "Instagram configurado"
                      : "Sem Instagram"}
                  </span>
                </div>

                <div className={styles.adminClientCatalogCount}>
                  <strong>{client.motorcyclesCount}</strong>
                  <span>motos ativas</span>
                </div>

                <span
                  className={
                    client.ativo
                      ? styles.clientStatusActive
                      : styles.clientStatusInactive
                  }
                >
                  <i />
                  {client.ativo ? "Ativo" : "Bloqueado"}
                </span>

                <div className={styles.adminClientActions}>
                  <Link href={`/admin/clientes/${client.id}`}>
                    Editar
                  </Link>

                  <Link href={`/admin/clientes/${client.id}/motos`}>
                    Motos
                  </Link>

                  <Link href={`/${client.slug}`} target="_blank">
                    Abrir catálogo
                  </Link>

                  <button
                    type="button"
                    className={
                      client.ativo
                        ? styles.blockClientButton
                        : styles.activateClientButton
                    }
                    disabled={updatingId === client.id}
                    onClick={() => void toggleClientStatus(client)}
                  >
                    {updatingId === client.id
                      ? "Salvando..."
                      : client.ativo
                        ? "Bloquear"
                        : "Reativar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.adminEmptyState}>
            <strong>Nenhum cliente encontrado.</strong>
            <p>Altere a busca ou o filtro selecionado.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
