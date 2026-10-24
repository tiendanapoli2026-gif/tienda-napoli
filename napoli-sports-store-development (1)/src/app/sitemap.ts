import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CATEGORIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let items: { slug: string; createdAt: Date }[] = [];
  try {
    items = await db
      .select({ slug: products.slug, createdAt: products.createdAt })
      .from(products)
      .where(eq(products.active, true));
  } catch {
    // Base de datos no disponible en build: sitemap solo con páginas estáticas
  }

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/categoria/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${BASE}/categoria/todos`, changeFrequency: "daily" as const, priority: 0.7 },
    ...items.map((p) => ({
      url: `${BASE}/producto/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}