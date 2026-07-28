"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ClientLogoutButton } from "@/components/client-demo/ClientLogoutButton";
import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";
import {
  loadClientPanelData,
  type ClientPanelData,
} from "@/lib/client-panel-data";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "../cliente-demo.module.css";
import dataStyles from "./client-panel-data.module.css";

type Section = "overview" | "profile" | "motorcycles";

const sectionCopy: Record<
  Section,
  {
    title: string;
    description: string;
  }
> = {
  overview: {
    title: "Visão geral",
    description: "Acompanhe o status e os dados reais do seu catálogo.",
  },
  profile: {
    title: "Meu perfil",
    description: "Confira as informações exibidas para seus clientes.",
  },
  motorcycles: {
    title: "Minhas motos",
    description: "Veja os modelos atualmente liberados no seu catálogo.",
  },
};

function NavigationIcon({
  children,
}: {
  children: string;
}) {
  return <span className={styles.navigationIcon}>{children}</span>;
}

function getInitials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "H"
  );
}

function getSalesModeLabel(data: ClientPanelData | null) {
  if (!data) {
    return "Carregando";
  }

  if (
    data.profile.sellsConsortium &&
    data.profile.sellsFinancing
  ) {
    return "Consórcio e financiamento";
  }

  if (data.profile.sellsFinancing) {
    return "Financiamento";
  }

  return "Consórcio";
}

function getInstagramLabel(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  try {
    const url = new URL(value);
    const name = url.pathname.split("/").filter(Boolean)[0];

    return name ? `@${name}` : value;
  } catch {
    return value;
  }
}

