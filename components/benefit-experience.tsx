"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowSquareOut, Check, CheckCircle, Copy, Flask, Key, LockKey, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { formatUnits } from "viem";
import { baseSepolia } from "wagmi/chains";
import { useAccount, useReadContract, useSignMessage, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppHeader } from "@/components/app-header";
import { demoTokenAbi, DEMO_TOKEN_ADDRESS, EQUITYKEY_ADDRESS, equityKeyAbi } from "@/lib/contracts";
import type { Benefit } from "@/lib/equitykey-types";
import { equityKeyApi, equityKeyWalletApi } from "@/lib/supabase/client";
import { shorten } from "@/lib/stocks";

type UnlockResult = { accessType: "protected_content" | "external_link"; content: string; verifiedAt: string; receiptUrl: string | null };

export function BenefitExperience({ benefit }: { benefit: Benefit }) {
  const reduceMotion = useReducedMotion();
  const rule = benefit.equitykey_benefit_rules?.[0];
  const benefitId = BigInt(benefit.onchain_benefit_id ?? 0);
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [action, setAction] = useState<"mint" | "claim" | null>(null);
  const [checkStarted, setCheckStarted] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlock, setUnlock] = useState<UnlockResult | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const handledHash = useRef<string | null>(null);
  const viewRecorded = useRef(false);
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: baseSepolia.id });
  const balance = useReadContract({ address: DEMO_TOKEN_ADDRESS, abi: demoTokenAbi, functionName: "scaledBalanceOf", args: address ? [address] : undefined, chainId: baseSepolia.id, query: { enabled: Boolean(address), retry: 1 } });
  const eligible = useReadContract({ address: EQUITYKEY_ADDRESS, abi: equityKeyAbi, functionName: "isEligible", args: address && benefitId ? [benefitId, address] : undefined, chainId: baseSepolia.id, query: { enabled: Boolean(address && benefitId && checkStarted), retry: 1 } });
  const claimed = useReadContract({ address: EQUITYKEY_ADDRESS, abi: equityKeyAbi, functionName: "hasClaimed", args: address && benefitId ? [benefitId, address] : undefined, chainId: baseSepolia.id, query: { enabled: Boolean(address && benefitId), retry: 1 } });
  const amount = balance.data === undefined ? 0 : Number(formatUnits(balance.data, 18));
  const required = Number(rule?.minimum_display ?? 0);
  const progress = required > 0 ? Math.min(100, (amount / required) * 100) : 0;
  const transactionBusy = isPending || receipt.isLoading;

  useEffect(() => {
    if (viewRecorded.current) return;
    viewRecorded.current = true;
    const key = `equitykey-view:${benefit.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void equityKeyApi("/events", { method: "POST", body: JSON.stringify({ slug: benefit.slug, eventType: "view" }) }).catch(() => undefined);
  }, [benefit.slug]);

  useEffect(() => {
    if (!receipt.isSuccess || !txHash || handledHash.current === txHash) return;
    handledHash.current = txHash;
    void Promise.all([balance.refetch(), eligible.refetch(), claimed.refetch()]).then(async () => {
      if (action !== "claim") return;
      await unlockBenefit(txHash);
    });
  // The refetch functions are stable query actions; the transaction hash is the event boundary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess, txHash, action]);

  async function prepare() {
    setPageError(null);
    if (chainId !== baseSepolia.id) await switchChainAsync({ chainId: baseSepolia.id });
  }

  async function getShare() {
    await prepare();
    setAction("mint");
    reset();
    writeContract({ address: DEMO_TOKEN_ADDRESS, abi: demoTokenAbi, functionName: "claimDemoTokens", chainId: baseSepolia.id });
  }

  async function checkWallet() {
    await prepare();
    setCheckStarted(true);
    setUnlock(null);
    await equityKeyApi("/events", { method: "POST", body: JSON.stringify({ slug: benefit.slug, eventType: "check" }) }).catch(() => undefined);
    await Promise.all([balance.refetch(), eligible.refetch(), claimed.refetch()]);
  }

  async function claimBenefit() {
    setPageError(null);
    await prepare();
    setAction("claim");
    reset();
    writeContract({ address: EQUITYKEY_ADDRESS, abi: equityKeyAbi, functionName: "claim", args: [benefitId], chainId: baseSepolia.id });
  }

  async function unlockBenefit(hash?: string) {
    setPageError(null);
    if (!address) return;
    setUnlocking(true);
    try {
      const result = await equityKeyWalletApi<UnlockResult>("/unlock", { slug: benefit.slug, txHash: hash || undefined }, address, signMessageAsync);
      setUnlock(result);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Access could not be unlocked.");
    } finally {
      setUnlocking(false);
    }
  }

  async function copyPage() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  const canClaim = Boolean(eligible.data) && !claimed.data;
  return <main className="product-shell benefit-public-shell">
    <AppHeader />
    <section className="benefit-public-page">
      <div className="benefit-breadcrumb"><Link href="/app"><ArrowLeft size={15} /> Explore</Link><button type="button" onClick={copyPage}><Copy size={15} /> {copied ? "Page copied" : "Copy page"}</button></div>
      <div className="public-benefit-grid">
        <motion.article className="public-benefit-card" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: .4 }}>
          <div className="public-card-top"><span className="demo-badge"><Flask size={14} /> Free demo</span><span>Benefit #{benefit.onchain_benefit_id}</span></div><span className="public-benefit-mark">EK</span><p className="eyebrow">Ownership benefit</p><h1>{benefit.title}</h1><p className="public-description">{benefit.description}</p><div className="public-rule"><div><span>Wallet needs</span><strong>{required} demo AAPLc</strong></div><small>Base Sepolia · {benefit.one_time ? "One-time unlock" : "Balance checked whenever you return"}</small></div><div className="creator-line"><span>Created by</span><strong>{shorten(benefit.creator_wallet, 7)}</strong></div><p className="custody-line"><ShieldCheck size={16} /> EquityKey never asks for token approval or custody.</p>
        </motion.article>

        <section className="unlock-panel">
          <div className="unlock-heading"><span><Key size={20} /></span><div><p>Unlock check</p><h2>Prove it with your wallet.</h2></div></div>
          {!isConnected ? <div className="unlock-empty"><LockKey size={28} /><h3>Connect your wallet to start.</h3><p>The test uses free demo shares on Base Sepolia. Connect using the button above.</p></div> : <>
            <div className="ownership-meter"><div><span>Your demo balance</span><strong>{balance.isLoading ? "Reading…" : `${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} AAPLc`}</strong></div><div className="meter-track"><motion.span initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "spring", bounce: 0, duration: .5 }} /></div><small>{amount >= required ? "You have enough to pass this rule." : `You need ${Math.max(0, required - amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} more demo AAPLc.`}</small></div>
            <div className="unlock-steps">
              <article className={amount >= required ? "done" : ""}><span>{amount >= required ? <Check size={15} /> : "1"}</span><div><h3>Get a free test share</h3><p>Skip this if your wallet already has demo AAPLc.</p></div><button type="button" onClick={() => void getShare()} disabled={transactionBusy || amount >= required}>{amount >= required ? "Received" : "Get share"}</button></article>
              <article className={eligible.data ? "done" : ""}><span>{eligible.data ? <Check size={15} /> : "2"}</span><div><h3>Check the ownership rule</h3><p>Read your balance and compare it with {required} AAPLc.</p></div><button type="button" onClick={() => void checkWallet()} disabled={transactionBusy || amount < required}>{eligible.isFetching ? "Checking" : eligible.data ? "Passed" : "Check wallet"}</button></article>
              <article className={claimed.data ? "done" : ""}><span>{claimed.data ? <Check size={15} /> : "3"}</span><div><h3>Record your claim</h3><p>Save public proof that this wallet passed the rule.</p></div>{claimed.data ? <button type="button" onClick={() => void unlockBenefit()} disabled={unlocking}>{unlocking ? "Opening" : "Open access"}</button> : <button type="button" onClick={() => void claimBenefit()} disabled={transactionBusy || !canClaim}>{transactionBusy && action === "claim" ? "Recording" : "Claim benefit"}</button>}</article>
            </div>
          </>}
          {transactionBusy ? <div className="transaction-ribbon"><SpinnerGap className="spin" size={18} /><span><strong>{isPending ? "Confirm in your wallet" : action === "mint" ? "Getting your demo share" : "Recording your claim"}</strong><small>{isPending ? "Read the wallet request, then approve it." : "Base Sepolia is confirming the transaction."}</small></span></div> : null}
          {(pageError || writeError) ? <p className="form-error"><WarningCircle size={17} /> {pageError || writeError?.message}</p> : null}
        </section>
      </div>
    </section>

    <AnimatePresence>{unlock ? <motion.div className="success-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="access-sheet" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", bounce: .06, duration: .4 }}><span className="success-icon"><CheckCircle size={30} weight="fill" /></span><p>Ownership verified</p><h2>Access unlocked.</h2>{unlock.accessType === "external_link" ? <a className="unlocked-link" href={unlock.content} target="_blank" rel="noreferrer">Open the private destination <ArrowSquareOut size={17} /></a> : <div className="protected-copy"><LockKey size={18} /><p>{unlock.content}</p></div>}<div className="access-actions"><button type="button" onClick={() => setUnlock(null)}>Close</button>{unlock.receiptUrl ? <a href={unlock.receiptUrl} target="_blank" rel="noreferrer">View BaseScan receipt <ArrowSquareOut size={15} /></a> : null}</div></motion.section></motion.div> : null}</AnimatePresence>
  </main>;
}
