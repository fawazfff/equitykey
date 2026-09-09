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

type WalletProof = { wallet: `0x${string}`; action: string; resource: string; txHash?: string; issuedAt: number };

export function walletProofMessage({ wallet, action, resource, txHash, issuedAt }: WalletProof) {
  return `EquityKey wallet proof\nAction: ${action}\nWallet: ${wallet.toLowerCase()}\nResource: ${resource}\nTransaction: ${txHash || "none"}\nIssued minute: ${issuedAt}`;
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

export async function equityKeyWalletApi<T>(
  path: string,
  payload: Record<string, unknown>,
  wallet: `0x${string}`,
  signMessage: (args: { message: string }) => Promise<`0x${string}`>,
) {
  const issuedAt = Math.floor(Date.now() / 60_000);
  const action = path.replace(/^\//, "") || "request";
  const resource = typeof payload.slug === "string" ? payload.slug : "dashboard";
  const txHash = typeof payload.txHash === "string" ? payload.txHash : undefined;
  const signature = await signMessage({ message: walletProofMessage({ wallet, action, resource, txHash, issuedAt }) });
  return equityKeyApi<T>(path, { method: "POST", body: JSON.stringify({ ...payload, wallet, signature, issuedAt }) });
}
