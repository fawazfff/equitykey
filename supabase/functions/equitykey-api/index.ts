import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { createPublicClient, decodeEventLog, http, isAddress, parseAbi, parseUnits, verifyMessage } from "npm:viem@2.56.3";
import { baseSepolia } from "npm:viem@2.56.3/chains";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE_RPC_URL = Deno.env.get("BASE_SEPOLIA_RPC_URL") ?? "https://sepolia.base.org";
const CONTRACT = "0xf4842f5c493cfdb7bb69df0807b346dbeec43800" as const;
const DEMO_TOKEN = "0xf32757dfd9714889f6bb3db44e258337be1d6a74" as const;
const SITE_URL = "https://equitykey.vercel.app";
const SYSTEM_BENEFIT_ID = "11111111-1111-4111-8111-111111111111";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const allowedOrigins = new Set([SITE_URL, "http://localhost:3000", "http://127.0.0.1:3000"]);

const contractAbi = parseAbi([
  "event BenefitCreated(uint256 indexed benefitId,address indexed creator,bytes32 indexed ruleRef,uint8 ruleType,bool oneTime,string metadataURI)",
  "event BenefitStatusChanged(uint256 indexed benefitId,bool active)",
  "event BenefitClaimed(uint256 indexed benefitId,address indexed account,bytes32 indexed ruleRef,uint256 claimNumber,uint256 timestamp)",
  "function benefits(uint256) view returns (address creator,uint8 ruleType,bool oneTime,bool active,uint256 basketThresholdWad,bytes32 ruleRef,string metadataURI)",
  "function getRule(uint256) view returns (address[] tokens,uint256[] minimums)",
  "function hasClaimed(uint256,address) view returns (bool)",
  "function isEligible(uint256,address) view returns (bool)",
]);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const chain = createPublicClient({ chain: baseSepolia, transport: http(BASE_RPC_URL) });

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? SITE_URL;
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : SITE_URL,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "private, no-store",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function walletProofMessage(action: string, wallet: string, resource: string, txHash: string, issuedAt: number) {
  return `EquityKey wallet proof\nAction: ${action}\nWallet: ${wallet.toLowerCase()}\nResource: ${resource}\nTransaction: ${txHash || "none"}\nIssued minute: ${issuedAt}`;
}

async function requireWalletProof(body: Record<string, unknown>, action: string, resource: string, txHash = "") {
  const wallet = cleanText(body.wallet, 42).toLowerCase() as `0x${string}`;
  const signature = cleanText(body.signature, 140) as `0x${string}`;
  const issuedAt = Number(body.issuedAt);
  const currentMinute = Math.floor(Date.now() / 60_000);
  if (!isAddress(wallet) || !/^0x[0-9a-fA-F]{130}$/.test(signature) || !Number.isInteger(issuedAt) || Math.abs(currentMinute - issuedAt) > 2) return { error: "Approve the fresh wallet signature to continue." } as const;
  const valid = await verifyMessage({ address: wallet, message: walletProofMessage(action, wallet, resource, txHash, issuedAt), signature });
  if (!valid) return { error: "This wallet signature could not be verified." } as const;
  return { wallet } as const;
}

