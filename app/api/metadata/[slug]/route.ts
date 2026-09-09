import { getPublicSupabaseClient } from "@/lib/supabase/public";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = getPublicSupabaseClient();
  if (!client) return Response.json({ error: "Live metadata is unavailable." }, { status: 503 });
  const { data } = await client.from("equitykey_benefits").select("slug,title,description,access_type,network,onchain_benefit_id,rule_type,one_time,status,equitykey_benefit_rules(token_address,token_symbol,minimum_scaled,minimum_display)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return Response.json({ error: "Benefit not found." }, { status: 404 });
  return Response.json({ name: data.title, description: data.description, external_url: `https://equitykey.vercel.app/benefit/${data.slug}`, attributes: data }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
