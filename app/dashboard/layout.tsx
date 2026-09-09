import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator dashboard",
  description: "Create, share and manage EquityKey benefits.",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
