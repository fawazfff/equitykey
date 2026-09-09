"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}

export function getEquityKeyApiUrl(path = "") {
  return `${SUPABASE_URL}/functions/v1/equitykey-api${path}`;
}

export async function equityKeyApi<T>(path: string, init: RequestInit = {}) {
  const client = getSupabaseBrowserClient();
  const { data } = await client.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  const response = await fetch(getEquityKeyApiUrl(path), { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => ({ error: "The server returned an unreadable response." }));
  if (!response.ok) throw new Error(body.error || "EquityKey could not complete that request.");
  return body as T;
}
