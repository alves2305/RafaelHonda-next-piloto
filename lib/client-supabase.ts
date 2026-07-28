"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientPanelSupabase: SupabaseClient | null = null;

export function isClientSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getClientSupabaseClient() {
  if (!isClientSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!clientPanelSupabase) {
    clientPanelSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "rafael-honda-client-panel-auth",
        },
      },
    );
  }

  return clientPanelSupabase;
}
