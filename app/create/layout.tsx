import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a benefit",
  description: "Create a shareable benefit for demo tokenized-stock holders on Base Sepolia.",
  alternates: { canonical: "/create" },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
