"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, LogOut, Package, PartyPopper, User } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import PushOptIn from "@/components/PushOptIn";
import type { orders } from "@/db/schema";

type Order = typeof orders.$inferSelect;
type Me = { authenticated: boolean; role?: string; name?: string; email?: string };

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  preparando: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [welcome, setWelcome] = useState<{ code: string; percent: number } | null>(null);
  const router = useRouter();

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data: Me = await res.json();
    setMe(data);
    if (data.authenticated && data.role === "admin") {
      router.push("/admin");
      return;
    }
    if (data.authenticated) {
      const o = await fetch("/api/orders?mine=1");
      setMyOrders(await o.json());
    }
  }, [router]);

  useEffect(() => { loadMe(); }, [loadMe]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      if (data.welcomeCoupon) setWelcome(data.welcomeCoupon);
      await loadMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMyOrders([]);
    setWelcome(null);
    await loadMe();
  };

  if (!me) return <div className="py-32 text-center font-display text-2xl font-bold uppercase text-neutral-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {welcome && (
        <div className="mb-8 flex flex-col items-center gap-2 border-2 border-dashed border-neutral-950 bg-neutral-50 p-8 text-center anim-pop">
          <PartyPopper className="h-10 w-10" />
          <p className="font-display text-3xl font-bold uppercase">¡Bienvenido al Club Napoli!</p>
          <p className="text-sm text-neutral-600">Tu cupón de primera compra está listo:</p>
          <p className="mt-1 border border-neutral-950 bg-white px-6 py-2 font-display text-2xl font-bold tracking-[0.2em]">{welcome.code}</p>
          <p className="text-xs text-neutral-500">{welcome.percent}% de descuento automático en tu primer pedido.</p>
          <button onClick={() => setWelcome(null)} className="btn-dark mt-3 px-8 py-2.5 text-xs">¡A comprar!</button>
        </div>
      )}

      {!me.authenticated ? (
        <div className="mx-auto max-w-md">
          <h1 className="text-center font-display text-5xl font-bold uppercase">Mi cuenta</h1>
          <p className="mt-2 text-center text-sm text-neutral-500">Inicia sesión o regístrate y obtén tu cupón de bienvenida.</p>
          <div className="mt-6 grid grid-cols-2 border-2 border-neutral-950">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`py-3 font-display text-lg font-bold uppercase tracking-wider transition-colors ${tab === t ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"}`}
              >
                {t === "login" ? "Iniciar sesión" : "Registrarme"}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {tab === "register" && (
              <>
                <input className="field" placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="field" placeholder="Celular (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </>
            )}
            <input className="field" type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
            {error && <p className="border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button onClick={submit} disabled={busy} className="btn-dark w-full py-3.5 text-sm">
              {busy ? "Procesando…" : tab === "login" ? "Entrar" : "Crear cuenta"}
            </button>
            {tab === "register" && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                <Gift className="h-4 w-4" /> Los usuarios nuevos reciben un cupón de descuento automático.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center bg-neutral-950 text-white">
                <User className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-4xl font-bold uppercase">Hola, {me.name}</h1>
                <p className="text-sm text-neutral-500">{me.email}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 border-2 border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-neutral-950">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>

          <PushOptIn />

          <h2 className="mt-10 flex items-center gap-2 font-display text-2xl font-bold uppercase">
            <Package className="h-5 w-5" /> Mis pedidos
          </h2>
          {myOrders.length === 0 ? (
            <div className="mt-4 border border-neutral-200 bg-neutral-50 p-10 text-center">
              <p className="text-sm text-neutral-500">Aún no tienes pedidos.</p>
              <Link href="/categoria/todos" className="btn-dark mt-4 inline-block px-8 py-3 text-xs">Explorar la tienda</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {myOrders.map((o) => (
                <div key={o.id} className="border border-neutral-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm">
                    <span className="font-bold">{o.number}</span>
                    <span className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase ${STATUS_COLOR[o.status] || "bg-neutral-100"}`}>{o.status}</span>
                    <span className="font-display text-lg font-bold">{formatCOP(o.total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 px-4 py-3">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt="" className="h-10 w-9 object-cover" />
                        <span>{i.name} <span className="text-neutral-500">({i.size} ×{i.qty})</span></span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-neutral-100 px-4 py-2 text-right">
                    <Link href={`/pedido/${o.number}`} className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:text-neutral-500">
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}