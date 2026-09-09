import Link from "next/link";
import { ArrowRight, CheckCircle, Eye, ShieldCheck, Ticket, TrendUp, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { OwnershipProof, Reveal, ScrollProgress } from "@/components/site-motion";

const examples = [
  { icon: Ticket, title: "Early access", body: "Reserve launches, events or products for verified holders." },
  { icon: UsersThree, title: "Member spaces", body: "Open private communities without moving the assets that qualify." },
  { icon: TrendUp, title: "Better benefits", body: "Reward long-term ownership with discounts, upgrades or service credits." },
];

export default function Home() {
  return <main>
    <ScrollProgress />
    <header className="site-header page-width"><Logo /><nav aria-label="Primary navigation"><a href="#how">How it works</a><a href="#uses">Use cases</a><a href="#faq">FAQ</a><Link href="/app" className="nav-cta">Open app <ArrowRight size={16} /></Link></nav></header>
    <section className="hero page-width">
      <Reveal className="hero-copy"><p className="kicker">Benefits for the stocks already in your wallet</p><h1>Ownership,<br />made useful.</h1><p className="hero-lede">EquityKey checks whether a wallet owns enough of an eligible Coinbase Tokenized Stock. If it does, the owner can unlock a benefit without sending the stock anywhere.</p><div className="hero-actions"><Link href="/app" className="primary-button">Try the free demo <ArrowRight size={18} /></Link><a href="#how" className="text-link">See how it works</a></div><p className="hero-trust"><ShieldCheck size={16} /> No purchase, deposit or API key needed to try the demo.</p></Reveal>
      <OwnershipProof />
    </section>
    <section className="statement"><Reveal className="page-width statement-grid"><p>Think of it as a digital membership card.</p><h2>The stock proves membership. The owner keeps the stock. The benefit becomes the useful part.</h2></Reveal></section>
    <Reveal><section className="plain-explainer page-width"><div className="section-heading"><p>Why it matters</p><h2>No screenshots. No transfers. Just a wallet check.</h2></div><div className="comparison"><article><Eye size={23} /><span>The old way</span><h3>Ask people to prove it manually</h3><p>Screenshots can be old or edited. Moving an asset into another app adds risk.</p></article><article className="preferred"><CheckCircle size={23} weight="fill" /><span>With EquityKey</span><h3>Check the ownership rule on Base</h3><p>The contract reads the wallet, applies the rule and records a claim only when it passes.</p></article></div></section></Reveal>
    <Reveal><section className="process page-width" id="how"><div className="section-heading"><p>How it works</p><h2>Three steps. The stock never moves.</h2></div><div className="steps"><article><span>1</span><h3>A business creates a benefit</h3><p>For example: “Own at least 0.25 AAPLc to get early access.”</p></article><article><span>2</span><h3>EquityKey checks the wallet</h3><p>It reads the official stock contract on Base and compares the real balance with the rule.</p></article><article><span>3</span><h3>The owner claims</h3><p>If the rule passes, EquityKey records a public receipt. The stock stays untouched.</p></article></div></section></Reveal>
    <Reveal><section className="uses page-width" id="uses"><div className="section-heading"><p>What it can unlock</p><h2>Give ownership a practical purpose.</h2></div><div className="use-list">{examples.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={24} /><h3>{title}</h3><p>{body}</p></article>)}</div></section></Reveal>
    <section className="mode-section"><Reveal className="page-width mode-grid"><div><p className="kicker">Choose how to explore</p><h2>Check real data.<br />Test for free.</h2></div><div className="mode-lines"><article><span className="mode-label">Live</span><div><h3>Base Mainnet</h3><p>Paste any wallet address and check its real Coinbase Tokenized Stock balance. This mode is read only.</p></div></article><article><span className="mode-label demo">Demo</span><div><h3>Base Sepolia</h3><p>Connect a wallet, receive a free test share and claim a test benefit. Test assets have no real value.</p></div></article></div></Reveal></section>
    <Reveal><section className="faq page-width" id="faq"><div className="section-heading"><p>Simple answers</p><h2>Before you try it.</h2></div><div className="faq-list"><details><summary>What is a tokenized stock?</summary><p>It is a digital token designed to represent a stock on a blockchain. EquityKey only supports the official Coinbase Tokenized Stock contract addresses listed by Base.</p></details><details><summary>Does EquityKey take my stocks?</summary><p>No. It reads a public wallet balance. It never asks you to approve or transfer your stocks.</p></details><details><summary>Do I need real money for the demo?</summary><p>No. Demo Mode uses Base Sepolia test tokens. They have no financial value.</p></details><details><summary>Is EquityKey a trading app?</summary><p>No. It does not buy, sell or recommend stocks. It only checks ownership rules and records benefit claims.</p></details></div></section></Reveal>
    <section className="closing page-width"><p>Prove ownership. Keep custody. Unlock utility.</p><Link href="/app" className="primary-button inverted">Open EquityKey <ArrowRight size={18} /></Link></section>
    <footer className="site-footer page-width"><Logo /><p>Built for the Base Tokenized Stocks Builder Quest.</p><a href="https://www.base.org/stocks" target="_blank" rel="noreferrer">Official stock registry</a></footer>
  </main>;
}
