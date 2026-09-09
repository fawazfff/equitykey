import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://equitykey.vercel.app";
  return [
    { url: site, priority: 1 },
    { url: `${site}/create`, priority: .9 },
    { url: `${site}/dashboard`, priority: .8 },
    { url: `${site}/app`, priority: .8 },
    { url: `${site}/benefit/base-builder-session`, priority: .9 },
  ];
}
