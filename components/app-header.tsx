"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Logo } from "@/components/logo";
import { WalletButton } from "@/components/wallet-button";

export function AppHeader() {
  return <header className="product-header">
    <Logo />
    <nav aria-label="Product navigation">
      <Link href="/app">Explore</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/create" className="header-create"><Plus size={15} weight="bold" /> Create benefit</Link>
    </nav>
    <WalletButton />
  </header>;
}
