"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Copy, MessageCircle, Trash2 } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { orders } from "@/db/schema";

type Order = typeof orders.$inferSelect;

const STATUSES = ["pendiente", "preparando", "enviado", "entregado", "cancelado"];
const PAY_STATUSES = ["pendiente", "pagado", "contraentrega", "reembolsado"];

export default function AdminOrders() {
  const { toast, settings } = useStore();
  const [list, setList] = useState<Order[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState("todos");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setList(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (o: Order, patch: Partial<Order>) => {
    await fetch(`/api/orders/${o.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: patch.status ?? o.status, paymentStatus: patch.paymentStatus ?? o.paymentStatus }),
    });
    toast("Pedido actualizado ✓");
    await load();
  };

  const removeOne = async (o: Order) => {
    if (!confirm(`¿Eliminar el pedido ${o.number} de ${o.customer.name}?\n\nEsta acción no se puede deshacer (el stock de los productos no se repone).`)) return;
    const res = await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    if (res.ok) {
      toast(`Pedido ${o.number} eliminado ✓`);
      setOpen(null);
      await load();
    } else {
      toast("No se pudo eliminar el pedido");
    }
  };

  const removeAll = async () => {
    if (list.length === 0) { toast("No hay pedidos para eliminar"); return; }
    if (!confirm(`⚠️ Vas a eliminar TODOS los ${list.length} pedidos de la base de datos.\n\nIdeal para limpiar las pruebas antes de cargar la información real. ¿Continuar?`)) return;
    const word = prompt('Confirmación final: escribe ELIMINAR (en mayúsculas) para vaciar todos los pedidos:');
    if (word !== "ELIMINAR") { toast("Cancelado — no se eliminó nada"); return; }
    const res = await fetch("/api/orders", { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast(`Base de pedidos vaciada ✓ (${data.deleted} eliminados)`);
      setOpen(null);
      await load();
    } else {
      toast("No se pudieron eliminar los pedidos");
    }
  };

  const waLink = (o: Order) =>
    `https://wa.me/${(settings?.whatsapp.number || "573001112233").replace(/\D/g, "")}?text=${encodeURIComponent(o.whatsappMessage)}`;

  const filtered = filter === "todos" ? list : list.filter((o) => o.status === filter);
  const revenue = list.filter((o) => o.status !== "cancelado").reduce((a, o) => a + o.total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-bold uppercase">Gestión de pedidos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-neutral-500">
            {list.length} pedidos · Ventas: <strong className="text-neutral-950">{formatCOP(revenue)}</strong>
          </p>
          <button
            onClick={removeAll}
            disabled={list.length === 0}
            className="flex items-center gap-2 border-2 border-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Elimina todos los pedidos (limpiar pruebas antes de producción)"
          >
            <Trash2 className="h-4 w-4" /> Vaciar pedidos ({list.length})
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["todos", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${filter === s ? "bg-neutral-950 text-white" : "border border-neutral-300 hover:border-neutral-950"}`}
          >
            {s} {s !== "todos" && `(${list.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400">No hay pedidos en este estado.</div>
        )}
        {filtered.map((o) => (
          <div key={o.id} className="border border-neutral-200 bg-white">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-left text-sm hover:bg-neutral-50">
              <span className="font-display text-lg font-bold">{o.number}</span>
              <span className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="font-semibold">{o.customer.name}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${o.paymentStatus === "pagado" ? "bg-green-100 text-green-800" : o.paymentStatus === "contraentrega" ? "bg-yellow-100 text-yellow-800" : "bg-neutral-100"}`}>
                {o.paymentMethod} · {o.paymentStatus}
              </span>
              <span
                title={o.waDetail || undefined}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase ${o.waStatus === "enviado" ? "bg-[#25D366]/15 text-[#128C4B]" : o.waStatus === "error" ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-500"}`}
              >
                <MessageCircle className="h-3 w-3" />
                {o.waStatus === "enviado" ? "WA enviado ✓" : o.waStatus === "error" ? "WA error" : "WA manual"}
              </span>

              <span className="ml-auto font-display text-xl font-bold">{formatCOP(o.total)}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${open === o.id ? "rotate-180" : ""}`} />
            </button>

            {open === o.id && (
              <div className="grid gap-6 border-t border-neutral-100 p-5 anim-fade-in lg:grid-cols-2">
                <div>
                  <p className="font-display text-base font-bold uppercase tracking-wider">Cliente y envío</p>
                  <div className="mt-2 space-y-1 text-sm text-neutral-600">
                    <p className="flex flex-wrap items-center gap-2">
                      <strong>{o.customer.name}</strong> · {o.customer.phone}
                      <a
                        href={`tel:${o.customer.phone.replace(/[^\d+]/g, "")}`}
                        className="border border-neutral-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-950 hover:text-white"
                      >
                        📞 Llamar para confirmar
                      </a>
                      <a
                        href={`https://wa.me/${o.customer.phone.replace(/\D/g, "").replace(/^(?!57)(\d{10})$/, "57$1")}?text=${encodeURIComponent(`¡Hola ${o.customer.name}! Te llamamos de Tienda deportiva Napoli para confirmar tu pedido ${o.number}. 📦`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
                      >
                        WhatsApp cliente
                      </a>
                    </p>
                    <p>{o.customer.email}</p>
                    <p>{o.customer.address}, {o.customer.city}{o.customer.department ? `, ${o.customer.department}` : ""} — {o.customer.country}</p>
                    {o.customer.notes && <p className="text-xs italic">Nota: {o.customer.notes}</p>}
                  </div>
                  <p className="mt-4 font-display text-base font-bold uppercase tracking-wider">Productos</p>
                  <ul className="mt-2 space-y-2">
                    {o.items.map((i, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt="" className="h-12 w-10 object-cover" />
                        <span className="flex-1">{i.name} <span className="text-neutral-500">· Talla {i.size} × {i.qty}</span></span>
                        <strong>{formatCOP(i.price * i.qty)}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-0.5 border-t border-neutral-100 pt-2 text-sm">
                    <p className="flex justify-between"><span>Subtotal</span><span>{formatCOP(o.subtotal)}</span></p>
                    <p className="flex justify-between"><span>Envío ({o.shippingZone})</span><span>{formatCOP(o.shippingCost)}</span></p>
                    {o.codFee > 0 && <p className="flex justify-between"><span>Recargo contra entrega</span><span>{formatCOP(o.codFee)}</span></p>}
                    {o.discount > 0 && <p className="flex justify-between text-green-700"><span>Descuento {o.couponCode}</span><span>-{formatCOP(o.discount)}</span></p>}
                    <p className="flex justify-between font-bold"><span>TOTAL</span><span>{formatCOP(o.total)}</span></p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-bold uppercase">Estado envío:
                      <select value={o.status} onChange={(e) => update(o, { status: e.target.value })} className="field ml-2 w-auto py-1.5">
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">Pago:
                      <select value={o.paymentStatus} onChange={(e) => update(o, { paymentStatus: e.target.value })} className="field ml-2 w-auto py-1.5">
                        {PAY_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <button
                      onClick={() => removeOne(o)}
                      className="flex items-center gap-1.5 border border-red-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar pedido
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-bold uppercase tracking-wider">Notificación WhatsApp</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(o.whatsappMessage); toast("Mensaje copiado ✓"); }}
                        className="flex items-center gap-1 border border-neutral-300 px-3 py-1.5 text-xs font-bold hover:border-neutral-950"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </button>
                      <a href={waLink(o)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
                        <MessageCircle className="h-3.5 w-3.5" /> Abrir chat
                      </a>
                    </div>
                  </div>
                  <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed">{o.whatsappMessage}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}