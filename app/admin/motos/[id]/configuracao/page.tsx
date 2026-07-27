"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleData = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  ativo: boolean;
};

type SetupData = {
  motorcycle: MotorcycleData | null;
  activePlans: number;
  financingActive: boolean;
  selectedClients: number;
};

const INITIAL_DATA: SetupData = {
  motorcycle: null,
  activePlans: 0,
  financingActive: false,
  selectedClients: 0,
};

export default function MotorcycleSetupPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<SetupData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        motorcycleResult,
        plansResult,
        financingResult,
        clientsResult,
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,slug,nome,categoria,imagem_url,ativo")
          .eq("id", params.id)
          .maybeSingle<MotorcycleData>(),
        supabase
          .from("planos_consorcio")
          .select("id", { count: "exact", head: true })
          .eq("moto_id", params.id)
          .eq("ativo", true),
        supabase
          .from("informacoes_financiamento")
          .select("id")
          .eq("moto_id", params.id)
          .eq("ativo", true)
          .maybeSingle<{ id: string }>(),
        supabase
          .from("cliente_motos")
          .select("cliente_id", { count: "exact", head: true })
          .eq("moto_id", params.id)
          .eq("ativo", true),
      ]);

      const firstError =
        motorcycleResult.error ??
        plansResult.error ??
        financingResult.error ??
        clientsResult.error;

      if (firstError) {
        throw firstError;
      }

      setData({
        motorcycle: motorcycleResult.data,
        activePlans: plansResult.count ?? 0,
        financingActive: Boolean(financingResult.data),
        selectedClients: clientsResult.count ?? 0,
      });
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar a configuração da moto. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  const hasCommercialOption =
    data.activePlans > 0 || data.financingActive;

  const readyToActivate =
    hasCommercialOption && data.selectedClients > 0;

  const completedSteps = useMemo(() => {
    let total = 1;

    if (data.activePlans > 0) {
      total += 1;
    }

    if (data.financingActive) {
      total += 1;
    }

    if (data.selectedClients > 0) {
      total += 1;
    }

    return total;
  }, [
    data.activePlans,
    data.financingActive,
    data.selectedClients,
  ]);

  async function toggleActivation() {
    if (!data.motorcycle) {
      return;
    }

    const nextStatus = !data.motorcycle.ativo;

    if (nextStatus && !readyToActivate) {
      setError(
        "Antes de ativar, configure pelo menos uma opção comercial e selecione um cliente.",
      );
      return;
    }

    if (
      !nextStatus &&
      !window.confirm(
        `Desativar a ${data.motorcycle.nome}? Ela deixará de aparecer em todos os catálogos.`,
      )
    ) {
      return;
    }

    setUpdating(true);
    setError("");
    setFeedback("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data: updatedMotorcycle, error: updateError } = await supabase
        .from("motos")
        .update({ ativo: nextStatus })
        .eq("id", data.motorcycle.id)
        .select("id,slug,nome,categoria,imagem_url,ativo")
        .single<MotorcycleData>();

      if (updateError) {
        throw updateError;
      }

      setData((currentData) => ({
        ...currentData,
        motorcycle: updatedMotorcycle,
      }));

      setFeedback(
        nextStatus
          ? `${updatedMotorcycle.nome} foi publicada com sucesso.`
          : `${updatedMotorcycle.nome} foi desativada.`,
      );
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível alterar a publicação da moto. Confirme sua permissão administrativa.",
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <AdminShell
        title="Configurar moto"
        description="Prepare o modelo antes da publicação."
      >
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando configuração...</p>
        </div>
      </AdminShell>
    );
  }

  if (!data.motorcycle) {
    return (
      <AdminShell
        title="Configurar moto"
        description="Prepare o modelo antes da publicação."
      >
        <div className={styles.adminErrorBox}>
          <p>{error || "Moto não encontrada."}</p>
          <Link href="/admin/motos">Voltar para motos</Link>
        </div>
      </AdminShell>
    );
  }

  const motorcycle = data.motorcycle;

  return (
    <AdminShell
      title="Configurar moto"
      description="Complete as etapas necessárias antes de publicar."
    >
      <div className={styles.editClientTopbar}>
        <Link href="/admin/motos">← Voltar para motos</Link>

        {motorcycle.ativo ? (
          <Link href={`/rafael/moto/${motorcycle.slug}`} target="_blank">
            Visualizar página pública ↗
          </Link>
        ) : null}
      </div>

      <section className={styles.motorcycleSetupHero}>
        <div className={styles.motorcycleSetupIdentity}>
          <Image
            src={motorcycle.imagem_url}
            alt={motorcycle.nome}
            width={190}
            height={130}
            unoptimized
          />

          <div>
            <span className={styles.sectionEyebrow}>Preparação do modelo</span>
            <h2>{motorcycle.nome}</h2>
            <p>{motorcycle.categoria}</p>
          </div>
        </div>

        <div className={styles.motorcycleSetupProgress}>
          <span>Progresso</span>
          <strong>{completedSteps}/4 etapas</strong>

          <div>
            <i style={{ width: `${completedSteps * 25}%` }} />
          </div>

          <small>
            {motorcycle.ativo
              ? "Modelo publicado"
              : "Modelo ainda não publicado"}
          </small>
        </div>
      </section>

      {feedback ? (
        <p className={styles.adminSuccessMessage} role="status">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className={styles.editClientError} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.motorcycleSetupGrid}>
        <article className={styles.motorcycleSetupCard}>
          <span className={styles.motorcycleSetupCardDone}>✓</span>
          <div>
            <small>Etapa 1</small>
            <h3>Dados do modelo</h3>
            <p>
              Nome, imagem, descrição, ficha técnica e benefícios cadastrados.
            </p>
          </div>

          <Link href={`/admin/motos/${motorcycle.id}`}>
            Revisar dados →
          </Link>
        </article>

        <article className={styles.motorcycleSetupCard}>
          <span
            className={
              data.activePlans > 0
                ? styles.motorcycleSetupCardDone
                : styles.motorcycleSetupCardPending
            }
          >
            {data.activePlans > 0 ? "✓" : "2"}
          </span>

          <div>
            <small>Etapa 2</small>
            <h3>Planos de consórcio</h3>
            <p>
              {data.activePlans > 0
                ? `${data.activePlans} plano${
                    data.activePlans === 1 ? "" : "s"
                  } ativo${data.activePlans === 1 ? "" : "s"}.`
                : "Nenhum plano ativo cadastrado."}
            </p>
          </div>

          <Link href={`/admin/planos/${motorcycle.id}`}>
            {data.activePlans > 0 ? "Editar planos" : "Cadastrar planos"} →
          </Link>
        </article>

        <article className={styles.motorcycleSetupCard}>
          <span
            className={
              data.financingActive
                ? styles.motorcycleSetupCardDone
                : styles.motorcycleSetupCardOptional
            }
          >
            {data.financingActive ? "✓" : "3"}
          </span>

          <div>
            <small>Etapa 3 • opcional</small>
            <h3>Financiamento</h3>
            <p>
              {data.financingActive
                ? "Simulação ativa para esta moto."
                : "Configure caso o modelo também tenha financiamento."}
            </p>
          </div>

          <Link href={`/admin/financiamentos/${motorcycle.id}`}>
            {data.financingActive ? "Editar financiamento" : "Configurar"} →
          </Link>
        </article>

        <article className={styles.motorcycleSetupCard}>
          <span
            className={
              data.selectedClients > 0
                ? styles.motorcycleSetupCardDone
                : styles.motorcycleSetupCardPending
            }
          >
            {data.selectedClients > 0 ? "✓" : "4"}
          </span>

          <div>
            <small>Etapa 4</small>
            <h3>Vendedores</h3>
            <p>
              {data.selectedClients > 0
                ? `${data.selectedClients} cliente${
                    data.selectedClients === 1 ? "" : "s"
                  } selecionado${data.selectedClients === 1 ? "" : "s"}.`
                : "A moto ainda não está vinculada a nenhum catálogo."}
            </p>
          </div>

          <Link href={`/admin/motos/${motorcycle.id}/clientes`}>
            Selecionar vendedores →
          </Link>
        </article>
      </section>

      <section className={styles.motorcyclePublishPanel}>
        <div>
          <span className={styles.sectionEyebrow}>Publicação</span>
          <h2>
            {motorcycle.ativo
              ? "A moto está publicada"
              : readyToActivate
                ? "Tudo pronto para publicar"
                : "Finalize a preparação"}
          </h2>

          <p>
            {motorcycle.ativo
              ? "O modelo está disponível nos catálogos dos vendedores selecionados."
              : readyToActivate
                ? "A moto possui opção comercial e pelo menos um vendedor selecionado."
                : "É necessário cadastrar planos ou financiamento e selecionar pelo menos um vendedor."}
          </p>
        </div>

        <button
          type="button"
          className={
            motorcycle.ativo
              ? styles.unpublishMotorcycleButton
              : styles.publishMotorcycleButton
          }
          disabled={updating || (!motorcycle.ativo && !readyToActivate)}
          onClick={() => void toggleActivation()}
        >
          {updating
            ? "Salvando..."
            : motorcycle.ativo
              ? "Desativar moto"
              : "Publicar moto"}
        </button>
      </section>

      <button
        className={styles.motorcycleSetupRefresh}
        type="button"
        onClick={() => void loadSetup()}
      >
        Atualizar progresso
      </button>
    </AdminShell>
  );
}
