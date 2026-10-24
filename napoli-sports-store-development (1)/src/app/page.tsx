import Link from "next/link";
import { desc, eq, isNotNull, and } from "drizzle-orm";
import { ArrowRight, BadgePercent, Flame, MapPin, Clock, Phone } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

const TILES = [
  {
    slug: "mujer",
    label: "Mujer",
    image: "https://images.pexels.com/photos/15793512/pexels-photo-15793512.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    slug: "hombre",
    label: "Hombre",
    image: "https://images.pexels.com/photos/17448036/pexels-photo-17448036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    slug: "ninos",
    label: "Niños",
    image: "https://images.pexels.com/photos/8941579/pexels-photo-8941579.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

export default async function HomePage() {
  const s = await getSettings();
  const [trending, onSale, fresh] = await Promise.all([
    db.select().from(products).where(and(eq(products.active, true), eq(products.trending, true))).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(products).where(and(eq(products.active, true), isNotNull(products.salePrice))).orderBy(desc(products.createdAt)).limit(4),
    db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt)).limit(4),
  ]);
  const banner = s.banners.find((b) => b.active);

  return (
    <div>
      {/* HERO — carrusel automático (10 s, pausa al hover, editable desde el panel) */}
      <HeroCarousel initialSlides={s.heroSlides} />

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Compra por categoría</h2>
            <Link href="/categoria/todos" className="hidden items-center gap-1 text-sm font-bold uppercase tracking-widest underline underline-offset-4 hover:text-neutral-500 sm:flex">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {TILES.map((t, i) => (
            <Reveal key={t.slug} delay={i * 100}>
              <Link href={`/categoria/${t.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt={`Categoría ${t.label}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6 text-white">
                  <span className="font-display text-4xl font-bold uppercase tracking-wide">{t.label}</span>
                  <span className="flex h-11 w-11 items-center justify-center border-2 border-white transition-all duration-300 group-hover:bg-white group-hover:text-neutral-950">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TENDENCIAS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-3 font-display text-4xl font-bold uppercase sm:text-5xl">
              <Flame className="h-8 w-8 text-red-600" /> Lo más vendido
            </h2>
            <Link href="/categoria/tendencias" className="flex items-center gap-1 text-sm font-bold uppercase tracking-widest underline underline-offset-4 hover:text-neutral-500">
              Ver más <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {trending.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* BANNER PROMO (configurable desde admin) */}
      {banner && (
        <section className="relative overflow-hidden bg-neutral-950 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
            <Reveal>
              <h2 className="display-tight max-w-xl font-display text-6xl font-bold uppercase sm:text-7xl">{banner.title}</h2>
              <p className="mt-4 max-w-md text-neutral-300">{banner.subtitle}</p>
              <Link href={banner.link} className="group mt-8 inline-flex items-center gap-3 bg-white px-8 py-4 font-display text-lg font-bold uppercase tracking-widest text-neutral-950 transition-colors hover:bg-neutral-200">
                {banner.cta} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* OFERTAS */}
      {onSale.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="flex items-center gap-3 font-display text-4xl font-bold uppercase text-red-600 sm:text-5xl">
                <BadgePercent className="h-8 w-8" /> Ofertas
              </h2>
              <Link href="/categoria/ofertas" className="flex items-center gap-1 text-sm font-bold uppercase tracking-widest underline underline-offset-4 hover:text-red-600">
                Todas las ofertas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {onSale.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CUPÓN NUEVOS USUARIOS */}
      {s.newUserCoupon.enabled && (
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center lg:px-8">
            <Reveal>
              <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-neutral-500">Club Napoli</p>
              <h2 className="mt-2 font-display text-4xl font-bold uppercase sm:text-5xl">
                Regístrate y recibe {s.newUserCoupon.percent}% OFF
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">
                Tu cupón de bienvenida se aplica automáticamente en tu primera compra. Usa el código{" "}
                <span className="border border-dashed border-neutral-950 bg-white px-2 py-0.5 font-bold">{s.newUserCoupon.code}</span>
              </p>
              <Link href="/cuenta" className="btn-dark mt-6 inline-block px-10 py-3.5 text-sm">
                Crear mi cuenta
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* UBICACIÓN FÍSICA — MAPA */}
      {s.storeLocation.enabled && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <Reveal>
            <h2 className="flex items-center gap-3 font-display text-4xl font-bold uppercase sm:text-5xl">
              <MapPin className="h-8 w-8 text-red-600" /> Visítanos
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              También puedes comprar en nuestra tienda física, recoger tu pedido o cambiar tu talla.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
            <Reveal>
              <div className="flex h-full flex-col justify-between gap-6 bg-neutral-950 p-8 text-white">
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-neutral-500">Tienda física</p>
                  <p className="mt-3 font-display text-3xl font-bold uppercase leading-tight">{s.storeLocation.address}</p>
                  <p className="mt-1 text-neutral-400">{s.storeLocation.city}</p>
                </div>
                <div className="space-y-4 text-sm">
                  <p className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
                    <span className="text-neutral-300">{s.storeLocation.hours}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-neutral-500" />
                    <a href={`tel:+${s.whatsapp.number.replace(/\D/g, "")}`} className="text-neutral-300 hover:text-white">
                      +{s.whatsapp.number.replace(/\D/g, "")}
                    </a>
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.storeLocation.mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 bg-white px-6 py-3 font-display text-base font-bold uppercase tracking-widest text-neutral-950 transition-colors hover:bg-neutral-200"
                  >
                    Cómo llegar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <iframe
                title="Mapa — ubicación de Tienda deportiva Napoli"
                src={`https://www.google.com/maps?q=${encodeURIComponent(s.storeLocation.mapQuery)}&output=embed`}
                className="h-[420px] w-full border border-neutral-200 grayscale-[35%] transition-all duration-500 hover:grayscale-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* RECIÉN LLEGADOS */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Reveal>
          <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Recién llegados</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {fresh.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}