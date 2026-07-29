"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import styles from "@/app/admin/admin.module.css";
import {
  getAdminSupabaseClient,
  isAdminSupabaseConfigured,
} from "@/lib/admin-supabase";

type IconName =
  | "dashboard"
  | "clients"
  | "motorcycles"
  | "plans"
  | "financing"
  | "logout"
  | "menu"
  | "close";

type AdminRenderContext = {
  user: User;
  userName: string;
};

function AdminIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    clients: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    motorcycles: (
      <>
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M9 17.5h6" />
        <path d="m7.5 8 3 1.5 2.5 5h2.5l-2.2-6.2H17" />
        <path d="M4 11h5" />
      </>
    ),
    plans: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 8h10" />
        <path d="M7 12h4" />
        <path d="M7 16h6" />
        <path d="M16 14v4" />
        <path d="M14 16h4" />
      </>
    ),
    financing: (
      <>
        <path d="M3 10h18" />
        <path d="M5 10V7l7-4 7 4v3" />
        <path d="M6 14v4" />
        <path d="M10 14v4" />
        <path d="M14 14v4" />
        <path d="M18 14v4" />
        <path d="M3 21h18" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.adminIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const navigation = [
  {
    label: "Visão geral",
    href: "/admin/dashboard",
    icon: "dashboard" as const,
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: "clients" as const,
  },
  {
    label: "Motos",
    href: "/admin/motos",
    icon: "motorcycles" as const,
  },
  {
    label: "Planos",
    href: "/admin/planos",
    icon: "plans" as const,
  },
  {
    label: "Financiamentos",
    href: "/admin/financiamentos",
    icon: "financing" as const,
  },
];

function titleCaseName(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toLocaleUpperCase("pt-BR") +
        part.slice(1).toLocaleLowerCase("pt-BR"),
    )
    .join(" ");
}

function getUserDisplayName(user: User) {
  const possibleMetadataNames = [
    user.user_metadata?.full_name,
    user.user_metadata?.name,
    user.user_metadata?.display_name,
  ];

  const metadataName = possibleMetadataNames.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  if (metadataName) {
    return metadataName.trim();
  }

  const emailName = user.email?.split("@")[0];

  if (emailName) {
    return titleCaseName(emailName);
  }

  return "Administrador";
}

function getUserInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode | ((context: AdminRenderContext) => ReactNode);
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isAdminSupabaseConfigured()) {
      router.replace("/admin/login");
      return;
    }

    const supabase = getAdminSupabaseClient();
    let active = true;

    async function authorizeSession(sessionUser: User) {
      const { data: isAdmin, error: adminError } = await supabase.rpc(
        "usuario_e_admin",
      );

      if (!active) {
        return;
      }

      if (adminError || isAdmin !== true) {
        setReady(false);
        setUser(null);
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setUser(sessionUser);
      setReady(true);
    }

    async function verifyAccess() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error || !session) {
        router.replace("/admin/login");
        return;
      }

      await authorizeSession(session.user);
    }

    void verifyAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        setReady(false);
        setUser(null);
        router.replace("/admin/login");
        return;
      }

      void authorizeSession(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const userName = useMemo(
    () => (user ? getUserDisplayName(user) : "Administrador"),
    [user],
  );

  const userInitials = useMemo(
    () => getUserInitials(userName) || "AD",
    [userName],
  );

  async function logout() {
    setReady(false);

    try {
      const supabase = getAdminSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  if (!ready || !user) {
    return (
      <main className={styles.adminLoading}>
        <span className={styles.adminLoadingMark}>H</span>
        <p>Verificando acesso...</p>
      </main>
    );
  }

  const renderedChildren =
    typeof children === "function"
      ? children({
          user,
          userName,
        })
      : children;

  return (
    <div className={styles.adminApp}>
      <button
        type="button"
        className={`${styles.sidebarBackdrop} ${
          sidebarOpen ? styles.sidebarBackdropVisible : ""
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Fechar menu"
      />

      <aside
        className={`${styles.adminSidebar} ${
          sidebarOpen ? styles.adminSidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarBrand}>
          <span>H</span>
          <div>
            <strong>Catálogo Honda</strong>
            <small>Administração</small>
          </div>

          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <AdminIcon name="close" />
          </button>
        </div>

        <nav className={styles.sidebarNavigation}>
          <p>Gerenciamento</p>

          {navigation.map((item) => (
            <Link
              className={`${styles.sidebarLink} ${
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`)
                  ? styles.sidebarLinkActive
                  : ""
              }`}
              href={item.href}
              key={item.href}
              onClick={() => setSidebarOpen(false)}
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <span>{userInitials}</span>
            <div>
              <strong>{userName}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button type="button" onClick={logout}>
            <AdminIcon name="logout" />
            Sair
          </button>
        </div>
      </aside>

      <div className={styles.adminMain}>
        <header className={styles.adminTopbar}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <AdminIcon name="menu" />
          </button>

          <div className={styles.topbarHeading}>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className={styles.topbarStatus}>
            <span />
            Administrador verificado
          </div>
        </header>

        <main className={styles.adminContent}>{renderedChildren}</main>
      </div>
    </div>
  );
}
