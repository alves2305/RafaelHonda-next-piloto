"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ClientLogoutButton } from "@/components/client-demo/ClientLogoutButton";
import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";

import styles from "../cliente-demo.module.css";

type Section = "overview" | "profile" | "motorcycles";

type MotorcycleDemo = {
  id: string;
  name: string;
  category: string;
  active: boolean;
};

const initialMotorcycles: MotorcycleDemo[] = [
  { id: "pop", name: "Pop 110i ES", category: "Urbana", active: true },
  { id: "biz", name: "Biz 125 ES", category: "Urbana", active: true },
  { id: "fan", name: "CG 160 Fan", category: "Street", active: true },
  { id: "bros", name: "NXR 160 Bros", category: "Trail", active: true },
  { id: "sahara", name: "XRE 300 Sahara", category: "Adventure", active: true },
  { id: "nx500", name: "NX 500", category: "Adventure", active: false },
];

const sectionCopy: Record<Section, { title: string; description: string }> = {
  overview: {
    title: "Visão geral",
    description: "Acompanhe o status e os atalhos do seu catálogo.",
  },
  profile: {
    title: "Meu perfil",
    description: "Atualize as informações que aparecem para seus clientes.",
  },
  motorcycles: {
    title: "Minhas motos",
    description: "Escolha quais modelos liberados aparecerão no catálogo.",
  },
};

function NavigationIcon({ children }: { children: string }) {
  return <span className={styles.navigationIcon}>{children}</span>;
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "H";
}

