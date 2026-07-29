"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getClientSupabaseClient } from "@/lib/client-supabase";

export function ClientLogoutButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);

    try {
      const supabase = getClientSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/cliente-demo/login");
      router.refresh();
    }
  }

  return (
    <button
      className={className}
      type="button"
      onClick={handleLogout}
      disabled={leaving}
    >
      <span aria-hidden="true">↩</span>
      {leaving ? "Saindo..." : "Sair"}
    </button>
  );
}