async function encryptionKey() {
  const seed = Deno.env.get("BENEFIT_ENCRYPTION_KEY") || SERVICE_ROLE_KEY;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`equitykey-benefits-v1:${seed}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return { ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv) };
}

async function decryptSecret(ciphertext: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, await encryptionKey(), fromBase64(ciphertext));
  return new TextDecoder().decode(decrypted);
}

async function findEvent(hash: `0x${string}`, eventName: "BenefitCreated" | "BenefitClaimed" | "BenefitStatusChanged") {
  const receipt = await chain.getTransactionReceipt({ hash });
  if (receipt.status !== "success" || receipt.to?.toLowerCase() !== CONTRACT) return null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CONTRACT) continue;
    try {
      const decoded = decodeEventLog({ abi: contractAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === eventName) return decoded.args;
    } catch {
      // A receipt can contain unrelated logs.
    }
  }
  return null;
}

async function createBenefit(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json(request, { error: "The benefit details are missing." }, 400);

  const slug = cleanText(body.slug, 72).toLowerCase();
  const title = cleanText(body.title, 80);
  const description = cleanText(body.description, 320);
  const secret = cleanText(body.secret, 4000);
  const txHash = cleanText(body.txHash, 66) as `0x${string}`;
  const metadataUri = cleanText(body.metadataUri, 240);
  const accessType = body.accessType === "external_link" ? "external_link" : "protected_content";
  const minimumDisplay = Number(body.minimumDisplay);
  const oneTime = body.oneTime !== false;
  const expiresAt = typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : null;

  const auth = await requireWalletProof(body, "benefits", slug, txHash);
  if ("error" in auth) return json(request, auth, 401);

  if (!SLUG_RE.test(slug) || title.length < 3 || description.length < 10 || secret.length < 3) return json(request, { error: "Complete every benefit field before publishing." }, 400);
  if (!HASH_RE.test(txHash) || !Number.isFinite(minimumDisplay) || minimumDisplay <= 0 || minimumDisplay > 1000000) return json(request, { error: "The ownership rule or transaction is invalid." }, 400);
  if (accessType === "external_link") {
    try {
      const target = new URL(secret);
      if (target.protocol !== "https:") throw new Error();
    } catch {
      return json(request, { error: "External destinations must use a valid HTTPS link." }, 400);
    }
  }

  const { data: previous } = await admin.from("equitykey_benefits").select("id,slug").eq("create_tx_hash", txHash.toLowerCase()).maybeSingle();
  if (previous) return json(request, { benefit: previous, link: `${SITE_URL}/benefit/${previous.slug}` });

  const created = await findEvent(txHash, "BenefitCreated");
  if (!created || created.creator.toLowerCase() !== auth.wallet) return json(request, { error: "This transaction did not create a benefit for your signed-in wallet." }, 400);
  const benefitId = created.benefitId;
  const [onchainBenefit, onchainRule] = await Promise.all([
    chain.readContract({ address: CONTRACT, abi: contractAbi, functionName: "benefits", args: [benefitId] }),
    chain.readContract({ address: CONTRACT, abi: contractAbi, functionName: "getRule", args: [benefitId] }),
  ]);
  const expectedMinimum = parseUnits(minimumDisplay.toString(), 18);
  const [creator, ruleType, chainOneTime, active, , , chainMetadata] = onchainBenefit;
  const [tokens, minimums] = onchainRule;
  const matches = creator.toLowerCase() === auth.wallet && ruleType === 0 && chainOneTime === oneTime && active && chainMetadata === metadataUri && tokens.length === 1 && tokens[0].toLowerCase() === DEMO_TOKEN && minimums[0] === expectedMinimum;
  if (!matches) return json(request, { error: "The saved rule does not match the confirmed Base transaction." }, 400);

  const encrypted = await encryptSecret(secret);
  const now = new Date().toISOString();
  const { data: benefit, error } = await admin.from("equitykey_benefits").insert({
    slug,
    creator_user_id: null,
    creator_wallet: auth.wallet,
    source: "user",
    title,
    description,
    access_type: accessType,
    contract_address: CONTRACT,
    onchain_benefit_id: Number(benefitId),
    create_tx_hash: txHash.toLowerCase(),
    rule_type: "SINGLE",
    one_time: oneTime,
    status: "published",
    expires_at: expiresAt,
    metadata_uri: metadataUri,
    published_at: now,
  }).select().single();
  if (error || !benefit) return json(request, { error: error?.code === "23505" ? "That page name is already being used." : "The benefit could not be saved." }, 409);

  const [{ error: ruleError }, { error: secretError }] = await Promise.all([
    admin.from("equitykey_benefit_rules").insert({ benefit_id: benefit.id, position: 0, token_address: DEMO_TOKEN, token_symbol: "demo AAPLc", minimum_scaled: expectedMinimum.toString(), minimum_display: minimumDisplay }),
    admin.from("equitykey_benefit_secrets").insert({ benefit_id: benefit.id, ...encrypted }),
  ]);
  if (ruleError || secretError) {
    await admin.from("equitykey_benefits").delete().eq("id", benefit.id);
    return json(request, { error: "The benefit transaction succeeded, but its private details could not be saved. You can retry safely." }, 500);
  }
  await admin.from("equitykey_events").insert({ benefit_id: benefit.id, wallet_address: auth.wallet, event_type: "publish", tx_hash: txHash.toLowerCase() });
  return json(request, { benefit, link: `${SITE_URL}/benefit/${slug}` }, 201);
}

async function unlockBenefit(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = cleanText(body?.slug, 72).toLowerCase();
  const txHash = cleanText(body?.txHash, 66) as `0x${string}`;
  if (!SLUG_RE.test(slug) || (txHash && !HASH_RE.test(txHash))) return json(request, { error: "The claim details are invalid." }, 400);
  if (!body) return json(request, { error: "The claim details are missing." }, 400);
  const auth = await requireWalletProof(body, "unlock", slug, txHash);
  if ("error" in auth) return json(request, auth, 401);

  const { data: benefit } = await admin.from("equitykey_benefits").select("*,equitykey_benefit_rules(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!benefit || !benefit.onchain_benefit_id) return json(request, { error: "This benefit is not available." }, 404);
  if (benefit.expires_at && new Date(benefit.expires_at).getTime() < Date.now()) return json(request, { error: "This benefit has expired." }, 410);

  const [hasClaimed, eligible] = await Promise.all([
    chain.readContract({ address: CONTRACT, abi: contractAbi, functionName: "hasClaimed", args: [BigInt(benefit.onchain_benefit_id), auth.wallet] }),
    benefit.one_time ? Promise.resolve(true) : chain.readContract({ address: CONTRACT, abi: contractAbi, functionName: "isEligible", args: [BigInt(benefit.onchain_benefit_id), auth.wallet] }),
  ]);
  if (!hasClaimed || !eligible) return json(request, { error: "The wallet no longer passes this benefit rule." }, 403);
  if (txHash) {
    const claimed = await findEvent(txHash, "BenefitClaimed");
    if (!claimed || Number(claimed.benefitId) !== benefit.onchain_benefit_id || claimed.account.toLowerCase() !== auth.wallet) return json(request, { error: "That transaction is not a valid claim for this wallet." }, 400);
  }

  let content = "You unlocked the EquityKey builder note. Ownership was checked on Base Sepolia and your claim receipt is now public on BaseScan.";
  if (benefit.id !== SYSTEM_BENEFIT_ID) {
    const { data: stored } = await admin.from("equitykey_benefit_secrets").select("ciphertext,iv").eq("benefit_id", benefit.id).single();
    if (!stored) return json(request, { error: "The protected content is unavailable." }, 503);
    content = await decryptSecret(stored.ciphertext, stored.iv);
  }

  const { data: existing } = await admin.from("equitykey_events").select("id").eq("benefit_id", benefit.id).eq("wallet_address", auth.wallet).eq("event_type", "unlock").maybeSingle();
  await admin.from("equitykey_events").insert({ benefit_id: benefit.id, wallet_address: auth.wallet, event_type: "unlock", tx_hash: txHash ? txHash.toLowerCase() : null });
  if (!existing) await admin.from("equitykey_benefits").update({ claim_count: benefit.claim_count + 1, updated_at: new Date().toISOString() }).eq("id", benefit.id);
  return json(request, { accessType: benefit.access_type, content, verifiedAt: new Date().toISOString(), receiptUrl: txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null });
}

async function recordEvent(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = cleanText(body?.slug, 72).toLowerCase();
  const eventType = body?.eventType === "check" ? "check" : "view";
  if (!SLUG_RE.test(slug)) return json(request, { error: "Invalid benefit." }, 400);
  const { data: benefit } = await admin.from("equitykey_benefits").select("id,view_count,check_count").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!benefit) return json(request, { error: "Benefit not found." }, 404);
  const update = eventType === "view" ? { view_count: benefit.view_count + 1 } : { check_count: benefit.check_count + 1 };
  await Promise.all([
    admin.from("equitykey_benefits").update({ ...update, updated_at: new Date().toISOString() }).eq("id", benefit.id),
    admin.from("equitykey_events").insert({ benefit_id: benefit.id, event_type: eventType }),
  ]);
  return json(request, { ok: true });
}

async function updateStatus(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = cleanText(body?.slug, 72).toLowerCase();
  const txHash = cleanText(body?.txHash, 66) as `0x${string}`;
  const active = body?.active === true;
  if (!SLUG_RE.test(slug) || !HASH_RE.test(txHash)) return json(request, { error: "A confirmed status transaction is required." }, 400);
  if (!body) return json(request, { error: "The status details are missing." }, 400);
  const auth = await requireWalletProof(body, "status", slug, txHash);
  if ("error" in auth) return json(request, auth, 401);
  const { data: benefit } = await admin.from("equitykey_benefits").select("*").eq("slug", slug).eq("creator_wallet", auth.wallet).maybeSingle();
  if (!benefit || !benefit.onchain_benefit_id) return json(request, { error: "Benefit not found." }, 404);
  const changed = await findEvent(txHash, "BenefitStatusChanged");
  if (!changed || Number(changed.benefitId) !== benefit.onchain_benefit_id || changed.active !== active) return json(request, { error: "The status transaction does not match this benefit." }, 400);
  const status = active ? "published" : "paused";
  await Promise.all([
    admin.from("equitykey_benefits").update({ status, updated_at: new Date().toISOString() }).eq("id", benefit.id),
    admin.from("equitykey_events").insert({ benefit_id: benefit.id, wallet_address: auth.wallet, event_type: active ? "publish" : "pause", tx_hash: txHash.toLowerCase() }),
  ]);
  return json(request, { ok: true, status });
}

async function dashboard(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json(request, { error: "Connect your wallet first." }, 400);
  const auth = await requireWalletProof(body, "dashboard", "dashboard");
  if ("error" in auth) return json(request, auth, 401);
  const { data, error } = await admin.from("equitykey_benefits").select("*,equitykey_benefit_rules(*)").eq("creator_wallet", auth.wallet).order("created_at", { ascending: false });
  if (error) return json(request, { error: "Your benefits could not be loaded." }, 500);
  return json(request, { benefits: data ?? [] });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  const path = new URL(request.url).pathname.replace(/^\/equitykey-api/, "").replace(/^\/functions\/v1\/equitykey-api/, "") || "/";
  try {
    if (request.method === "GET" && path === "/health") return json(request, { ok: true, network: "Base Sepolia", contract: CONTRACT });
    if (request.method === "POST" && path === "/benefits") return await createBenefit(request);
    if (request.method === "POST" && path === "/unlock") return await unlockBenefit(request);
    if (request.method === "POST" && path === "/events") return await recordEvent(request);
    if (request.method === "POST" && path === "/status") return await updateStatus(request);
    if (request.method === "POST" && path === "/dashboard") return await dashboard(request);
    return json(request, { error: "Route not found." }, 404);
  } catch (error) {
    console.error("equitykey-api", error instanceof Error ? error.message : "unknown error");
    return json(request, { error: "EquityKey could not complete that request. No access was granted." }, 500);
  }
});
