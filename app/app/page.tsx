"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    if (!receipt.isSuccess || !txHash || refreshedHash.current === txHash) return;
    refreshedHash.current = txHash;
    void Promise.all([demoBalance.refetch(), eligibility.refetch()]);
  }, [receipt.isSuccess, txHash, demoBalance, eligibility]);

  const displayBalance = useMemo(() => {
    const data = mode === "live" ? liveBalance.data : demoBalance.data;
    return data === undefined ? null : Number(formatUnits(data, 18));
  }, [mode, liveBalance.data, demoBalance.data]);
  const requiredNumber = Math.max(0, Number(required) || 0);
  const qualifies = mode === "demo" ? Boolean(eligibility.data) : displayBalance !== null && displayBalance >= requiredNumber;
  const checking = mode === "live" && liveBalance.isFetching;
  const readError = mode === "live" ? liveBalance.error : demoBalance.error || eligibility.error;

  function changeMode(next: Mode) { setMode(next); setStage("idle"); setManualAddress(""); setCopied(false); }
  function checkOwnership() { if (!validTarget) return; setStage("checking"); window.setTimeout(() => setStage("result"), 650); }
  function ensureSepolia(action: () => void) { if (chainId !== baseSepolia.id) { switchChain({ chainId: baseSepolia.id }); return; } action(); }
  function mintDemo() { if (!DEMO_TOKEN_ADDRESS) return; ensureSepolia(() => { setPendingAction("mint"); writeContract({ address: demoTokenAddress, abi: demoTokenAbi, functionName: "claimDemoTokens", chainId: baseSepolia.id }); }); }
  function claimBenefit() { if (!EQUITYKEY_ADDRESS) return; ensureSepolia(() => { setPendingAction("claim"); writeContract({ address: equityKeyAddress, abi: equityKeyAbi, functionName: "claim", args: [1n], chainId: baseSepolia.id }); }); }
  function copyReceipt() { if (!txHash) return; navigator.clipboard.writeText(txHash); setCopied(true); }

  const demoConfigured = Boolean(DEMO_TOKEN_ADDRESS && EQUITYKEY_ADDRESS);

  return <main className="workspace-shell">
    <header className="workspace-header"><Logo /><div className="workspace-header-right"><span className="network-chip"><span />{mode === "live" ? "Base Mainnet" : "Base Sepolia"}</span><WalletButton /></div></header>
    <div className="workspace-body">
      <aside className="workspace-aside"><Link href="/" className="back-link"><ArrowLeft size={16} /> Home</Link><div className="aside-title"><p>Benefit workspace</p><span>Verify a wallet against a real ownership rule.</span></div><ol><li className="active"><span>1</span>Choose mode</li><li className={stage !== "idle" ? "active" : ""}><span>2</span>Check ownership</li><li className={stage === "result" && qualifies ? "active" : ""}><span>3</span>Claim benefit</li></ol><div className="custody-note"><LockKey size={20} /><strong>Your assets stay yours.</strong><p>EquityKey reads balances and records claims. It never asks for token approval or custody.</p></div></aside>
      <section className="workspace-main">
        <div className="workspace-intro"><div><p className="kicker">Ownership check</p><h1>Does this wallet qualify?</h1><p>Choose real Mainnet verification or run the complete flow for free on Base Sepolia.</p></div><div className="mode-switch" role="group" aria-label="Network mode"><button className={mode === "live" ? "selected" : ""} onClick={() => changeMode("live")}><span className="live-dot" /> Live</button><button className={mode === "demo" ? "selected" : ""} onClick={() => changeMode("demo")}><Flask size={15} /> Demo</button></div></div>

        {mode === "live" ? <div className="live-panel">
          <div className="mode-explainer"><ShieldCheck size={22} /><div><strong>Base Mainnet, read only</strong><p>This checks official Coinbase-issued B20 addresses. It cannot claim a benefit or move assets.</p></div><a href="https://www.base.org/stocks" target="_blank" rel="noreferrer">Official list <ArrowSquareOut size={14} /></a></div>
          <div className="benefit-title"><span>Benefit preview</span><h2>Founding holder access</h2><p>Private product briefings and priority registration for verified holders.</p></div>
          <div className="form-grid"><label><span>Official stock</span><select value={selected.address} onChange={(event) => setSelected(STOCKS.find((stock) => stock.address === event.target.value) || STOCKS[0])}>{STOCKS.map((stock) => <option value={stock.address} key={stock.address}>{stock.ticker} · {stock.company}</option>)}</select><small><CheckCircle size={14} weight="fill" /> Address verified against Base’s official registry</small></label><label><span>Minimum holding</span><div className="amount-input"><input inputMode="decimal" value={required} onChange={(event) => setRequired(event.target.value.replace(/[^0-9.]/g, ""))} /><b>{selected.ticker}</b></div><small>B20 scaled balance, not the raw token count</small></label></div>
          <label className="wallet-input"><span>Wallet to check</span><input placeholder={address || "Paste a 0x wallet address"} value={manualAddress} onChange={(event) => { setManualAddress(event.target.value.trim()); setStage("idle"); }} /><small>{address ? "Leave empty to use the connected wallet." : "You can check any public wallet without connecting it."}</small></label>
          <button className="check-button" disabled={!validTarget || checking} onClick={checkOwnership}>{checking || stage === "checking" ? <SpinnerGap className="spin" size={18} /> : <ShieldCheck size={18} />} {checking || stage === "checking" ? "Reading Base" : "Check ownership"}</button>
          {stage === "result" && !checking && <ResultCard error={readError} qualifies={qualifies} balance={displayBalance} required={requiredNumber} ticker={selected.ticker} address={target} />}
        </div> : <div className="demo-layout">
          <div className="demo-banner"><Flask size={22} /><div><strong>Free testnet demonstration</strong><p>Demo tokens have no value and are not Coinbase Tokenized Stocks. The claim logic mirrors the real ownership check.</p></div></div>
          {!demoConfigured && <div className="setup-warning"><WarningCircle size={20} /><div><strong>Testnet contracts are being connected</strong><p>The interface is ready, but claim actions stay disabled until the verified Sepolia addresses are published.</p></div></div>}
          <div className="demo-benefit"><div><span className="demo-art">EK</span><p>Demo benefit</p><h2>Base Builder Session</h2><p className="demo-copy">Priority access for wallets holding at least 0.25 demo AAPLc.</p></div><div className="rule-table"><div><span>Network</span><strong>Base Sepolia</strong></div><div><span>Rule</span><strong>SINGLE</strong></div><div><span>Required</span><strong>0.25 demo AAPLc</strong></div><div><span>Claims</span><strong>One per wallet</strong></div></div></div>
          <div className="demo-actions"><article className={displayBalance && displayBalance >= .25 ? "complete" : ""}><span>1</span><div><h3>Get free demo shares</h3><p>Mint 1 demo AAPLc to your wallet. It has no financial value.</p></div><button disabled={!isConnected || !demoConfigured || writePending} onClick={mintDemo}>{displayBalance && displayBalance >= .25 ? <><Check size={15} /> Received</> : "Get demo shares"}</button></article><article className={qualifies ? "complete" : ""}><span>2</span><div><h3>Pass the ownership rule</h3><p>The contract reads scaledBalanceOf and compares it with the stored rule.</p></div><strong className="status-text">{qualifies ? "Eligible" : "Waiting"}</strong></article><article className={receipt.isSuccess ? "complete" : ""}><span>3</span><div><h3>Record the claim</h3><p>Eligibility is checked again inside the transaction before a receipt is emitted.</p></div><button disabled={!qualifies || !demoConfigured || writePending} onClick={claimBenefit}>{writePending ? "Confirming" : receipt.isSuccess ? "Claimed" : "Claim benefit"}</button></article></div>
          {!isConnected && <p className="inline-direction"><Info size={17} /> Connect a wallet to start the free Sepolia demo.</p>}
          {writeError && <p className="inline-error"><WarningCircle size={17} /> {writeError.message || "The transaction was not completed."}</p>}
          {receipt.isSuccess && pendingAction === "claim" && txHash && <div className="receipt-card"><div><CheckCircle size={28} weight="fill" /><span>Claim recorded</span></div><h3>Proof that the rule passed.</h3><p>Receipt {shorten(txHash, 8)}</p><div><button onClick={copyReceipt}><Copy size={16} /> {copied ? "Copied" : "Copy transaction"}</button><a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View on BaseScan <ArrowSquareOut size={15} /></a></div></div>}
        </div>}
      </section>
    </div>
  </main>;
}

function ResultCard({ error, qualifies, balance, required, ticker, address }: { error: Error | null; qualifies: boolean; balance: number | null; required: number; ticker: string; address: string }) {
  if (error || balance === null) return <div className="result-card error"><WarningCircle size={24} /><div><strong>Ownership could not be verified</strong><p>The Base read failed or this wallet does not return a B20 scaled balance. No eligibility result was created.</p></div></div>;
  return <div className={`result-card ${qualifies ? "success" : "not-eligible"}`}><div className="result-status">{qualifies ? <CheckCircle size={26} weight="fill" /> : <Info size={26} />}<div><strong>{qualifies ? "This wallet qualifies" : "This wallet does not qualify yet"}</strong><p>{shorten(address, 7)}</p></div></div><div className="balance-comparison"><div><span>Verified scaled balance</span><strong>{balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {ticker}</strong></div><div><span>Benefit requires</span><strong>{required} {ticker}</strong></div></div><p className="result-reason">{qualifies ? "The verified B20 scaled balance meets the stored minimum. The asset stayed in the wallet." : `The wallet is missing ${Math.max(0, required - balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${ticker}. No claim can be created.`}</p></div>;
}
