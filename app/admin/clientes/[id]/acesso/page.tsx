"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "./access.module.css";

type AccessMode = "create" | "link";

type ClientInfo = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

type SellerAccess = {
  userId: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
};

type AccessSnapshot = {
  client: ClientInfo;
  access: SellerAccess | null;
};

type ApiError = {
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function randomIndex(max: number) {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] % max;
}

function generateSecurePassword() {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*_-+",
  ];
  const all = groups.join("");
  const characters = groups.map(
    (group) => group[randomIndex(group.length)],
  );

  while (characters.length < 14) {
    characters.push(all[randomIndex(all.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const nextIndex = randomIndex(index + 1);
    [characters[index], characters[nextIndex]] = [
      characters[nextIndex],
      characters[index],
    ];
  }

  return characters.join("");
}

async function getAdminAccessToken() {
  const supabase = getAdminSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      "Sua sessão administrativa expirou. Entre novamente.",
    );
  }

  return session.access_token;
}

async function readJson<T extends object>(
  response: Response,
): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as
    | T
    | ApiError;

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Não foi possível concluir a operação.",
    );
  }

  return payload as T;
}

export default function SellerAccessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [snapshot, setSnapshot] =
    useState<AccessSnapshot | null>(null);
  const [mode, setMode] = useState<AccessMode>("create");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAdminAccessToken();
      const response = await fetch(
        `/api/admin/clientes/${params.id}/acesso`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const nextSnapshot =
        await readJson<AccessSnapshot>(response);

      setSnapshot(nextSnapshot);
      setName((currentName) => currentName || nextSnapshot.client.nome);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o acesso.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccess();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAccess]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timer = window.setTimeout(
      () => setCopyFeedback(""),
      2500,
    );

    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !name.trim()) {
      return false;
    }

    if (mode === "link") {
      return true;
    }

    return Boolean(
      password.length >= 8 &&
        password === passwordConfirmation,
    );
  }, [
    email,
    mode,
    name,
    password,
    passwordConfirmation,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError(
        mode === "create"
          ? "Preencha o e-mail, o nome e duas senhas iguais com pelo menos 8 caracteres."
          : "Preencha o e-mail e o nome do usuário existente.",
      );
      return;
    }

    setSaving(true);

    try {
      const token = await getAdminAccessToken();
      const response = await fetch(
        `/api/admin/clientes/${params.id}/acesso`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: mode,
            email: email.trim(),
            name: name.trim(),
            password: mode === "create" ? password : undefined,
          }),
        },
      );

      const nextSnapshot =
        await readJson<AccessSnapshot>(response);

      setSnapshot(nextSnapshot);
      setPassword("");
      setPasswordConfirmation("");
      setSuccess(
        mode === "create"
          ? "Acesso criado e vinculado com sucesso."
          : "Usuário existente vinculado com sucesso.",
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o acesso.",
      );
    } finally {
      setSaving(false);
    }
  }

  function createPassword() {
    const nextPassword = generateSecurePassword();
    setPassword(nextPassword);
    setPasswordConfirmation(nextPassword);
    setShowPassword(true);
    setError("");
  }

  async function copyPassword() {
    if (!password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      setCopyFeedback("Senha copiada.");
    } catch (copyError) {
      console.error(copyError);
      setCopyFeedback(
        "Não foi possível copiar automaticamente.",
      );
    }
  }

  function goBack() {
    router.push(`/admin/clientes/${params.id}`);
  }

  return (
    <AdminShell
      title="Acesso do vendedor"
      description="Crie ou vincule a conta que poderá administrar este catálogo."
    >
      <div className={styles.topbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para o cliente
        </button>

        <span>Etapa 2 de 3: acesso do painel</span>
      </div>

      {loading ? (
        <section className={styles.stateCard}>
          <span className={styles.spinner} />
          <h2>Carregando acesso</h2>
          <p>Consultando o vínculo protegido deste cliente.</p>
        </section>
      ) : null}

      {!loading && error && !snapshot ? (
        <section className={styles.stateCard}>
          <span className={styles.errorMark}>!</span>
          <h2>Não foi possível carregar</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadAccess()}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      {!loading && snapshot ? (
        <div className={styles.layout}>
          <section className={styles.mainPanel}>
            <header className={styles.clientHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Cliente selecionado
                </span>
                <h2>{snapshot.client.nome}</h2>
                <p>/{snapshot.client.slug}</p>
              </div>

              <span
                className={
                  snapshot.client.ativo
                    ? styles.activeBadge
                    : styles.blockedBadge
                }
              >
                {snapshot.client.ativo
                  ? "Catálogo ativo"
                  : "Catálogo bloqueado"}
              </span>
            </header>

            {success ? (
              <p className={styles.successMessage} role="status">
                {success}
              </p>
            ) : null}

            {error ? (
              <div className={styles.errorBox} role="alert">
                <p>{error}</p>
              </div>
            ) : null}

            {snapshot.access ? (
              <div className={styles.accessCreated}>
                <div className={styles.accessIcon}>✓</div>

                <div>
                  <span className={styles.eyebrow}>
                    Acesso configurado
                  </span>
                  <h2>{snapshot.access.name}</h2>
                  <p>{snapshot.access.email}</p>
                </div>

                <dl>
                  <div>
                    <dt>Status do vínculo</dt>
                    <dd>
                      {snapshot.access.active
                        ? "Ativo"
                        : "Bloqueado"}
                    </dd>
                  </div>
                  <div>
                    <dt>Criado em</dt>
                    <dd>
                      {formatDate(snapshot.access.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>Endereço de entrada</dt>
                    <dd>/painel/login</dd>
                  </div>
                </dl>

                <div className={styles.createdActions}>
                  <Link
                    href={`/admin/clientes/${snapshot.client.id}/motos`}
                  >
                    Continuar para as motos →
                  </Link>
                  <Link href="/painel/login" target="_blank">
                    Abrir tela de login ↗
                  </Link>
                </div>

                <p className={styles.passwordNotice}>
                  A senha não é armazenada nem exibida pelo painel.
                  Caso ela seja esquecida, uma redefinição segura será
                  criada em uma etapa futura.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.modeSelector}>
                  <button
                    type="button"
                    className={
                      mode === "create"
                        ? styles.modeActive
                        : ""
                    }
                    onClick={() => {
                      setMode("create");
                      setError("");
                    }}
                  >
                    <strong>Criar usuário novo</strong>
                    <span>Defina e-mail e senha inicial.</span>
                  </button>

                  <button
                    type="button"
                    className={
                      mode === "link"
                        ? styles.modeActive
                        : ""
                    }
                    onClick={() => {
                      setMode("link");
                      setError("");
                    }}
                  >
                    <strong>Vincular usuário existente</strong>
                    <span>
                      Para e-mails já criados no Supabase Auth.
                    </span>
                  </button>
                </div>

                <form
                  className={styles.accessForm}
                  onSubmit={handleSubmit}
                >
                  <div className={styles.formHeading}>
                    <span className={styles.eyebrow}>
                      {mode === "create"
                        ? "Novo acesso"
                        : "Conta existente"}
                    </span>
                    <h2>
                      {mode === "create"
                        ? "Dados de entrada do vendedor"
                        : "Localizar e vincular usuário"}
                    </h2>
                    <p>
                      {mode === "create"
                        ? "O usuário será criado no Supabase Auth e vinculado somente a este catálogo."
                        : "O e-mail precisa existir em Authentication → Users e não pode pertencer a outro cliente ou administrador."}
                    </p>
                  </div>

                  <div className={styles.fields}>
                    <label>
                      E-mail de acesso
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        placeholder="vendedor@exemplo.com"
                        autoComplete="off"
                        required
                      />
                    </label>

                    <label>
                      Nome do usuário
                      <input
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          setError("");
                        }}
                        placeholder="Nome do vendedor"
                        maxLength={120}
                        required
                      />
                    </label>

                    {mode === "create" ? (
                      <>
                        <label>
                          Senha inicial
                          <input
                            type={
                              showPassword ? "text" : "password"
                            }
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              setError("");
                            }}
                            autoComplete="new-password"
                            minLength={8}
                            required
                          />
                        </label>

                        <label>
                          Confirmar senha
                          <input
                            type={
                              showPassword ? "text" : "password"
                            }
                            value={passwordConfirmation}
                            onChange={(event) => {
                              setPasswordConfirmation(
                                event.target.value,
                              );
                              setError("");
                            }}
                            autoComplete="new-password"
                            minLength={8}
                            required
                          />
                        </label>

                        <div className={styles.passwordTools}>
                          <button
                            type="button"
                            onClick={createPassword}
                          >
                            Gerar senha segura
                          </button>

                          <button
                            type="button"
                            disabled={!password}
                            onClick={() =>
                              void copyPassword()
                            }
                          >
                            Copiar senha
                          </button>

                          <label>
                            <input
                              type="checkbox"
                              checked={showPassword}
                              onChange={(event) =>
                                setShowPassword(
                                  event.target.checked,
                                )
                              }
                            />
                            Mostrar senha
                          </label>

                          {copyFeedback ? (
                            <span>{copyFeedback}</span>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      disabled={saving || !canSubmit}
                    >
                      {saving
                        ? "Salvando..."
                        : mode === "create"
                          ? "Criar acesso do vendedor"
                          : "Vincular usuário existente"}
                    </button>

                    <Link
                      href={`/admin/clientes/${snapshot.client.id}/motos`}
                    >
                      Configurar motos sem criar acesso agora
                    </Link>
                  </div>
                </form>
              </>
            )}
          </section>

          <aside className={styles.securityPanel}>
            <span className={styles.eyebrow}>Segurança</span>
            <h2>O que acontece nesta etapa</h2>

            <ul>
              <li>
                A chave secreta do Supabase fica somente no servidor.
              </li>
              <li>
                Sua sessão de administrador é validada antes da ação.
              </li>
              <li>
                O usuário recebe acesso a apenas um cliente.
              </li>
              <li>
                A senha inicial não é salva nas tabelas do catálogo.
              </li>
              <li>
                Um administrador não pode ser vinculado como vendedor.
              </li>
            </ul>

            <div className={styles.securityNote}>
              <strong>Envio da senha</strong>
              <p>
                Envie a senha inicial diretamente ao vendedor por um
                canal privado e recomende que ele não a compartilhe.
              </p>
            </div>

            {snapshot.client.slug ? (
              <Link
                className={styles.catalogLink}
                href={`/${snapshot.client.slug}`}
                target="_blank"
              >
                Abrir catálogo público ↗
              </Link>
            ) : null}
          </aside>
        </div>
      ) : null}
    </AdminShell>
  );
}
