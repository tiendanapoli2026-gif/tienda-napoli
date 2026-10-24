"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCOP, discountPercent, effectivePrice } from "@/lib/utils";
import type { SizeStock } from "@/db/schema";

export type CardProduct = {
  id: number;
  slug: string;
  name: string;
  category: string;
  sport: string;
  price: number;
  salePrice: number | null;
  images: string[];
  sizes: SizeStock[];
  trending?: boolean;
};

const CAT_LABEL: Record<string, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  ninos: "Niños",
  deportes: "Deportes",
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const { favorites, toggleFavorite, toast } = useStore();
  const isFav = favorites.includes(product.id);
  const off = discountPercent(product);
  const price = effectivePrice(product);
  const totalStock = product.sizes.reduce((a, s) => a + s.stock, 0);
  const soldOut = totalStock === 0;

  return (
    <div className="group relative">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0] || "/images/hero.jpg"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {product.images[1] && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.images[1]}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-0 top-3 flex flex-col gap-1.5">
            {off > 0 && (
              <span className="bg-red-600 px-2 py-0.5 font-display text-sm font-bold tracking-wider text-white">
                -{off}%
              </span>
            )}
            {product.trending && (
              <span className="bg-neutral-950 px-2 py-0.5 font-display text-sm font-semibold tracking-wider text-white">
                TENDENCIA
              </span>
            )}
          </div>
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="border border-neutral-950 bg-white px-4 py-1.5 font-display text-lg font-bold tracking-widest">
                AGOTADO
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-neutral-950/90 px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-white transition-transform duration-300 group-hover:translate-y-0">
            Ver producto →
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold ${off ? "text-red-600" : ""}`}>{formatCOP(price)}</span>
            {off > 0 && <span className="text-xs text-neutral-400 line-through">{formatCOP(product.price)}</span>}
          </div>
          <h3 className="text-sm font-semibold leading-snug">{product.name}</h3>
          <p className="text-xs text-neutral-500">
            {CAT_LABEL[product.category] || product.category} · {product.sport}
          </p>
        </div>
      </Link>
      <button
        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        onClick={() => {
          toggleFavorite(product.id);
          toast(isFav ? "Eliminado de favoritos" : "Guardado en favoritos ♥");
        }}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90 shadow-sm transition-transform hover:scale-110 active:scale-95"
      >
        <Heart className={`h-4.5 w-4.5 transition-colors ${isFav ? "fill-red-600 text-red-600" : "text-neutral-800"}`} />
      </button>
    </div>
  );
}