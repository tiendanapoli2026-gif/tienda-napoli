import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, ilike, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { SlidersHorizontal, SearchX } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { CATEGORIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
};

const TITLES: Record<string, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  ninos: "Niños",
  tendencias: "Tendencias",
  deportes: "Deportes",
  ofertas: "Ofertas y descuentos",
  todos: "Todo el catálogo",
};

const SORTS = [
  { key: "nuevo", label: "Novedades" },
  { key: "precio-asc", label: "Precio: menor a mayor" },
  { key: "precio-desc", label: "Precio: mayor a menor" },
  { key: "descuento", label: "Mayor descuento" },
];

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: TITLES[slug] || "Catálogo" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q, sort = "nuevo" } = await searchParams;
  if (!TITLES[slug]) notFound();

  const conditions: SQL[] = [eq(products.active, true)];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`), ilike(products.sport, `%${q}%`))!);
  if (slug === "ofertas") conditions.push(isNotNull(products.salePrice));
  else if (slug === "tendencias") conditions.push(eq(products.trending, true));
  else if (slug !== "todos") conditions.push(eq(products.category, slug));

  const orderBy =
    sort === "precio-asc"
      ? asc(sql`coalesce(${products.salePrice}, ${products.price})`)
      : sort === "precio-desc"
        ? desc(sql`coalesce(${products.salePrice}, ${products.price})`)
        : sort === "descuento"
          ? desc(sql`case when ${products.salePrice} is not null then 1 - ${products.salePrice}::float / ${products.price} else 0 end`)
          : desc(products.createdAt);

  const rows = await db.select().from(products).where(and(...conditions)).orderBy(orderBy).limit(60);

  const linkFor = (key: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (key !== "nuevo") sp.set("sort", key);
    const qs = sp.toString();
    return `/categoria/${slug}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Migas de pan */}
      <nav className="text-xs text-neutral-500" aria-label="Miga de pan">
        <Link href="/" className="hover:text-neutral-950">Inicio</Link> / <span className="font-semibold text-neutral-950">{TITLES[slug]}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className={`font-display text-5xl font-bold uppercase sm:text-6xl ${slug === "ofertas" ? "text-red-600" : ""}`}>
          {q ? `Resultados: “${q}”` : TITLES[slug]}
        </h1>
        <p className="text-sm text-neutral-500">{rows.length} producto{rows.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Chips de categorías */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {[{ slug: "todos", label: "Todos" }, ...CATEGORIES].map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className={`whitespace-nowrap border px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wider transition-colors ${
              c.slug === slug ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 hover:border-neutral-950"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {/* Ordenamiento */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-neutral-200 py-3">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-500">
          <SlidersHorizontal className="h-4 w-4" /> Ordenar:
        </span>
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={linkFor(s.key)}
            className={`px-3 py-1 text-xs font-semibold transition-colors ${
              sort === s.key ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <SearchX className="h-14 w-14 text-neutral-300" />
          <p className="font-display text-3xl font-bold uppercase">Sin resultados</p>
          <p className="max-w-sm text-sm text-neutral-500">No encontramos productos con esos filtros. Explora otras categorías.</p>
          <Link href="/categoria/todos" className="btn-dark px-8 py-3 text-sm">Ver todo el catálogo</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}