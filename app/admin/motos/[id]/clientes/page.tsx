"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleData = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
};

type ClientRow = {
  id: string;
  nome: string;
  slug: string;
  whatsapp: string;
  ativo: boolean;
};

type RelationRow = {
  cliente_id: string;
  ativo: boolean;
  ordem: number;
};

export default function MotorcycleClientsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [motorcycle, setMotorcycle] = useState<MotorcycleData | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [relations, setRelations] = useState<Map<string, RelationRow>>(
    new Map(),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: clientData, error: clientError },
        { data: relationData, error: relationError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,nome,slug,ordem")
          .eq("id", params.id)
          .maybeSingle<MotorcycleData>(),
        supabase
          .from("clientes")
          .select("id,nome,slug,whatsapp,ativo")
          .order("nome"),
        supabase
          .from("cliente_motos")
          .select("cliente_id,ativo,ordem")
          .eq("moto_id", params.id),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (!motorcycleData) {
        setError("Moto não encontrada.");
        return;
      }

      if (clientError) {
        throw clientError;
      }

      if (relationError) {
        throw relationError;
      }

      const nextRelations = new Map(
        ((relationData ?? []) as RelationRow[]).map((relation) => [
          relation.cliente_id,
          relation,
        ]),
      );

      const activeIds = new Set(
        ((relationData ?? []) as RelationRow[])
          .filter((relation) => relation.ativo)
          .map((relation) => relation.cliente_id),
      );

      setMotorcycle(motorcycleData);
      setClients((clientData ?? []) as ClientRow[]);
      setRelations(nextRelations);
      setSelectedIds(activeIds);
      setInitialSelectedIds(new Set(activeIds));
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar os vendedores. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return clients.filter(
      (client) =>
        !normalizedSearch ||
        client.nome
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        client.slug
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        client.whatsapp.includes(normalizedSearch),
    );
  }, [clients, search]);

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== initialSelectedIds.size) {
      return true;
    }

    return Array.from(selectedIds).some(
      (clientId) => !initialSelectedIds.has(clientId),
    );
  }, [selectedIds, initialSelectedIds]);

  function toggleClient(clientId: string) {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(clientId)) {
        nextIds.delete(clientId);
      } else {
        nextIds.add(clientId);
      }

      return nextIds;
    });

    setError("");
    setSuccess("");
  }

  function selectVisible() {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      for (const client of filteredClients) {
        nextIds.add(client.id);
      }

      return nextIds;
    });

    setError("");
    setSuccess("");
  }

  function clearVisible() {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      for (const client of filteredClients) {
        nextIds.delete(client.id);
      }

      return nextIds;
    });

    setError("");
    setSuccess("");
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm("Descartar as alterações nos vendedores?")
    ) {
      return;
    }

    setSelectedIds(new Set(initialSelectedIds));
    setError("");
    setSuccess("");
  }

  async function saveClients() {
    if (!motorcycle || !hasChanges) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const payload = clients.map((client) => ({
        cliente_id: client.id,
        moto_id: motorcycle.id,
        ativo: selectedIds.has(client.id),
        ordem:
          relations.get(client.id)?.ordem ??
          motorcycle.ordem,
      }));

      const { error: upsertError } = await supabase
        .from("cliente_motos")
        .upsert(payload, {
          onConflict: "cliente_id,moto_id",
        });

      if (upsertError) {
        throw upsertError;
      }

      setInitialSelectedIds(new Set(selectedIds));
      setSuccess(
        `${selectedIds.size} vendedor${
          selectedIds.size === 1 ? "" : "es"
        } selecionado${selectedIds.size === 1 ? "" : "s"}.`,
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar os vendedores. Confirme sua permissão administrativa.",
      );
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (
      hasChanges &&
      !window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?")
    ) {
      return;
    }

    router.push(`/admin/motos/${params.id}/configuracao`);
  }

  return (
    <AdminShell
      title="Vendedores da moto"
      description="Escolha em quais catálogos este modelo aparecerá."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para configuração
        </button>

        {motorcycle ? (
          <Link href={`/admin/motos/${motorcycle.id}`}>
            Editar dados da moto
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando vendedores...</p>
        </div>
      ) : motorcycle ? (
        <>
          <section className={styles.motorcycleClientHero}>
            <div>
              <span className={styles.sectionEyebrow}>
                Catálogos individuais
              </span>
              <h2>{motorcycle.nome}</h2>
              <p>
                A seleção altera apenas onde a moto aparece. Os dados e planos
                continuam centralizados.
              </p>
            </div>

            <div>
              <span>Selecionados</span>
              <strong>{selectedIds.size}</strong>
              <small>de {clients.length} vendedores</small>
            </div>
          </section>

          <section className={styles.motorcycleClientPanel}>
            <div className={styles.motorcycleClientToolbar}>
              <label className={styles.adminSearchField}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar nome, endereço ou WhatsApp"
                  aria-label="Pesquisar vendedores"
                />
              </label>

              <div>
                <button type="button" onClick={selectVisible}>
                  Marcar visíveis
                </button>

                <button type="button" onClick={clearVisible}>
                  Desmarcar visíveis
                </button>
              </div>
            </div>

            {success ? (
              <p className={styles.adminSuccessMessage} role="status">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className={styles.editClientError} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.motorcycleClientGrid}>
              {filteredClients.map((client) => {
                const selected = selectedIds.has(client.id);

                return (
                  <label
                    className={`${styles.motorcycleClientCard} ${
                      selected
                        ? styles.motorcycleClientCardSelected
                        : ""
                    }`}
                    key={client.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleClient(client.id)}
                    />

                    <span className={styles.motorcycleClientCheck}>
                      {selected ? "✓" : ""}
                    </span>

                    <div>
                      <strong>{client.nome}</strong>
                      <span>/{client.slug}</span>
                      <small>{client.whatsapp}</small>
                    </div>

                    <em
                      className={
                        client.ativo
                          ? styles.motorcycleClientActive
                          : styles.motorcycleClientInactive
                      }
                    >
                      {client.ativo ? "Catálogo ativo" : "Catálogo bloqueado"}
                    </em>
                  </label>
                );
              })}
            </div>

            {filteredClients.length === 0 ? (
              <div className={styles.adminEmptyState}>
                <strong>Nenhum vendedor encontrado.</strong>
                <p>Altere a pesquisa informada.</p>
              </div>
            ) : null}

            <div className={styles.motorcycleClientFooter}>
              <div>
                <strong>
                  {selectedIds.size} vendedor
                  {selectedIds.size === 1 ? "" : "es"} selecionado
                  {selectedIds.size === 1 ? "" : "s"}
                </strong>

                <span>
                  {hasChanges
                    ? "Existem alterações ainda não salvas."
                    : "A seleção está atualizada."}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={!hasChanges || saving}
                >
                  Descartar
                </button>

                <button
                  className={styles.saveClientButton}
                  type="button"
                  onClick={() => void saveClients()}
                  disabled={!hasChanges || saving}
                >
                  {saving ? "Salvando..." : "Salvar vendedores"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className={styles.adminErrorBox}>
          <p>{error || "Moto não encontrada."}</p>
          <Link href="/admin/motos">Voltar para motos</Link>
        </div>
      )}
    </AdminShell>
  );
}
