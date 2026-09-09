"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Address, formatUnits, isAddress } from "viem";
import { base, baseSepolia } from "wagmi/chains";
import { useAccount, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ArrowLeft, ArrowSquareOut, Check, CheckCircle, Copy, Flask, Info, LockKey, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { Logo } from "@/components/logo";
import { WalletButton } from "@/components/wallet-button";
import { b20Abi, demoTokenAbi, DEMO_TOKEN_ADDRESS, equityKeyAbi, EQUITYKEY_ADDRESS } from "@/lib/contracts";
import { shorten, STOCKS } from "@/lib/stocks";

type Mode = "live" | "demo";
type Stage = "idle" | "checking" | "result";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const demoTokenAddress = DEMO_TOKEN_ADDRESS ?? ZERO_ADDRESS;
const equityKeyAddress = EQUITYKEY_ADDRESS ?? ZERO_ADDRESS;

export default function BenefitWorkspace() {
  const [mode, setMode] = useState<Mode>("live");
  const [selected, setSelected] = useState(STOCKS[0]);
  const [manualAddress, setManualAddress] = useState("");
  const [required, setRequired] = useState("0.25");
  const [stage, setStage] = useState<Stage>("idle");
  const [copied, setCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState<"mint" | "claim" | null>(null);
  const reduceMotion = useReducedMotion();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const target = (manualAddress || address || "") as Address;
  const validTarget = isAddress(target);

  const liveBalance = useReadContract({ address: selected.address, abi: b20Abi, functionName: "scaledBalanceOf", args: validTarget ? [target] : undefined, chainId: base.id, query: { enabled: mode === "live" && validTarget && stage !== "idle", retry: 1 } });
  const demoBalance = useReadContract({ address: demoTokenAddress, abi: demoTokenAbi, functionName: "scaledBalanceOf", args: address ? [address] : undefined, chainId: baseSepolia.id, query: { enabled: mode === "demo" && Boolean(address && DEMO_TOKEN_ADDRESS), retry: 1 } });
  const eligibility = useReadContract({ address: equityKeyAddress, abi: equityKeyAbi, functionName: "isEligible", args: address ? [1n, address] : undefined, chainId: baseSepolia.id, query: { enabled: mode === "demo" && Boolean(address && EQUITYKEY_ADDRESS), retry: 1 } });
  const { writeContract, data: txHash, isPending: writePending, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: baseSepolia.id });
  const refreshedHash = useRef<string | null>(null);
  const refetchDemoBalance = demoBalance.refetch;
  const refetchEligibility = eligibility.refetch;

  useEffect(() => {
    if (!receipt.isSuccess || !txHash || refreshedHash.current === txHash) return;
    refreshedHash.current = txHash;
    void Promise.all([refetchDemoBalance(), refetchEligibility()]);
  }, [receipt.isSuccess, txHash, refetchDemoBalance, refetchEligibility]);

  const balanceData = mode === "live" ? liveBalance.data : demoBalance.data;
  const displayBalance = balanceData === undefined ? null : Number(formatUnits(balanceData, 18));
  const requiredNumber = Math.max(0, Number(required) || 0);
  const qualifies = mode === "demo" ? Boolean(eligibility.data) : displayBalance !== null && displayBalance >= requiredNumber;
  const checking = mode === "live" && liveBalance.isFetching;
  const transactionBusy = writePending || receipt.isLoading;
  const readError = mode === "live" ? liveBalance.error : demoBalance.error || eligibility.error;

  function changeMode(next: Mode) { setMode(next); setStage("idle"); setManualAddress(""); setCopied(false); }
  function checkOwnership() { if (!validTarget) return; setStage("checking"); window.setTimeout(() => setStage("result"), 650); }
  function ensureSepolia(action: () => void) { if (chainId !== baseSepolia.id) { switchChain({ chainId: baseSepolia.id }); return; } action(); }
  function mintDemo() { if (!DEMO_TOKEN_ADDRESS) return; ensureSepolia(() => { setPendingAction("mint"); writeContract({ address: demoTokenAddress, abi: demoTokenAbi, functionName: "claimDemoTokens", chainId: baseSepolia.id }); }); }
  function claimBenefit() { if (!EQUITYKEY_ADDRESS) return; ensureSepolia(() => { setPendingAction("claim"); writeContract({ address: equityKeyAddress, abi: equityKeyAbi, functionName: "claim", args: [1n], chainId: baseSepolia.id }); }); }
  function copyReceipt() { if (!txHash) return; navigator.clipboard.writeText(txHash); setCopied(true); }

  const demoConfigured = Boolean(DEMO_TOKEN_ADDRESS && EQUITYKEY_ADDRESS);

  return <motion.main className="workspace-shell" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: .4 }}>
    <header className="workspace-header"><Logo /><div className="workspace-header-right"><span className="network-chip"><span />{mode === "live" ? "Base Mainnet" : "Base Sepolia"}</span><WalletButton /></div></header>
    <div className="workspace-body">
      <aside className="workspace-aside"><Link href="/" className="back-link"><ArrowLeft size={16} /> Home</Link><div className="aside-title"><p>Benefit workspace</p><span>Verify a wallet against a real ownership rule.</span></div><ol><li className="active"><span>1</span>Choose mode</li><li className={stage !== "idle" ? "active" : ""}><span>2</span>Check ownership</li><li className={stage === "result" && qualifies ? "active" : ""}><span>3</span>Claim benefit</li></ol><div className="custody-note"><LockKey size={20} /><strong>Your assets stay yours.</strong><p>EquityKey reads balances and records claims. It never asks for token approval or custody.</p></div></aside>
      <section className="workspace-main">
        <div className="workspace-intro"><div><p className="kicker">Ownership check</p><h1>Does this wallet qualify?</h1><p>Choose real Mainnet verification or run the complete flow for free on Base Sepolia.</p></div><div className="mode-switch" role="group" aria-label="Network mode"><button className={mode === "live" ? "selected" : ""} onClick={() => changeMode("live")}><span className="live-dot" /> Live</button><button className={mode === "demo" ? "selected" : ""} onClick={() => changeMode("demo")}><Flask size={15} /> Demo</button></div></div>

        <AnimatePresence mode="wait" initial={false}><motion.div className="mode-panel-wrap" key={mode} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: .995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: .995 }} transition={{ type: "spring", bounce: 0, duration: .35 }}>{mode === "live" ? <div className="live-panel">
          <div className="mode-explainer"><ShieldCheck size={22} /><div><strong>Base Mainnet, read only</strong><p>This checks official Coinbase-issued B20 addresses. It cannot claim a benefit or move assets.</p></div><a href="https://www.base.org/stocks" target="_blank" rel="noreferrer">Official list <ArrowSquareOut size={14} /></a></div>
          <div className="benefit-title"><span>Benefit preview</span><h2>Founding holder access</h2><p>Private product briefings and priority registration for verified holders.</p></div>
          <div className="form-grid"><label><span>Official stock</span><select value={selected.address} onChange={(event) => setSelected(STOCKS.find((stock) => stock.address === event.target.value) || STOCKS[0])}>{STOCKS.map((stock) => <option value={stock.address} key={stock.address}>{stock.ticker} · {stock.company}</option>)}</select><small><CheckCircle size={14} weight="fill" /> Address verified against Base’s official registry</small></label><label><span>Minimum holding</span><div className="amount-input"><input inputMode="decimal" value={required} onChange={(event) => setRequired(event.target.value.replace(/[^0-9.]/g, ""))} /><b>{selected.ticker}</b></div><small>B20 scaled balance, not the raw token count</small></label></div>
          <label className="wallet-input"><span>Wallet to check</span><input placeholder={address || "Paste a 0x wallet address"} value={manualAddress} onChange={(event) => { setManualAddress(event.target.value.trim()); setStage("idle"); }} /><small>{address ? "Leave empty to use the connected wallet." : "You can check any public wallet without connecting it."}</small></label>
          <motion.button whileTap={reduceMotion ? undefined : { scale: .97 }} className="check-button" disabled={!validTarget || checking} onClick={checkOwnership}>{checking || stage === "checking" ? <SpinnerGap className="spin" size={18} /> : <ShieldCheck size={18} />} {checking || stage === "checking" ? "Checking the wallet" : "Check ownership"}</motion.button>
          {(checking || stage === "checking") && <CheckActivity />}
          {stage === "result" && !checking && <ResultCard error={readError} qualifies={qualifies} balance={displayBalance} required={requiredNumber} ticker={selected.ticker} address={target} />}
        </div> : <div className="demo-layout">
          <div className="demo-banner"><Flask size={22} /><div><strong>Free testnet demonstration</strong><p>Demo tokens have no value and are not Coinbase Tokenized Stocks. The claim logic mirrors the real ownership check.</p></div></div>
          {!demoConfigured && <div className="setup-warning"><WarningCircle size={20} /><div><strong>Testnet contracts are being connected</strong><p>The interface is ready, but claim actions stay disabled until the verified Sepolia addresses are published.</p></div></div>}
          <div className="demo-benefit"><div><span className="demo-art">EK</span><p>Demo benefit</p><h2>Base Builder Session</h2><p className="demo-copy">Priority access for wallets holding at least 0.25 demo AAPLc.</p></div><div className="rule-table"><div><span>Network</span><strong>Base Sepolia</strong></div><div><span>Rule</span><strong>SINGLE</strong></div><div><span>Required</span><strong>0.25 demo AAPLc</strong></div><div><span>Claims</span><strong>One per wallet</strong></div></div></div>
          <div className="demo-actions"><article className={displayBalance && displayBalance >= .25 ? "complete" : ""}><span>1</span><div><h3>Get a free test share</h3><p>Receive 1 demo AAPLc. It is only for testing and has no financial value.</p></div><button disabled={!isConnected || !demoConfigured || transactionBusy} onClick={mintDemo}>{displayBalance && displayBalance >= .25 ? <><Check size={15} /> Received</> : "Get test share"}</button></article><article className={qualifies ? "complete" : ""}><span>2</span><div><h3>Check the ownership rule</h3><p>The contract checks whether your test balance is at least 0.25.</p></div><strong className="status-text">{qualifies ? "Rule passed" : "Waiting"}</strong></article><article className={pendingAction === "claim" && receipt.isSuccess ? "complete" : ""}><span>3</span><div><h3>Save the claim receipt</h3><p>The contract checks once more, then records proof that you qualified.</p></div><button disabled={!qualifies || !demoConfigured || transactionBusy} onClick={claimBenefit}>{transactionBusy && pendingAction === "claim" ? "Recording" : pendingAction === "claim" && receipt.isSuccess ? "Claimed" : "Claim benefit"}</button></article></div>
          {transactionBusy && <TransactionActivity action={pendingAction} waitingForWallet={writePending} />}
          {!isConnected && <p className="inline-direction"><Info size={17} /> Connect a wallet to start the free Sepolia demo.</p>}
          {writeError && <p className="inline-error"><WarningCircle size={17} /> {writeError.message || "The transaction was not completed."}</p>}
          {receipt.isSuccess && pendingAction === "claim" && txHash && <div className="receipt-card"><div><CheckCircle size={28} weight="fill" /><span>Claim recorded</span></div><h3>Proof that the rule passed.</h3><p>Receipt {shorten(txHash, 8)}</p><div><button onClick={copyReceipt}><Copy size={16} /> {copied ? "Copied" : "Copy transaction"}</button><a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View on BaseScan <ArrowSquareOut size={15} /></a></div></div>}
        </div>}</motion.div></AnimatePresence>
      </section>
    </div>
  </motion.main>;
}

