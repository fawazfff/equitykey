"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowSquareOut, ChartBar, Check, Copy, Eye, Flask, LockKey, Pause, Play, Plus, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { baseSepolia } from "wagmi/chains";
import { useAccount, useSignMessage, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppHeader } from "@/components/app-header";
import { EQUITYKEY_ADDRESS, equityKeyAbi } from "@/lib/contracts";
import type { Benefit } from "@/lib/equitykey-types";
import { equityKeyWalletApi } from "@/lib/supabase/client";

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ benefit: Benefit; active: boolean } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const completedHash = useRef<string | null>(null);
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: baseSepolia.id });

  const loadBenefits = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await equityKeyWalletApi<{ benefits: Benefit[] }>("/dashboard", {}, address, signMessageAsync);
      setBenefits(result.benefits);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Your benefits could not be loaded.");
    } finally { setLoading(false); setLoaded(true); }
  }, [address, signMessageAsync]);
  useEffect(() => {
    if (!receipt.isSuccess || !txHash || !statusTarget || completedHash.current === txHash) return;
    completedHash.current = txHash;
    if (!address) return;
    void equityKeyWalletApi("/status", { slug: statusTarget.benefit.slug, active: statusTarget.active, txHash }, address, signMessageAsync)
      .then(() => loadBenefits())
      .catch((error: Error) => { completedHash.current = null; setStatusError(error.message); })
      .finally(() => setStatusTarget(null));
  }, [receipt.isSuccess, txHash, statusTarget, loadBenefits, address, signMessageAsync]);

  async function changeStatus(benefit: Benefit) {
    if (!benefit.onchain_benefit_id) return;
    setStatusError(null);
    const active = benefit.status !== "published";
    if (chainId !== baseSepolia.id) await switchChainAsync({ chainId: baseSepolia.id });
    setStatusTarget({ benefit, active });
    writeContract({ address: EQUITYKEY_ADDRESS, abi: equityKeyAbi, functionName: "setBenefitActive", args: [BigInt(benefit.onchain_benefit_id), active], chainId: baseSepolia.id });
  }

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/benefit/${slug}`);
    setCopiedSlug(slug);
  }

  const totals = benefits.reduce((sum, benefit) => ({ views: sum.views + benefit.view_count, checks: sum.checks + benefit.check_count, claims: sum.claims + benefit.claim_count }), { views: 0, checks: 0, claims: 0 });

  return <main className="product-shell">
    <AppHeader />
    <section className="dashboard-page">
      <div className="dashboard-heading"><div><p className="kicker"><Flask size={15} /> Base Sepolia creator tools</p><h1>Your benefits.</h1><p>Create a page, share it, and watch verified holders unlock it.</p></div><Link href="/create" className="primary-button"><Plus size={17} /> Create benefit</Link></div>

      {!isConnected ? <DashboardGate icon={<LockKey size={25} />} title="Connect your wallet" body="Your wallet is your creator account. Connect it to see the benefits you made." /> : !loaded ? <DashboardGate icon={<Check size={25} />} title="Show my benefits" body="Approve a free wallet signature. It only proves this dashboard belongs to you."><button type="button" onClick={() => void loadBenefits()} disabled={loading}>{loading ? "Checking wallet" : "Show my benefits"} <ArrowRight size={16} /></button></DashboardGate> : <>
        <div className="stats-strip"><article><Eye size={19} /><span>Page views</span><strong>{totals.views}</strong></article><article><ChartBar size={19} /><span>Wallet checks</span><strong>{totals.checks}</strong></article><article><Check size={19} /><span>Successful unlocks</span><strong>{totals.claims}</strong></article></div>
        {loading ? <div className="dashboard-loading"><SpinnerGap className="spin" size={22} /> Loading your benefits</div> : loadError ? <div className="dashboard-loading error"><WarningCircle size={22} /> {loadError}</div> : benefits.length === 0 ? <div className="empty-dashboard"><span className="empty-orbit"><i /><i /></span><h2>Create your first ownership benefit.</h2><p>You will get a public link that you can open and test with the same wallet.</p><Link href="/create">Create a benefit <ArrowRight size={17} /></Link></div> : <div className="benefit-list">{benefits.map((benefit, index) => {
          const rule = benefit.equitykey_benefit_rules?.[0];
          const changing = statusTarget?.benefit.id === benefit.id && (isPending || receipt.isLoading);
          return <motion.article key={benefit.id} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: .35, delay: index * .04 }}>
            <div className="benefit-list-top"><span className={`status-pill ${benefit.status}`}><i /> {benefit.status}</span><span>Benefit #{benefit.onchain_benefit_id}</span></div><h2>{benefit.title}</h2><p>{benefit.description}</p><div className="benefit-rule-line"><span>Wallet needs</span><strong>{rule?.minimum_display ?? 0} {rule?.token_symbol ?? "demo AAPLc"}</strong></div><div className="mini-stats"><span>{benefit.view_count} views</span><span>{benefit.check_count} checks</span><span>{benefit.claim_count} unlocks</span></div><div className="benefit-card-actions"><Link href={`/benefit/${benefit.slug}`}>Open page <ArrowSquareOut size={15} /></Link><button type="button" onClick={() => void copyLink(benefit.slug)}><Copy size={15} /> {copiedSlug === benefit.slug ? "Copied" : "Copy link"}</button><button type="button" onClick={() => void changeStatus(benefit)} disabled={changing}>{changing ? <SpinnerGap className="spin" size={15} /> : benefit.status === "published" ? <Pause size={15} /> : <Play size={15} />} {benefit.status === "published" ? "Pause" : "Reopen"}</button></div>
          </motion.article>;
        })}</div>}
        {(statusError || writeError) ? <p className="form-error"><WarningCircle size={17} /> {statusError || writeError?.message}</p> : null}
      </>}
    </section>
  </main>;
}

function DashboardGate({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return <section className="dashboard-gate"><span>{icon}</span><h2>{title}</h2><p>{body}</p>{children}</section>;
}
