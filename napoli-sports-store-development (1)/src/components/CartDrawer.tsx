"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X, Banknote, CreditCard } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";

type Quote = {
  cost: number;
  zone: string;
  label: string;
  free: boolean;
  codEnabled: boolean;
  codFee: number;
  freeThreshold: number;
};

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, updateQty, removeItem, subtotal, settings } = useStore();
  const [country, setCountry] = useState("Colombia");
  const [city, setCity] = useState("Bogotá");
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, city, subtotal }),
        });
        setQuote(await res.json());
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [cartOpen, country, city, subtotal]);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  if (!cartOpen) return null;

  const shipping = quote?.cost ?? 0;
  const codFee = quote?.codEnabled ? quote.codFee : 0;
  const missing = quote ? Math.max(0, quote.freeThreshold - subtotal) : 0;
  const progress = quote ? Math.min(100, (subtotal / quote.freeThreshold) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-neutral-950/50 anim-fade-in" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl anim-slide-right" aria-label="Carrito de compras">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-wide">
            <ShoppingBag className="h-5 w-5" /> Tu carrito
            <span className="text-base font-semibold text-neutral-400">({items.reduce((a, i) => a + i.qty, 0)})</span>
          </h2>
          <button aria-label="Cerrar carrito" onClick={() => setCartOpen(false)} className="p-1 hover:bg-neutral-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="h-14 w-14 text-neutral-300" />
            <p className="font-display text-2xl font-bold uppercase">Tu carrito está vacío</p>
            <p className="text-sm text-neutral-500">Descubre lo último en ropa y equipamiento deportivo.</p>
            <Link href="/categoria/tendencias" onClick={() => setCartOpen(false)} className="btn-dark px-8 py-3 text-sm">
              Ver tendencias
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {quote && country === "Colombia" && (
                <div className="mt-4 border border-neutral-200 bg-neutral-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                    <Truck className="h-4 w-4" />
                    {missing > 0 ? (
                      <>Te faltan <span className="text-red-600">{formatCOP(missing)}</span> para envío GRATIS</>
                    ) : (
                      <span className="text-green-700">¡Tienes envío GRATIS! 🎉</span>
                    )}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-neutral-200">
                    <div className="h-full bg-neutral-950 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-4 border-b border-neutral-100 py-4">
                  <Link href={`/producto/${item.slug}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-24 w-20 object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{item.name}</p>
                      <button
                        aria-label="Eliminar producto"
                        onClick={() => removeItem(item.productId, item.size)}
                        className="text-neutral-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">Talla: <strong>{item.size}</strong></p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-neutral-300">
                        <button
                          aria-label="Restar cantidad"
                          onClick={() => updateQty(item.productId, item.size, item.qty - 1)}
                          className="px-2 py-1 hover:bg-neutral-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          aria-label="Sumar cantidad"
                          onClick={() => updateQty(item.productId, item.size, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="px-2 py-1 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">{formatCOP(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Estimación de envío */}
              <div className="py-4">
                <p className="mb-2 flex items-center gap-1.5 font-display text-base font-bold uppercase tracking-wider">
                  <Truck className="h-4 w-4" /> Estimar envío
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="field" aria-label="País">
                    <option>Colombia</option>
                    <option>Internacional</option>
                  </select>
                  {country === "Colombia" ? (
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="field" aria-label="Ciudad">
                      {(settings?.shipping.localCities || ["Bogotá"]).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                      <option>Otra ciudad</option>
                    </select>
                  ) : (
                    <div className="field flex items-center text-neutral-500">Envío mundial 🌎</div>
                  )}
                </div>
                {quote && <p className="mt-2 text-xs text-neutral-500">{quote.label}</p>}
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 text-sm">
              <div className="flex justify-between py-0.5">
                <span>Subtotal productos</span>
                <span className="font-semibold">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Envío estimado</span>
                <span className="font-semibold">{shipping === 0 ? "GRATIS" : formatCOP(shipping)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2">
                <span className="flex items-center gap-1.5 font-semibold"><CreditCard className="h-4 w-4" /> Total pago en línea</span>
                <span className="font-display text-xl font-bold">{formatCOP(subtotal + shipping)}</span>
              </div>
              {quote?.codEnabled && (
                <div className="mt-1 flex items-center justify-between text-neutral-600">
                  <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4" /> Total contra entrega <span className="text-xs">(+{formatCOP(codFee)})</span></span>
                  <span className="font-bold">{formatCOP(subtotal + shipping + codFee)}</span>
                </div>
              )}
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="btn-dark mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
              >
                Finalizar compra →
              </Link>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-2 w-full py-1.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500 underline underline-offset-4 hover:text-neutral-950"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}