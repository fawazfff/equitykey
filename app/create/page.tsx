"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowSquareOut, Check, Copy, Flask, LinkSimple, LockKey, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { parseUnits } from "viem";
import { baseSepolia } from "wagmi/chains";
import { useAccount, useSignMessage, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppHeader } from "@/components/app-header";
import { DEMO_TOKEN_ADDRESS, EQUITYKEY_ADDRESS, equityKeyAbi } from "@/lib/contracts";
import { equityKeyWalletApi } from "@/lib/supabase/client";

type Draft = {
  title: string;
  slug: string;
  description: string;
  minimum: string;
  oneTime: boolean;
  accessType: "protected_content" | "external_link";
  secret: string;
  expiresAt: string;
  metadataUri: string;
};

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

export default function CreateBenefitPage() {
  const reduceMotion = useReducedMotion();
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { writeContract, data: txHash, isPending: walletPending, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: baseSepolia.id });
  const [title, setTitle] = useState("Private Base Builder Pack");
  const [slug, setSlug] = useState("private-base-builder-pack");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("A private builder guide for wallets that hold enough demo AAPLc.");
  const [minimum, setMinimum] = useState("0.25");
  const [oneTime, setOneTime] = useState(true);
  const [accessType, setAccessType] = useState<"protected_content" | "external_link">("protected_content");
  const [secret, setSecret] = useState("Welcome to the private Base Builder Pack. Your wallet passed the ownership rule and your claim is recorded on Base Sepolia.");
  const [expiresAt, setExpiresAt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedLink, setSavedLink] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [networkMode, setNetworkMode] = useState<"demo" | "live">("demo");
  const [retryNonce, setRetryNonce] = useState(0);
  const finalizedHash = useRef<string | null>(null);

  const minimumNumber = Number(minimum);
  const valid = title.trim().length >= 3 && slug.length >= 3 && description.trim().length >= 10 && Number.isFinite(minimumNumber) && minimumNumber > 0 && secret.trim().length >= 3;
  const busy = walletPending || receipt.isLoading || saving;
  const stage = savedLink ? 4 : saving || receipt.isSuccess ? 3 : walletPending || receipt.isLoading ? 2 : 1;
  const pageLink = useMemo(() => `equitykey.vercel.app/benefit/${slug || "your-page"}`, [slug]);

  useEffect(() => {
    if (!receipt.isSuccess || !txHash || !draft || finalizedHash.current === txHash) return;
    finalizedHash.current = txHash;
    setSaving(true);
    setSaveError(null);
    if (!address) return;
    void equityKeyWalletApi<{ link: string }>("/benefits", {
        ...draft,
        minimumDisplay: Number(draft.minimum),
        txHash,
      }, address, signMessageAsync).then((result) => setSavedLink(result.link)).catch((error: Error) => {
      finalizedHash.current = null;
      setSaveError(error.message);
    }).finally(() => setSaving(false));
  }, [receipt.isSuccess, txHash, draft, address, signMessageAsync, retryNonce]);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(makeSlug(value));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    if (!valid || !address) return;
    if (chainId !== baseSepolia.id) await switchChainAsync({ chainId: baseSepolia.id });
    const metadataUri = `${window.location.origin}/api/metadata/${slug}`;
    const nextDraft = { title: title.trim(), slug, description: description.trim(), minimum, oneTime, accessType, secret: secret.trim(), expiresAt, metadataUri };
    setDraft(nextDraft);
    writeContract({
      address: EQUITYKEY_ADDRESS,
      abi: equityKeyAbi,
      functionName: "createBenefit",
      args: [0, [DEMO_TOKEN_ADDRESS], [parseUnits(minimum, 18)], 0n, oneTime, metadataUri],
      chainId: baseSepolia.id,
    });
  }

  async function copyLink() {
    if (!savedLink) return;
    await navigator.clipboard.writeText(savedLink);
    setCopied(true);
  }

  return <main className="product-shell">
    <AppHeader />
    <section className="create-page">
      <div className="create-heading"><div><p className="kicker"><Flask size={15} /> Choose your network first</p><h1>Create a benefit people can unlock.</h1><p>Use free test assets to create and test a share page. Real Mainnet stays read-only while this creator contract is on Sepolia.</p><div className="mode-switch create-mode" role="group" aria-label="Creation mode"><button type="button" className={networkMode === "demo" ? "selected" : ""} onClick={() => setNetworkMode("demo")}><Flask size={15} /> Demo · create and claim</button><button type="button" className={networkMode === "live" ? "selected" : ""} onClick={() => setNetworkMode("live")}>Live · check real holdings</button></div>{networkMode === "live" ? <Link className="live-mode-link" href="/app">Open the Mainnet ownership checker <ArrowRight size={15} /></Link> : null}</div><div className="create-progress" aria-label={`Step ${stage} of 4`}><span style={{ width: `${stage * 25}%` }} /><b>{stage}/4</b></div></div>

      <div className="create-grid">
        <motion.form className="creator-form" onSubmit={submit} aria-disabled={networkMode === "live"} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: .4 }}>
          <section><span className="form-step">01</span><div className="form-section-title"><h2>Describe the benefit</h2><p>Say what someone will receive after they qualify.</p></div><label><span>Benefit name</span><input value={title} maxLength={80} onChange={(event) => onTitle(event.target.value)} required /></label><label><span>Short explanation</span><textarea value={description} maxLength={320} onChange={(event) => setDescription(event.target.value)} required /></label><label><span>Share page</span><div className="slug-field"><span>equitykey.vercel.app/benefit/</span><input aria-label="Page name" value={slug} maxLength={72} onChange={(event) => { setSlugEdited(true); setSlug(makeSlug(event.target.value)); }} required /></div></label></section>

          <section><span className="form-step">02</span><div className="form-section-title"><h2>Choose the ownership rule</h2><p>The current demo uses the existing B20-compatible test share.</p></div><div className="field-pair"><label><span>Demo stock</span><div className="fixed-field"><b>AAPLc</b><small>Demo token</small></div></label><label><span>Amount needed</span><div className="amount-input"><input inputMode="decimal" value={minimum} onChange={(event) => setMinimum(event.target.value.replace(/[^0-9.]/g, ""))} required /><b>AAPLc</b></div></label></div><div className="choice-row"><button type="button" className={oneTime ? "choice selected" : "choice"} onClick={() => setOneTime(true)}><Check size={15} /> One-time unlock</button><button type="button" className={!oneTime ? "choice selected" : "choice"} onClick={() => setOneTime(false)}><ShieldCheck size={15} /> Keep checking ownership</button></div><label><span>Optional end date</span><input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label></section>

          <section><span className="form-step">03</span><div className="form-section-title"><h2>Add what they unlock</h2><p>Protected text stays encrypted. External links can still be copied after opening.</p></div><div className="choice-row"><button type="button" className={accessType === "protected_content" ? "choice selected" : "choice"} onClick={() => setAccessType("protected_content")}><LockKey size={15} /> Protected content</button><button type="button" className={accessType === "external_link" ? "choice selected" : "choice"} onClick={() => setAccessType("external_link")}><LinkSimple size={15} /> External link</button></div><label><span>{accessType === "external_link" ? "Private HTTPS link" : "Private content"}</span><textarea value={secret} maxLength={4000} placeholder={accessType === "external_link" ? "https://..." : "Write the private message or access code..."} onChange={(event) => setSecret(event.target.value)} required /></label></section>

          <div className="publish-zone"><div><ShieldCheck size={20} /><p><strong>Your wallet stays in control.</strong><span>{networkMode === "demo" ? "Publishing writes only the rule to Base Sepolia. You will approve a wallet signature after the transaction, then receive the real link." : "Mainnet is a real balance checker right now. Switch to Demo to create a free test benefit."}</span></p></div>{networkMode === "live" ? <Link className="publish-button" href="/app">Open Mainnet checker <ArrowRight size={18} /></Link> : !isConnected ? <WalletNotice /> : <motion.button whileTap={reduceMotion ? undefined : { scale: .97 }} className="publish-button" disabled={!valid || busy} type="submit">{busy ? <SpinnerGap className="spin" size={18} /> : <ArrowRight size={18} />} {walletPending ? "Confirm in wallet" : receipt.isLoading ? "Writing rule to Base" : saving ? "Sign and secure the benefit" : "Publish benefit"}</motion.button>}</div>
          {(writeError || saveError) ? <p className="form-error"><WarningCircle size={17} /> {saveError || writeError?.message || "The benefit could not be published."} {saveError && receipt.isSuccess ? <button type="button" onClick={() => setRetryNonce((value) => value + 1)}>Retry saving the link</button> : null}</p> : null}
        </motion.form>

        <aside className="benefit-preview"><div className="preview-toolbar"><span>Unpublished preview</span><i className="live-dot" /></div><div className="preview-body"><span className="preview-mark">EK</span><p className="eyebrow">Token-gated benefit</p><h2>{title || "Your benefit name"}</h2><p>{description || "Explain what the holder will receive."}</p><div className="preview-rule"><span>You need</span><strong>{minimum || "0"} demo AAPLc</strong><small>Base Sepolia · {oneTime ? "One-time unlock" : "Ownership checked each visit"}</small></div><button type="button" disabled>This works after publishing</button></div><div className="preview-link"><LinkSimple size={16} /><span>Not live yet · {pageLink}</span></div></aside>
      </div>
    </section>

    {savedLink ? <motion.div className="success-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.section className="success-sheet" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", bounce: .08, duration: .4 }}><span className="success-icon"><Check size={28} weight="bold" /></span><p>Benefit published</p><h2>Your share page is ready.</h2><span className="success-url">{savedLink}</span><div><button type="button" onClick={copyLink}><Copy size={17} /> {copied ? "Copied" : "Copy link"}</button><Link href={savedLink.replace(window.location.origin, "")}><ArrowSquareOut size={17} /> Open and test</Link></div><a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View creation receipt on BaseScan</a></motion.section></motion.div> : null}
  </main>;
}

function WalletNotice() {
  return <p className="connect-note"><LockKey size={17} /> Connect your wallet above to publish.</p>;
}
