"use client";
import { SignOut, Wallet } from "@phosphor-icons/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shorten } from "@/lib/stocks";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  if (isConnected && address) return <button className="wallet-button connected" onClick={() => disconnect()} type="button"><span className="live-dot" /> {shorten(address, 4)} <SignOut size={16} /></button>;
  return <button className="wallet-button" onClick={() => connectors[0] && connect({ connector: connectors[0] })} disabled={isPending || !connectors[0]} type="button"><Wallet size={17} /> {isPending ? "Opening wallet" : "Connect wallet"}</button>;
}
