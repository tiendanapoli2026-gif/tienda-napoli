import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: { title: p.name, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  if (!product || !product.active) notFound();

  const related = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.category, product.category), ne(products.id, product.id)))
    .limit(4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <h2 className="font-display text-4xl font-bold uppercase">También te puede gustar</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}