export default function ClientDemoDashboardPage() {
  const access = useClientAccess();
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: access.clientName,
    whatsapp: "5574999999999",
    instagram: "@gdhonda",
    slogan: "Número 01 em contemplações de consórcio",
    primaryColor: "#d90000",
    secondaryColor: "#17233a",
    salesMode: "consorcio",
  });
  const [motorcycles, setMotorcycles] =
    useState<MotorcycleDemo[]>(initialMotorcycles);

  const activeMotorcycles = useMemo(
    () => motorcycles.filter((motorcycle) => motorcycle.active).length,
    [motorcycles],
  );

  const modeLabel =
    profile.salesMode === "ambos"
      ? "Consórcio e financiamento"
      : profile.salesMode === "financiamento"
        ? "Financiamento"
        : "Consórcio";

  function openSection(nextSection: Section) {
    setSection(nextSection);
    setMenuOpen(false);
    setSaved(false);
  }

  function toggleMotorcycle(id: string) {
    setMotorcycles((current) =>
      current.map((motorcycle) =>
        motorcycle.id === id
          ? { ...motorcycle, active: !motorcycle.active }
          : motorcycle,
      ),
    );
    setSaved(false);
  }

  function savePrototypeChanges() {
    setSaved(true);
  }

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
          <span>{getInitials(access.clientName)}</span>
          <div>
            <strong>{access.clientName}</strong>
            <small>Catálogo ativo</small>
          </div>
        </div>

        <nav className={styles.clientNavigation}>
          <p>Meu catálogo</p>

          <button
            type="button"
            className={section === "overview" ? styles.navigationActive : ""}
            onClick={() => openSection("overview")}
          >
            <NavigationIcon>⌂</NavigationIcon>
            Visão geral
          </button>

          <button
            type="button"
            className={section === "profile" ? styles.navigationActive : ""}
            onClick={() => openSection("profile")}
          >
            <NavigationIcon>○</NavigationIcon>
            Meu perfil
          </button>

          <button
            type="button"
            className={
              section === "motorcycles" ? styles.navigationActive : ""
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
            Preços, cadastro de motos e bloqueio do sistema são controlados pelo
            administrador.
          </p>
        </div>

        <ClientLogoutButton className={styles.logoutLink} />
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

          <Link className={styles.openCatalogButton} href={`/${access.clientSlug}`} target="_blank">
            Abrir catálogo ↗
          </Link>
        </header>

        <main className={styles.clientContent}>
          {section === "overview" ? (
            <>
              <section className={styles.clientWelcome}>
                <div>
                  <span>Área exclusiva do vendedor</span>
                  <h2>Olá, {access.clientName}! 👋</h2>
                  <p>
                    Seu catálogo está funcionando normalmente. Use os atalhos
                    para atualizar o perfil ou escolher os modelos exibidos.
                  </p>

                  <div className={styles.welcomeActions}>
                    <button type="button" onClick={() => openSection("profile")}>
                      Editar meu perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => openSection("motorcycles")}
                    >
                      Gerenciar motos
                    </button>
                  </div>
                </div>

                <div className={styles.catalogStatusCard}>
                  <span className={styles.statusDot} />
                  <small>Status do catálogo</small>
                  <strong>Ativo e publicado</strong>
                  <p>catalogo-honda.vercel.app/{access.clientSlug}</p>
                </div>
              </section>

              <section className={styles.clientSummaryGrid}>
                <article>
                  <span className={styles.summarySymbol}>✓</span>
                  <div>
                    <small>Catálogo</small>
                    <strong>Ativo</strong>
                    <p>Disponível para seus clientes</p>
                  </div>
                </article>

                <article>
                  <span className={styles.summarySymbol}>M</span>
                  <div>
                    <small>Motos visíveis</small>
                    <strong>{activeMotorcycles}</strong>
                    <p>de {motorcycles.length} modelos liberados</p>
                  </div>
                </article>

                <article>
                  <span className={styles.summarySymbol}>C</span>
                  <div>
                    <small>Modalidade</small>
                    <strong>{modeLabel}</strong>
                    <p>Definida no seu perfil</p>
                  </div>
                </article>
              </section>

              <div className={styles.overviewColumns}>
                <section className={styles.clientPanel}>
                  <div className={styles.panelHeading}>
                    <div>
                      <span>Atalhos</span>
                      <h2>Administre seu catálogo</h2>
                    </div>
                  </div>

                  <div className={styles.actionCards}>
                    <button type="button" onClick={() => openSection("profile")}>
                      <span>01</span>
                      <div>
                        <strong>Atualizar perfil</strong>
                        <p>Contato, slogan, cores, foto e identidade visual.</p>
                      </div>
                      <i>→</i>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSection("motorcycles")}
                    >
                      <span>02</span>
                      <div>
                        <strong>Escolher motos</strong>
                        <p>Ative ou oculte modelos disponíveis para você.</p>
                      </div>
                      <i>→</i>
                    </button>

                    <Link href="/cliente-demo/assinatura">
                      <span>03</span>
                      <div>
                        <strong>Minha assinatura</strong>
                        <p>Consulte a mensalidade e escolha como pagar.</p>
                      </div>
                      <i>→</i>
                    </Link>

                    <Link href={`/${access.clientSlug}`} target="_blank">
                      <span>04</span>
                      <div>
                        <strong>Conferir catálogo</strong>
                        <p>Veja exatamente o que seus clientes estão vendo.</p>
                      </div>
                      <i>↗</i>
                    </Link>
                  </div>
                </section>

                <aside className={styles.clientPanel}>
                  <div className={styles.panelHeading}>
                    <div>
                      <span>Responsabilidades</span>
                      <h2>O que você controla</h2>
                    </div>
                  </div>

                  <div className={styles.permissionList}>
                    <div>
                      <span>✓</span>
                      <p>Suas informações e identidade visual</p>
                    </div>
                    <div>
                      <span>✓</span>
                      <p>Exibição das motos liberadas</p>
                    </div>
                    <div>
                      <span>✓</span>
                      <p>Modalidade apresentada no catálogo</p>
                    </div>
                    <div className={styles.permissionRestricted}>
                      <span>×</span>
                      <p>Preços e dados de outros vendedores</p>
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
                    <span>Personalização</span>
                    <h2>Informações do perfil</h2>
                  </div>
                </div>

                <div className={styles.profileFields}>
                  <label>
                    Nome exibido
                    <input
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className={styles.twoColumns}>
                    <label>
                      WhatsApp
                      <input
                        value={profile.whatsapp}
                        onChange={(event) =>
                          setProfile((current) => ({
                            ...current,
                            whatsapp: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      Instagram
                      <input
                        value={profile.instagram}
                        onChange={(event) =>
                          setProfile((current) => ({
                            ...current,
                            instagram: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Slogan
                    <textarea
                      value={profile.slogan}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          slogan: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className={styles.imageFields}>
                    <article>
                      <span className={styles.profileDemoAvatar}>{getInitials(access.clientName)}</span>
                      <div>
                        <strong>Foto do perfil</strong>
                        <p>Imagem usada no celular e no botão de WhatsApp.</p>
                        <button type="button">Alterar imagem</button>
                      </div>
                    </article>

                    <article>
                      <span className={styles.logoDemo}>HONDA</span>
                      <div>
                        <strong>Logo e marca-d&apos;água</strong>
                        <p>Arquivos utilizados na identidade do catálogo.</p>
                        <button type="button">Alterar arquivos</button>
                      </div>
                    </article>
                  </div>

                  <fieldset className={styles.salesMode}>
                    <legend>Modalidade comercializada</legend>

                    {[
                      ["consorcio", "Consórcio"],
                      ["financiamento", "Financiamento"],
                      ["ambos", "Ambos"],
                    ].map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="mode"
                          checked={profile.salesMode === value}
                          onChange={() =>
                            setProfile((current) => ({
                              ...current,
                              salesMode: value,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>

                  <div className={styles.colorFields}>
                    <label>
                      Cor principal
                      <span>
                        <input
                          type="color"
                          value={profile.primaryColor}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              primaryColor: event.target.value,
                            }))
                          }
                        />
                        {profile.primaryColor}
                      </span>
                    </label>

                    <label>
                      Cor secundária
                      <span>
                        <input
                          type="color"
                          value={profile.secondaryColor}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              secondaryColor: event.target.value,
                            }))
                          }
                        />
                        {profile.secondaryColor}
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.editorFooter}>
                  {saved ? (
                    <span className={styles.savedMessage}>
                      Alterações simuladas com sucesso.
                    </span>
                  ) : (
                    <span>Protótipo: nada será enviado ao banco.</span>
                  )}

                  <button type="button" onClick={savePrototypeChanges}>
                    Salvar alterações
                  </button>
                </div>
              </div>

              <aside
                className={styles.profilePreview}
                style={{
                  background: `linear-gradient(145deg, ${profile.primaryColor}, ${profile.secondaryColor})`,
                }}
              >
                <small>Prévia do perfil</small>
                <span className={styles.previewAvatar}>{getInitials(profile.name)}</span>
                <h2>{profile.name || "Nome do vendedor"}</h2>
                <p>{profile.slogan || "Seu slogan aparecerá aqui."}</p>
                <div>
                  <span>WhatsApp</span>
                  <span>Instagram</span>
                </div>
                <strong>{modeLabel}</strong>
              </aside>
            </section>
          ) : null}

          {section === "motorcycles" ? (
            <section className={styles.clientPanel}>
              <div className={styles.motorcycleHeading}>
                <div>
                  <span className={styles.panelEyebrow}>Catálogo individual</span>
                  <h2>Modelos liberados para {access.clientName}</h2>
                  <p>
                    Você pode ocultar ou exibir os modelos abaixo. Cadastro,
                    textos e preços continuam sob controle do administrador.
                  </p>
                </div>

                <div>
                  <strong>{activeMotorcycles}</strong>
                  <span>motos visíveis</span>
                </div>
              </div>

              <div className={styles.motorcycleDemoGrid}>
                {motorcycles.map((motorcycle) => (
                  <article
                    className={
                      motorcycle.active
                        ? styles.motorcycleActive
                        : styles.motorcycleInactive
                    }
                    key={motorcycle.id}
                  >
                    <div className={styles.motorcycleVisual}>
                      <span>HONDA</span>
                      <strong>{motorcycle.name.split(" ")[0]}</strong>
                    </div>

                    <div className={styles.motorcycleInfo}>
                      <small>{motorcycle.category}</small>
                      <h3>{motorcycle.name}</h3>
                      <p>
                        {motorcycle.active
                          ? "Visível no catálogo"
                          : "Oculta para seus clientes"}
                      </p>
                    </div>

                    <button
                      className={styles.toggleButton}
                      type="button"
                      role="switch"
                      aria-checked={motorcycle.active}
                      onClick={() => toggleMotorcycle(motorcycle.id)}
                    >
                      <span />
                    </button>
                  </article>
                ))}
              </div>

              <div className={styles.editorFooter}>
                {saved ? (
                  <span className={styles.savedMessage}>
                    Seleção simulada com sucesso.
                  </span>
                ) : (
                  <span>
                    A disponibilidade geral dos modelos continua com Rafael.
                  </span>
                )}

                <button type="button" onClick={savePrototypeChanges}>
                  Salvar seleção
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
