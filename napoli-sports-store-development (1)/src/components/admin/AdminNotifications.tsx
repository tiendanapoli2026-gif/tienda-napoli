"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Megaphone, Send, Trash2, Users } from "lucide-react";
import { useStore } from "@/lib/store";

type Announcement = { id: number; title: string; message: string; link: string; pushSent: number; createdAt: string };

export default function AdminNotifications() {
  const { toast } = useStore();
  const [list, setList] = useState<Announcement[]>([]);
  const [subs, setSubs] = useState(0);
  const [form, setForm] = useState({ title: "", message: "", link: "", sendPush: true });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([fetch("/api/announcements"), fetch("/api/push/subscribe")]);
    if (a.ok) setList(await a.json());
    if (s.ok) setSubs((await s.json()).count);
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast("Escribe título y mensaje"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast(form.sendPush
        ? `Publicado ✓ · Push enviado a ${data.pushSent} navegador${data.pushSent !== 1 ? "es" : ""}`
        : "Anuncio publicado en la campanita ✓");
      setForm({ title: "", message: "", link: "", sendPush: true });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al publicar");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar este anuncio de la campanita?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    toast("Anuncio eliminado");
    await load();
  };

  const TEMPLATES = [
    { title: "🔥 40% OFF este fin de semana", message: "Solo hasta el domingo: descuentos en camisetas y tenis. ¡Paga contra entrega!", link: "/categoria/ofertas" },
    { title: "🆕 ¡Nuevos artículos!", message: "Acaba de llegar nueva colección a la tienda. Sé el primero en estrenar.", link: "/categoria/todos" },
    { title: "🎁 Cupón para ti", message: "Usa el código GOL20 y recibe 20% de descuento en tu compra.", link: "/categoria/tendencias" },
  ];

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-3xl font-bold uppercase">Notificaciones a clientes</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Publica ofertas, descuentos y nuevos artículos. Aparecen en la 🔔 campanita de la tienda y, si quieres, llegan como <strong>notificación push</strong> al navegador/celular de tus clientes suscritos — incluso con la página cerrada.
      </p>

      <div className="mt-5 flex items-center gap-4 border border-neutral-200 bg-white p-4">
        <span className="flex h-12 w-12 items-center justify-center bg-neutral-950 text-white"><Users className="h-6 w-6" /></span>
        <div>
          <p className="font-display text-3xl font-bold">{subs}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Clientes suscritos a notificaciones push</p>
        </div>
        <p className="ml-auto max-w-52 text-right text-[11px] text-neutral-400">
          Los clientes activan las alertas desde <strong>Mi cuenta → Activar notificaciones</strong>
        </p>
      </div>

      {/* Crear anuncio */}
      <div className="mt-6 border-2 border-neutral-950 bg-white p-6">
        <h3 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider">
          <Megaphone className="h-5 w-5" /> Nuevo anuncio
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.title} onClick={() => setForm({ ...t, sendPush: form.sendPush })} className="border border-neutral-300 px-3 py-1.5 text-[11px] font-bold hover:border-neutral-950">
              {t.title}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider">Título *
            <input className="field mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: 🔥 40% OFF este fin de semana" />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider">Mensaje *
            <textarea rows={2} className="field mt-1" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Ej: Solo hasta el domingo en camisetas y tenis…" />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider">Enlace (a dónde va el cliente al tocar)
            <input className="field mt-1" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/categoria/ofertas" />
          </label>
          <label className="flex cursor-pointer items-center gap-3 border border-neutral-200 bg-neutral-50 p-3 text-sm font-semibold">
            <input type="checkbox" checked={form.sendPush} onChange={(e) => setForm({ ...form, sendPush: e.target.checked })} className="h-4 w-4 accent-neutral-950" />
            <BellRing className="h-4 w-4" />
            Enviar también como notificación push a los {subs} suscritos
          </label>
          <button onClick={publish} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3.5 text-xs">
            <Send className="h-4 w-4" /> {busy ? "Enviando…" : "Publicar y notificar"}
          </button>
        </div>
      </div>

      {/* Historial */}
      <h3 className="mt-8 font-display text-xl font-bold uppercase tracking-wider">Anuncios publicados</h3>
      <div className="mt-3 space-y-2">
        {list.length === 0 && <p className="border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">Aún no has publicado anuncios.</p>}
        {list.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 border border-neutral-200 bg-white px-4 py-3 text-sm">
            <Megaphone className="h-4 w-4 shrink-0 text-neutral-400" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{a.title}</p>
              <p className="truncate text-xs text-neutral-500">{a.message}</p>
            </div>
            <span className="bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">
              Push: {a.pushSent}
            </span>
            <span className="text-[10px] text-neutral-400">{new Date(a.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
            <button onClick={() => remove(a.id)} aria-label="Eliminar anuncio" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
        <p className="font-bold uppercase tracking-wider text-neutral-950">💡 Otros canales gratis para llegar a tus clientes</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li><strong>WhatsApp uno a uno:</strong> en la pestaña <strong>Clientes</strong>, cada cliente tiene el botón verde &quot;Enviar oferta por WhatsApp&quot; con mensaje listo.</li>
          <li><strong>Estados de WhatsApp:</strong> publica tus ofertas en tus estados — todos tus contactos las ven.</li>
          <li><strong>Marquesina superior:</strong> edítala en la pestaña Marquesina para anunciar la promo a todo el que entre.</li>
        </ul>
      </div>
    </div>
  );
}