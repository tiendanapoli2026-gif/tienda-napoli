"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, MessageCircle, Phone, Search, UserCheck, Users, Wallet } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import type { CustomerRow } from "@/app/api/customers/route";

const fmtDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  preparando: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

export default function AdminCustomers() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "registrado" | "invitado" | "compradores">("todos");

  const load = useCallback(async () => {
    const res = await fetch("/api/customers");
    if (res.ok) setRows(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (filter === "registrado" && r.type !== "registrado") return false;
    if (filter === "invitado" && r.type !== "invitado") return false;
    if (filter === "compradores" && r.orderCount === 0) return false;
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q);
  });

  const registered = rows.filter((r) => r.type === "registrado").length;
  const buyers = rows.filter((r) => r.orderCount > 0).length;
  const revenue = rows.reduce((a, r) => a + r.totalSpent, 0);

  const waLink = (r: CustomerRow) =>
    `https://wa.me/${r.phone.replace(/\D/g, "").replace(/^(?!57)(\d{10})$/, "57$1")}?text=${encodeURIComponent(`¡Hola ${r.name}! Te escribimos de Tienda deportiva Napoli 🏷️ Tenemos nuevas ofertas que te pueden interesar: `)}`;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase">Clientes — control y historial</h2>
      <p className="mt-1 text-sm text-neutral-500">Todos los registrados y compradores, con qué compraron, cuánto y cuándo. Los datos quedan guardados permanentemente.</p>

      {/* Métricas */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Usuarios registrados", value: String(registered), icon: UserCheck },
          { label: "Clientes con compras", value: String(buyers), icon: Users },
          { label: "Ventas acumuladas", value: formatCOP(revenue), icon: Wallet },
        ].map((s) => (
          <div key={s.label} className="border border-neutral-200 bg-white p-4">
            <s.icon className="h-5 w-5 text-neutral-400" />
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([
          { id: "todos", label: `Todos (${rows.length})` },
          { id: "registrado", label: `Registrados (${registered})` },
          { id: "invitado", label: `Invitados (${rows.length - registered})` },
          { id: "compradores", label: `Con compras (${buyers})` },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${filter === f.id ? "bg-neutral-950 text-white" : "border border-neutral-300 hover:border-neutral-950"}`}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input className="field pl-9" placeholder="Buscar nombre, correo o teléfono…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400">
            No hay clientes que coincidan. Cuando alguien se registre o compre, aparecerá aquí automáticamente.
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.key} className="border border-neutral-200 bg-white">
            <button onClick={() => setOpen(open === r.key ? null : r.key)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left text-sm hover:bg-neutral-50">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center font-display text-lg font-bold ${r.type === "registrado" ? "bg-neutral-950 text-white" : "bg-neutral-200 text-neutral-600"}`}>
                {r.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{r.name}</span>
                <span className="block truncate text-xs text-neutral-500">{r.email} · {r.phone || "sin teléfono"}</span>
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${r.type === "registrado" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"}`}>
                {r.type}
              </span>
              <span className="ml-auto text-right">
                <span className="block font-display text-xl font-bold">{formatCOP(r.totalSpent)}</span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">{r.orderCount} pedido{r.orderCount !== 1 ? "s" : ""} · último: {fmtDate(r.lastPurchase)}</span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === r.key ? "rotate-180" : ""}`} />
            </button>

            {open === r.key && (
              <div className="border-t border-neutral-100 p-5 anim-fade-in">
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span>📅 Registrado: <strong className="text-neutral-950">{fmtDate(r.registeredAt)}</strong></span>
                  {r.phone && (
                    <>
                      <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1 border border-neutral-950 px-3 py-1 font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-950 hover:text-white">
                        <Phone className="h-3 w-3" /> Llamar
                      </a>
                      <a href={waLink(r)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-[#25D366] px-3 py-1 font-bold uppercase tracking-wider text-white hover:opacity-90">
                        <MessageCircle className="h-3 w-3" /> Enviar oferta por WhatsApp
                      </a>
                    </>
                  )}
                </div>

                {r.orders.length === 0 ? (
                  <p className="mt-4 border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-xs text-neutral-400">
                    Aún no ha comprado. Envíale el cupón de bienvenida por WhatsApp para animarlo 😉
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {r.orders.map((o) => (
                      <div key={o.id} className="border border-neutral-100">
                        <div className="flex flex-wrap items-center gap-3 bg-neutral-50 px-3 py-2 text-xs">
                          <span className="font-bold">{o.number}</span>
                          <span className="text-neutral-500">{new Date(o.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</span>
                          <span className={`px-2 py-0.5 font-bold uppercase ${STATUS_COLOR[o.status] || "bg-neutral-100"}`}>{o.status}</span>
                          <span className="uppercase text-neutral-500">{o.paymentMethod}</span>
                          <span className="ml-auto font-display text-base font-bold">{formatCOP(o.total)}</span>
                        </div>
                        <ul className="divide-y divide-neutral-50 px-3">
                          {o.items.map((i, idx) => (
                            <li key={idx} className="flex items-center gap-3 py-2 text-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={i.image} alt="" className="h-10 w-9 object-cover" />
                              <span className="flex-1">{i.name} <span className="text-neutral-400">· Talla {i.size} × {i.qty}</span></span>
                              <strong>{formatCOP(i.price * i.qty)}</strong>
                            </li>
                          ))}
                        </ul>
                        <p className="border-t border-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500">
                          📍 {o.customer.address}, {o.customer.city}{o.customer.department ? `, ${o.customer.department}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}