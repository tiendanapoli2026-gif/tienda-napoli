"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { CATEGORIES, formatCOP, effectivePrice } from "@/lib/utils";
import type { CardProduct } from "@/components/ProductCard";
import Logo from "@/components/Logo";
import NotificationsBell from "@/components/NotificationsBell";

export default function Header() {
  const { cartCount, favorites, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=6`);
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const submitSearch = () => {
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/categoria/todos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>
        </div>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Categorías">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className={`group relative font-display text-lg font-semibold uppercase tracking-wider transition-colors ${
                c.slug === "ofertas" ? "text-red-600" : "hover:text-neutral-500"
              }`}
            >
              {c.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-current transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            aria-label="Buscar productos"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
          >
            <Search className="h-5 w-5" />
          </button>
          <NotificationsBell />
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="relative flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-red-600 text-[10px] font-bold text-white anim-pop">
                {favorites.length}
              </span>
            )}
          </Link>
          <Link
            href="/cuenta"
            aria-label="Mi cuenta"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            aria-label="Abrir carrito"
            onClick={() => setCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-neutral-950 text-[10px] font-bold text-white anim-pop"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Buscador en tiempo real */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white shadow-xl anim-slide-down">
          <div className="mx-auto max-w-3xl px-4 py-5">
            <div className="flex items-center gap-3 border-b-2 border-neutral-950 pb-2">
              <Search className="h-5 w-5 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Busca camisetas, tenis, balones…"
                className="w-full bg-transparent text-lg font-medium placeholder:text-neutral-400"
              />
              <button aria-label="Cerrar buscador" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 max-h-[50vh] overflow-y-auto">
              {searching && <p className="py-4 text-sm text-neutral-500">Buscando…</p>}
              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <p className="py-4 text-sm text-neutral-500">Sin resultados para “{query}”. Prueba con otra palabra.</p>
              )}
              {results.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-4 border-b border-neutral-100 py-2.5 transition-colors hover:bg-neutral-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt="" className="h-14 w-14 object-cover" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-neutral-500 capitalize">{p.category} · {p.sport}</span>
                  </span>
                  <span className="text-sm font-bold">{formatCOP(effectivePrice(p))}</span>
                </Link>
              ))}
              {query.trim().length >= 2 && results.length > 0 && (
                <button
                  onClick={submitSearch}
                  className="mt-3 w-full py-2 text-center font-display text-sm font-bold uppercase tracking-[0.2em] underline underline-offset-4 hover:text-neutral-500"
                >
                  Ver todos los resultados
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menú móvil */}
      {menuOpen && (
        <nav className="border-t border-neutral-200 bg-white lg:hidden anim-slide-down" aria-label="Menú móvil">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 font-display text-xl font-semibold uppercase tracking-wider ${
                c.slug === "ofertas" ? "text-red-600" : ""
              }`}
            >
              {c.label} <span aria-hidden>→</span>
            </Link>
          ))}
          <Link href="/cuenta" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold">
            <User className="h-4 w-4" /> Mi cuenta
          </Link>
        </nav>
      )}
    </header>
  );
}