import type { ReactNode } from "react";

export const metadata = {
  title: "Painel Administrativo | Catálogo Honda",
  description: "Área administrativa do Catálogo Honda.",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
