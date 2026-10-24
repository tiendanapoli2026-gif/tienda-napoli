"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard, { type CardProduct } from "@/components/ProductCard";

export default function FavoritesPage() {
  const { favorites } = useStore();
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?ids=${favorites.join(",")}`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [favorites]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="flex items-center gap-3 font-display text-5xl font-bold uppercase">
        <Heart className="h-9 w-9 fill-red-600 text-red-600" /> Mis favoritos
      </h1>
      <p className="mt-2 text-sm text-neutral-500">{favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}</p>

      {loading ? (
        <p className="py-24 text-center font-display text-2xl font-bold uppercase text-neutral-400">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Heart className="h-16 w-16 text-neutral-200" />
          <p className="font-display text-3xl font-bold uppercase">Aún no tienes favoritos</p>
          <p className="max-w-sm text-sm text-neutral-500">Toca el corazón ♥ en cualquier producto para guardarlo aquí.</p>
          <Link href="/categoria/tendencias" className="btn-dark px-8 py-3 text-sm">Descubrir productos</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}