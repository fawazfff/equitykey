import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BenefitExperience } from "@/components/benefit-experience";
import type { Benefit } from "@/lib/equitykey-types";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

async function getBenefit(slug: string) {
  const client = getPublicSupabaseClient();
  if (!client) return { benefit: null, unavailable: true };
  const { data, error } = await client.from("equitykey_benefits").select("*,equitykey_benefit_rules(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  return { benefit: data as Benefit | null, unavailable: Boolean(error) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { benefit } = await getBenefit(slug);
  if (!benefit) return { title: "Benefit not found" };
  return { title: benefit.title, description: benefit.description, alternates: { canonical: `/benefit/${slug}` } };
}

export default async function BenefitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { benefit, unavailable } = await getBenefit(slug);
  if (!benefit && !unavailable) notFound();
  if (!benefit) return <main className="service-unavailable"><h1>Live benefit data is unavailable.</h1><p>EquityKey could not reach its database, so it did not guess or show a fake benefit.</p></main>;
  return <BenefitExperience benefit={benefit} />;
}
