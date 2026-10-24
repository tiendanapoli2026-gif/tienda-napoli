"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiteSettings } from "@/lib/settings";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  size: string;
  price: number;
  qty: number;
  stock: number;
};

type Toast = { id: number; message: string };

type StoreCtx = {
  items: CartItem[];
  favorites: number[];
  settings: SiteSettings | null;
  setSettings: (s: SiteSettings) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQty: (productId: number, size: string, qty: number) => void;
  removeItem: (productId: number, size: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: number) => void;
  cartCount: number;
  subtotal: number;
  toasts: Toast[];
  toast: (message: string) => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawItems = localStorage.getItem("napoli_cart");
      const rawFavs = localStorage.getItem("napoli_favs");
      if (rawItems) setItems(JSON.parse(rawItems));
      if (rawFavs) setFavorites(JSON.parse(rawFavs));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("napoli_cart", JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("napoli_favs", JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId && i.size === item.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + item.qty, item.stock) };
        return next;
      }
      return [...prev, { ...item, qty: Math.min(item.qty, item.stock) }];
    });
  }, []);

  const updateQty = useCallback((productId: number, size: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, qty: Math.max(0, Math.min(qty, i.stock)) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }, []);

  const removeItem = useCallback((productId: number, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const { cartCount, subtotal } = useMemo(() => {
    return {
      cartCount: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.price, 0),
    };
  }, [items]);

  const value: StoreCtx = {
    items,
    favorites,
    settings,
    setSettings,
    cartOpen,
    setCartOpen,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    toggleFavorite,
    cartCount,
    subtotal,
    toasts,
    toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}