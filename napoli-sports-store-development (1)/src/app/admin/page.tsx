"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgePercent, BellRing, ExternalLink, Images, LayoutDashboard, LogOut, Megaphone,
  Package, Settings, ShoppingBasket, TrendingUp, AlertTriangle, Lock, Users,
} from "lucide-react";
import Logo from "@/components/Logo";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { formatCOP } from "@/lib/utils";
import type { orders, products } from "@/db/schema";

type Order = typeof orders.$inferSelect;
type Product = typeof products.$inferSelect;
type Tab = "resumen" | "productos" | "pedidos" | "clientes" | "notificaciones" | "portada" | "promociones" | "marquesina" | "ajustes";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "productos", label: "Productos", icon: Package },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBasket },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "notificaciones", label: "Notificar", icon: BellRing },
  { id: "portada", label: "Portada", icon: Images },
  { id: "promociones", label: "Promociones", icon: BadgePercent },
  { id: "marquesina", label: "Marquesina", icon: Megaphone },
  { id: "ajustes", label: "Ajustes", icon: Settings },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  const loadData = useCallback(async () => {
    const [o, p] = await Promise.all([fetch("/api/orders"), fetch("/api/products?all=1&limit=100")]);
    if (o.ok) setOrderList(await o.json());
    if (p.ok) setProductList(await p.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((me) => {
      const ok = me.authenticated && me.role === "admin";
      setAuthed(ok);
      if (ok) loadData();
    });
  }, [loadData]);

  useEffect(() => {
    if (authed && tab === "resumen") loadData();
  }, [tab, authed, loadData]);

  const login = async () => {
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error"); return; }
    const me = await (await fetch("/api/auth/me")).json();
    if (me.role !== "admin") { setError("Esta cuenta no tiene acceso al panel."); return; }
    setAuthed(true);
    loadData();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
  };

  if (authed === null) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 font-display text-2xl font-bold uppercase text-white">Cargando…</div>;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center text-white">
            <span className="mx-auto inline-flex justify-center">
              <Logo tone="dark" />
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold uppercase">Panel Napoli</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-neutral-500">Acceso administrativo</p>
          </div>
          <div className="mt-8 space-y-3 bg-white p-6">
            <label className="block text-xs font-bold uppercase tracking-wider">Usuario
              <input className="field mt-1" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Tu usuario administrador" autoFocus autoComplete="username" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider">Contraseña
              <input type="password" className="field mt-1" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
            </label>
            {error && <p className="bg-red-50 p-2.5 text-xs font-bold text-red-700">{error}</p>}
            <button onClick={login} className="btn-dark flex w-full items-center justify-center gap-2 py-3 text-sm">
              <Lock className="h-4 w-4" /> Ingresar
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
              <Lock className="h-3 w-3" /> Acceso privado · Conexión cifrada SSL
            </p>
          </div>
          <Link href="/" className="mt-5 block text-center text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white">← Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const revenue = orderList.filter((o) => o.status !== "cancelado").reduce((a, o) => a + o.total, 0);
  const pending = orderList.filter((o) => o.status === "pendiente").length;
  const lowStock = productList.filter((p) => p.sizes.reduce((a, s) => a + s.stock, 0) <= 5);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-neutral-950 px-4 py-3 text-white lg:px-8">
        <div className="flex items-center gap-3">
          <Logo tone="dark" compact />
          <span className="hidden font-display text-sm font-semibold uppercase tracking-widest text-neutral-500 sm:block">/ Backoffice</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white">
            <ExternalLink className="h-4 w-4" /> Ver tienda
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 border border-neutral-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:border-white">
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        {/* Sidebar */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:w-52 lg:flex-col" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 px-4 py-3 text-left font-display text-base font-bold uppercase tracking-wider transition-colors ${
                tab === t.id ? "bg-neutral-950 text-white" : "bg-white text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <t.icon className="h-4.5 w-4.5" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {tab === "resumen" && (
            <div>
              <h2 className="font-display text-3xl font-bold uppercase">Resumen de la tienda</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Ventas totales", value: formatCOP(revenue), icon: TrendingUp },
                  { label: "Pedidos", value: String(orderList.length), icon: ShoppingBasket },
                  { label: "Pendientes por despachar", value: String(pending), icon: Package },
                  { label: "Productos activos", value: String(productList.filter((p) => p.active).length), icon: LayoutDashboard },
                ].map((s) => (
                  <div key={s.label} className="border border-neutral-200 bg-white p-5">
                    <s.icon className="h-5 w-5 text-neutral-400" />
                    <p className="mt-3 font-display text-3xl font-bold">{s.value}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {lowStock.length > 0 && (
                <div className="mt-6 border-l-4 border-orange-500 bg-orange-50 p-4">
                  <p className="flex items-center gap-2 font-display text-lg font-bold uppercase text-orange-700">
                    <AlertTriangle className="h-5 w-5" /> Stock bajo — reponer pronto
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-orange-900">
                    {lowStock.map((p) => (
                      <li key={p.id}>• {p.name} — {p.sizes.reduce((a, s) => a + s.stock, 0)} unidades</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 border border-neutral-200 bg-white">
                <p className="border-b border-neutral-100 px-5 py-3 font-display text-lg font-bold uppercase tracking-wider">Últimos pedidos</p>
                {orderList.slice(0, 5).map((o) => (
                  <button key={o.id} onClick={() => setTab("pedidos")} className="flex w-full flex-wrap items-center gap-4 border-b border-neutral-50 px-5 py-3 text-left text-sm hover:bg-neutral-50">
                    <span className="font-bold">{o.number}</span>
                    <span>{o.customer.name}</span>
                    <span className="text-xs uppercase text-neutral-500">{o.paymentMethod} · {o.status}</span>
                    <span className="ml-auto font-display text-lg font-bold">{formatCOP(o.total)}</span>
                  </button>
                ))}
                {orderList.length === 0 && <p className="px-5 py-8 text-center text-sm text-neutral-400">Aún no hay pedidos. Cuando un cliente compre, aparecerá aquí con su notificación de WhatsApp.</p>}
              </div>
            </div>
          )}
          {tab === "productos" && <AdminProducts />}
          {tab === "pedidos" && <AdminOrders />}
          {tab === "clientes" && <AdminCustomers />}
          {tab === "notificaciones" && <AdminNotifications />}
          {tab === "portada" && <AdminSettings section="portada" />}
          {tab === "promociones" && <AdminSettings section="promociones" />}
          {tab === "marquesina" && <AdminSettings section="marquesina" />}
          {tab === "ajustes" && <AdminSettings section="ajustes" />}
        </div>
      </div>
    </div>
  );
}