export default function ClientDashboardPage() {
  const access = useClientAccess();

  const [section, setSection] =
    useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] =
    useState<ClientPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getClientSupabaseClient();
      const nextData = await loadClientPanelData(
        supabase,
        access.clientId,
      );

      if (nextData.profile.id !== access.clientId) {
        throw new Error(
          "O perfil retornado não corresponde ao usuário autenticado.",
        );
      }

      setData(nextData);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar os dados do seu catálogo. Confira a conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [access.clientId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  const profile = data?.profile ?? null;
  const motorcycles = data?.motorcycles ?? [];
  const modeLabel = useMemo(
    () => getSalesModeLabel(data),
    [data],
  );

  function openSection(nextSection: Section) {
    setSection(nextSection);
    setMenuOpen(false);
  }

  const publicSlug = profile?.slug ?? access.clientSlug;
  const publicName = profile?.name ?? access.clientName;

  return (
    <div className={styles.clientApp}>
      <button
        className={`${styles.mobileBackdrop} ${
          menuOpen ? styles.mobileBackdropVisible : ""
        }`}
        type="button"
        onClick={() => setMenuOpen(false)}
        aria-label="Fechar menu"
      />

      <aside
        className={`${styles.clientSidebar} ${
          menuOpen ? styles.clientSidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarBrand}>
          <span>H</span>

          <div>
            <strong>Painel do vendedor</strong>
            <small>Catálogo Honda</small>
          </div>

          <button
            className={styles.closeMenu}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <div className={styles.clientIdentity}>
          <span>{getInitials(publicName)}</span>

          <div>
            <strong>{publicName}</strong>
            <small>
              {profile?.active === false
                ? "Catálogo bloqueado"
                : "Catálogo ativo"}
            </small>
          </div>
        </div>

        <nav className={styles.clientNavigation}>
          <p>Meu catálogo</p>

          <button
            type="button"
            className={
              section === "overview"
                ? styles.navigationActive
                : ""
            }
            onClick={() => openSection("overview")}
          >
            <NavigationIcon>⌂</NavigationIcon>
            Visão geral
          </button>

          <button
            type="button"
            className={
              section === "profile"
                ? styles.navigationActive
                : ""
            }
            onClick={() => openSection("profile")}
          >
            <NavigationIcon>○</NavigationIcon>
            Meu perfil
          </button>

          <button
            type="button"
            className={
              section === "motorcycles"
                ? styles.navigationActive
                : ""
            }
            onClick={() => openSection("motorcycles")}
          >
            <NavigationIcon>◆</NavigationIcon>
            Minhas motos
          </button>

          <Link
            className={styles.subscriptionSidebarLink}
            href="/cliente-demo/assinatura"
          >
            <NavigationIcon>R$</NavigationIcon>
            Minha assinatura
          </Link>
        </nav>

        <div className={styles.sidebarRestriction}>
          <span>Proteção ativa</span>
          <p>
            Preços, cadastro central e acesso a outros vendedores
            permanecem sob controle do administrador.
          </p>
        </div>

        <ClientLogoutButton
          className={styles.logoutLink}
        />
      </aside>

      <div className={styles.clientMain}>
        <header className={styles.clientTopbar}>
          <button
            className={styles.menuButton}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div>
            <h1>{sectionCopy[section].title}</h1>
            <p>{sectionCopy[section].description}</p>
          </div>

          <Link
            className={styles.openCatalogButton}
            href={`/${publicSlug}`}
            target="_blank"
          >
            Abrir catálogo ↗
          </Link>
        </header>

        <main className={styles.clientContent}>
          {loading ? (
            <section className={dataStyles.dataState}>
              <div className={dataStyles.spinner} />
              <h2>Carregando seu catálogo</h2>
              <p>
                Buscando perfil, modalidades e motos no Supabase.
              </p>
            </section>
          ) : null}

          {!loading && error ? (
            <section className={dataStyles.dataState}>
              <span className={dataStyles.errorMark}>!</span>
              <h2>Não foi possível carregar</h2>
              <p>{error}</p>
              <button type="button" onClick={loadData}>
                Tentar novamente
              </button>
            </section>
          ) : null}

          {!loading && !error && profile ? (
            <>
              {section === "overview" ? (
                <>
                  <section className={styles.clientWelcome}>
                    <div>
                      <span>Dados reais do seu catálogo</span>
                      <h2>Olá, {profile.name}! 👋</h2>
                      <p>
                        Seu painel está conectado ao Supabase. As
                        informações abaixo correspondem ao perfil
                        vinculado à sua conta.
                      </p>

                      <div className={styles.welcomeActions}>
                        <button
                          type="button"
                          onClick={() => openSection("profile")}
                        >
                          Conferir meu perfil
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openSection("motorcycles")
                          }
                        >
                          Ver minhas motos
                        </button>
                      </div>
                    </div>

                    <div className={styles.catalogStatusCard}>
                      <span className={styles.statusDot} />
                      <small>Status do catálogo</small>
                      <strong>
                        {profile.active
                          ? "Ativo e publicado"
                          : "Acesso bloqueado"}
                      </strong>
                      <p>
                        catalogo-honda.vercel.app/{profile.slug}
                      </p>
                    </div>
                  </section>

                  <section
                    className={dataStyles.realSummaryGrid}
                  >
                    <article>
                      <span>✓</span>
                      <div>
                        <small>Catálogo</small>
                        <strong>
                          {profile.active ? "Ativo" : "Bloqueado"}
                        </strong>
                        <p>Status real do Supabase</p>
                      </div>
                    </article>

                    <article>
                      <span>M</span>
                      <div>
                        <small>Motos visíveis</small>
                        <strong>{motorcycles.length}</strong>
                        <p>Modelos liberados no catálogo</p>
                      </div>
                    </article>

                    <article>
                      <span>C</span>
                      <div>
                        <small>Modalidade</small>
                        <strong>{modeLabel}</strong>
                        <p>Configuração real do vendedor</p>
                      </div>
                    </article>
                  </section>

                  <section
                    className={dataStyles.analyticsPreview}
                  >
                    <div className={dataStyles.analyticsHeading}>
                      <div>
                        <span>Desempenho do catálogo</span>
                        <h2>Visitas e motos mais acessadas</h2>
                        <p>
                          O espaço já está pronto. Os registros reais
                          serão ativados na Entrega 19.5.
                        </p>
                      </div>

                      <span
                        className={dataStyles.nextDeliveryBadge}
                      >
                        Próxima entrega
                      </span>
                    </div>

                    <div className={dataStyles.analyticsCards}>
                      <article>
                        <small>Visitas ao catálogo</small>
                        <strong>—</strong>
                        <p>Aguardando ativação das métricas</p>
                      </article>

                      <article>
                        <small>Visitantes únicos</small>
                        <strong>—</strong>
                        <p>Identificação anônima e consentida</p>
                      </article>

                      <article>
                        <small>Moto mais acessada</small>
                        <strong>Em preparação</strong>
                        <p>Ranking por período será exibido aqui</p>
                      </article>
                    </div>
                  </section>

                  <div className={styles.overviewColumns}>
                    <section className={styles.clientPanel}>
                      <div className={styles.panelHeading}>
                        <div>
                          <span>Atalhos</span>
                          <h2>Seu catálogo real</h2>
                        </div>
                      </div>

                      <div className={styles.actionCards}>
                        <button
                          type="button"
                          onClick={() =>
                            openSection("profile")
                          }
                        >
                          <span>01</span>
                          <div>
                            <strong>Conferir perfil</strong>
                            <p>
                              Veja contato, slogan, cores e
                              identidade atuais.
                            </p>
                          </div>
                          <i>→</i>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openSection("motorcycles")
                          }
                        >
                          <span>02</span>
                          <div>
                            <strong>Ver motos liberadas</strong>
                            <p>
                              Consulte os modelos publicados no seu
                              catálogo.
                            </p>
                          </div>
                          <i>→</i>
                        </button>

                        <Link href="/cliente-demo/assinatura">
                          <span>03</span>
                          <div>
                            <strong>Minha assinatura</strong>
                            <p>
                              Consulte a demonstração da sua
                              mensalidade.
                            </p>
                          </div>
                          <i>→</i>
                        </Link>

                        <Link
                          href={`/${profile.slug}`}
                          target="_blank"
                        >
                          <span>04</span>
                          <div>
                            <strong>Conferir catálogo</strong>
                            <p>
                              Veja exatamente o que seus clientes
                              estão vendo.
                            </p>
                          </div>
                          <i>↗</i>
                        </Link>
                      </div>
                    </section>

                    <aside className={styles.clientPanel}>
                      <div className={styles.panelHeading}>
                        <div>
                          <span>Segurança</span>
                          <h2>Limites da sua conta</h2>
                        </div>
                      </div>

                      <div className={styles.permissionList}>
                        <div>
                          <span>✓</span>
                          <p>
                            Visualiza somente o perfil vinculado
                          </p>
                        </div>

                        <div>
                          <span>✓</span>
                          <p>
                            Consulta somente as próprias motos
                          </p>
                        </div>

                        <div>
                          <span>✓</span>
                          <p>
                            Abre somente o próprio catálogo
                          </p>
                        </div>

                        <div
                          className={
                            styles.permissionRestricted
                          }
                        >
                          <span>×</span>
                          <p>
                            Não acessa preços ou outros vendedores
                          </p>
                        </div>
                      </div>
                    </aside>
                  </div>
                </>
              ) : null}

              {section === "profile" ? (
                <section className={styles.editorLayout}>
                  <div className={styles.editorPanel}>
                    <div className={styles.panelHeading}>
                      <div>
                        <span>Dados carregados do Supabase</span>
                        <h2>Informações do perfil</h2>
                      </div>
                    </div>

                    <div className={styles.profileFields}>
                      <label>
                        Nome exibido
                        <input
                          value={profile.name}
                          readOnly
                        />
                      </label>

                      <div className={styles.twoColumns}>
                        <label>
                          WhatsApp
                          <input
                            value={profile.whatsapp}
                            readOnly
                          />
                        </label>

                        <label>
                          Instagram
                          <input
                            value={
                              getInstagramLabel(
                                profile.instagramUrl,
                              )
                            }
                            readOnly
                          />
                        </label>
                      </div>

                      <label>
                        Slogan
                        <textarea
                          value={profile.slogan}
                          readOnly
                        />
                      </label>

                      <div className={styles.imageFields}>
                        <article>
                          <div
                            className={
                              dataStyles.realProfileImage
                            }
                          >
                            <img
                              src={profile.mobilePhotoUrl}
                              alt={`Foto de ${profile.name}`}
                            />
                          </div>

                          <div>
                            <strong>Foto do perfil</strong>
                            <p>
                              Imagem mobile atualmente publicada.
                            </p>
                            <button type="button" disabled>
                              Edição em preparação
                            </button>
                          </div>
                        </article>

                        <article>
                          <div
                            className={dataStyles.realLogoImage}
                          >
                            {profile.logoUrl ? (
                              <img
                                src={profile.logoUrl}
                                alt={`Logo de ${profile.name}`}
                              />
                            ) : (
                              <span>
                                {getInitials(profile.name)}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>Logo e marca-d&apos;água</strong>
                            <p>
                              Identidade visual atualmente cadastrada.
                            </p>
                            <button type="button" disabled>
                              Edição em preparação
                            </button>
                          </div>
                        </article>
                      </div>

                      <fieldset className={styles.salesMode}>
                        <legend>
                          Modalidade comercializada
                        </legend>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              profile.sellsConsortium
                            }
                            readOnly
                            disabled
                          />
                          Consórcio
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              profile.sellsFinancing
                            }
                            readOnly
                            disabled
                          />
                          Financiamento
                        </label>
                      </fieldset>

                      <div className={styles.colorFields}>
                        <label>
                          Cor principal
                          <span>
                            <input
                              type="color"
                              value={profile.primaryColor}
                              readOnly
                              disabled
                            />
                            {profile.primaryColor}
                          </span>
                        </label>

                        <label>
                          Cor secundária
                          <span>
                            <input
                              type="color"
                              value={
                                profile.secondaryColor
                              }
                              readOnly
                              disabled
                            />
                            {profile.secondaryColor}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.editorFooter}>
                      <span>
                        Dados reais. A edição segura será liberada
                        em uma etapa separada.
                      </span>

                      <button type="button" disabled>
                        Edição em preparação
                      </button>
                    </div>
                  </div>

                  <aside
                    className={styles.profilePreview}
                    style={{
                      background: `linear-gradient(145deg, ${profile.primaryColor}, ${profile.secondaryColor})`,
                    }}
                  >
                    <small>Prévia com dados reais</small>

                    <span className={styles.previewAvatar}>
                      {profile.mobilePhotoUrl ? (
                        <img
                          className={
                            dataStyles.previewProfilePhoto
                          }
                          src={profile.mobilePhotoUrl}
                          alt=""
                        />
                      ) : (
                        getInitials(profile.name)
                      )}
                    </span>

                    <h2>{profile.name}</h2>
                    <p>{profile.slogan}</p>

                    <div>
                      <span>WhatsApp</span>
                      <span>
                        {profile.instagramUrl
                          ? "Instagram"
                          : "Sem Instagram"}
                      </span>
                    </div>

                    <strong>{modeLabel}</strong>
                  </aside>
                </section>
              ) : null}

              {section === "motorcycles" ? (
                <section className={styles.clientPanel}>
                  <div className={styles.motorcycleHeading}>
                    <div>
                      <span className={styles.panelEyebrow}>
                        Dados reais do catálogo
                      </span>

                      <h2>
                        Modelos liberados para {profile.name}
                      </h2>

                      <p>
                        Os modelos abaixo estão ativos na relação
                        entre seu perfil e o catálogo central.
                      </p>
                    </div>

                    <div>
                      <strong>{motorcycles.length}</strong>
                      <span>motos visíveis</span>
                    </div>
                  </div>

                  {motorcycles.length > 0 ? (
                    <div
                      className={
                        dataStyles.realMotorcycleGrid
                      }
                    >
                      {motorcycles.map((motorcycle) => (
                        <article key={motorcycle.id}>
                          <div
                            className={
                              dataStyles.realMotorcycleImage
                            }
                          >
                            <img
                              src={motorcycle.imageUrl}
                              alt={motorcycle.name}
                            />

                            {motorcycle.badge ? (
                              <span>{motorcycle.badge}</span>
                            ) : null}
                          </div>

                          <div
                            className={
                              dataStyles.realMotorcycleInfo
                            }
                          >
                            <small>
                              {motorcycle.category}
                            </small>
                            <h3>{motorcycle.name}</h3>
                            <p>Visível no seu catálogo</p>
                          </div>

                          <Link
                            href={`/${profile.slug}/${motorcycle.slug}`}
                            target="_blank"
                          >
                            Abrir ↗
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={dataStyles.emptyMotorcycles}
                    >
                      <strong>Nenhuma moto liberada</strong>
                      <p>
                        Entre em contato com o administrador para
                        configurar os modelos do seu catálogo.
                      </p>
                    </div>
                  )}

                  <div className={styles.editorFooter}>
                    <span>
                      A seleção segura pelo vendedor será criada
                      depois das métricas.
                    </span>

                    <button type="button" disabled>
                      Edição em preparação
                    </button>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
