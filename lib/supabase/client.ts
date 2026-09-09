"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("The EquityKey database is not configured.");
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}

export function getEquityKeyApiUrl(path = "") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("The EquityKey database is not configured.");
  return `${url}/functions/v1/equitykey-api${path}`;
}

export async function equityKeyApi<T>(path: string, init: RequestInit = {}) {
  const client = getSupabaseBrowserClient();
  const { data } = await client.auth.getSession();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (key) headers.set("apikey", key);
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  const response = await fetch(getEquityKeyApiUrl(path), { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => ({ error: "The server returned an unreadable response." }));
  if (!response.ok) throw new Error(body.error || "EquityKey could not complete that request.");
  return body as T;
}