function ResultCard({ error, qualifies, balance, required, ticker, address }: { error: Error | null; qualifies: boolean; balance: number | null; required: number; ticker: string; address: string }) {
  if (error || balance === null) return <motion.div className="result-card error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><WarningCircle size={24} /><div><strong>We could not verify this wallet</strong><p>The Base balance check failed, so EquityKey did not create an eligibility result.</p></div></motion.div>;
  return <motion.div className={`result-card ${qualifies ? "success" : "not-eligible"}`} initial={{ opacity: 0, y: 14, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", bounce: 0, duration: .4 }}><div className="result-status">{qualifies ? <CheckCircle size={26} weight="fill" /> : <Info size={26} />}<div><strong>{qualifies ? "This wallet qualifies" : "This wallet does not qualify yet"}</strong><p>{shorten(address, 7)}</p></div></div><div className="balance-comparison"><div><span>Stock balance found</span><strong>{balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {ticker}</strong></div><div><span>Amount needed</span><strong>{required} {ticker}</strong></div></div><p className="result-reason">{qualifies ? "The wallet owns enough to pass this rule. Nothing moved out of the wallet." : `The wallet needs ${Math.max(0, required - balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} more ${ticker} to pass this rule.`}</p></motion.div>;
}

function CheckActivity() {
  return <motion.div className="activity-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite"><span className="activity-orbit"><i /><i /><i /></span><div><strong>Reading Base Mainnet</strong><p>Finding the official stock balance, then applying your selected rule.</p></div></motion.div>;
}

function TransactionActivity({ action, waitingForWallet }: { action: "mint" | "claim" | null; waitingForWallet: boolean }) {
  const label = action === "claim" ? "Saving your claim receipt" : "Getting your free test share";
  return <motion.div className="activity-card transaction" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite"><SpinnerGap className="spin" size={20} /><div><strong>{waitingForWallet ? "Confirm in your wallet" : label}</strong><p>{waitingForWallet ? "Your wallet will show exactly what you are approving." : "Base Sepolia is confirming the test transaction."}</p></div></motion.div>;
}
