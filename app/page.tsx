import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Ticket, TrendUp, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";

const examples = [
  { icon: Ticket, title: "Early access", body: "Reserve launches, events or products for verified holders." },
  { icon: UsersThree, title: "Member spaces", body: "Open private communities without moving the assets that qualify." },
  { icon: TrendUp, title: "Better benefits", body: "Reward long-term ownership with discounts, upgrades or service credits." },
];

export default function Home() {
  return <main>
    <header className="site-header page-width"><Logo /><nav aria-label="Primary navigation"><a href="#how">How it works</a><a href="#uses">Use cases</a><Link href="/app" className="nav-cta">Open app <ArrowRight size={16} /></Link></nav></header>
    <section className="hero page-width">
      <div className="hero-copy"><p className="kicker">Built on Base</p><h1>Ownership,<br />made programmable.</h1><p className="hero-lede">Turn verified Coinbase Tokenized Stock ownership into useful access. No screenshots. No custody. No trading.</p><div className="hero-actions"><Link href="/app" className="primary-button">Check a benefit <ArrowRight size={18} /></Link><a href="#how" className="text-link">See how it works</a></div></div>
      <div className="proof-stage" aria-label="Example ownership proof">
        <div className="proof-note proof-note-top">Benefit rule <strong>Hold 0.25 AAPLc</strong></div>
        <div className="proof-card"><div className="proof-card-head"><span>Ownership proof</span><span className="verified"><Check size={14} weight="bold" /> Verified on Base</span></div><div className="proof-person"><span className="avatar">0x</span><div><strong>Wallet qualifies</strong><small>0x71C4…98F2</small></div></div><div className="proof-balance"><span>Verified balance</span><strong>0.42 <small>AAPLc</small></strong></div><div className="proof-rule"><span>Required</span><span>0.25 AAPLc</span></div><div className="proof-foot"><ShieldCheck size={18} /><span>Checked using the official contract address and B20 scaled balance.</span></div></div>
        <div className="proof-note proof-note-bottom">Claim receipt <strong>Recorded onchain</strong></div>
      </div>
    </section>
    <section className="statement"><div className="page-width statement-grid"><p>Stocks onchain can do more than sit in a wallet.</p><h2>EquityKey lets ownership unlock something useful while the owner keeps full control.</h2></div></section>
    <section className="process page-width" id="how"><div className="section-heading"><p>How it works</p><h2>Proof, not promises.</h2></div><div className="steps"><article><span>1</span><h3>Create a benefit</h3><p>Choose official stock contracts, set the amount required and decide whether the benefit can be claimed once or stays active.</p></article><article><span>2</span><h3>Verify ownership</h3><p>EquityKey reads the wallet’s B20 scaled balance on Base. The stock never leaves the owner’s wallet.</p></article><article><span>3</span><h3>Claim with proof</h3><p>The contract checks the rule again and records a receipt. A frontend screenshot cannot override the result.</p></article></div></section>
    <section className="uses page-width" id="uses"><div className="section-heading"><p>Where it fits</p><h2>One proof. Many reasons to care.</h2></div><div className="use-list">{examples.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={24} /><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="mode-section"><div className="page-width mode-grid"><div><p className="kicker">Two honest modes</p><h2>Real verification.<br />Free demonstration.</h2></div><div className="mode-lines"><article><span className="mode-label">Live</span><div><h3>Base Mainnet</h3><p>Read-only checks against official Coinbase Tokenized Stock addresses. No stock purchase is required to explore it.</p></div></article><article><span className="mode-label demo">Demo</span><div><h3>Base Sepolia</h3><p>Claim free test tokens, pass the same eligibility logic and create a testnet receipt without spending real money.</p></div></article></div></div></section>
    <section className="closing page-width"><p>Prove ownership. Keep custody. Unlock utility.</p><Link href="/app" className="primary-button inverted">Open EquityKey <ArrowRight size={18} /></Link></section>
    <footer className="site-footer page-width"><Logo /><p>Built for the Base Tokenized Stocks Builder Quest.</p><a href="https://www.base.org/stocks" target="_blank" rel="noreferrer">Official stock registry</a></footer>
  </main>;
}
