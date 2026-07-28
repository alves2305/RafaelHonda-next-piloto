import type { ReactNode } from "react";

import { ClientAccessGuard } from "@/components/client-demo/ClientAccessGuard";

export default function ClientSubscriptionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientAccessGuard>{children}</ClientAccessGuard>;
}
