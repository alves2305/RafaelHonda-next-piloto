import type { ReactNode } from "react";

import { ClientAccessGuard } from "@/components/client-demo/ClientAccessGuard";

export default function ClientDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientAccessGuard>{children}</ClientAccessGuard>;
}
