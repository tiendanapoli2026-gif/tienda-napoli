"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Megaphone, X } from "lucide-react";

type Announcement = { id: number; title: string; message: string; link: string; createdAt: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

export default function NotificationsBell() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number>(0);

  useEffect(() => {
    setSeen(Number(localStorage.getItem("napoli_notif_seen") || 0));
    fetch("/api/announcements")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const unread = items.filter((i) => new Date(i.createdAt).getTime() > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items.length) {
      const newest = Math.max(...items.map((i) => new Date(i.createdAt).getTime()));
      localStorage.setItem("napoli_notif_seen", String(newest));
      setSeen(newest);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        aria-label={`Novedades y ofertas${unread ? ` (${unread} nuevas)` : ""}`}
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
      >
        <Bell className={`h-5 w-5 ${unread ? "animate-[wiggle_0.6s_ease-in-out]" : ""}`} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-red-600 text-[10px] font-bold text-white anim-pop">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-neutral-200 bg-white shadow-2xl anim-slide-down sm:w-96">
            <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-950 px-4 py-3 text-white">
              <p className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wider">
                <Megaphone className="h-4 w-4" /> Ofertas y novedades
              </p>
              <button aria-label="Cerrar novedades" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const isNew = new Date(n.createdAt).getTime() > seen;
                const inner = (
                  <div className={`flex gap-3 border-b border-neutral-100 px-4 py-3 transition-colors hover:bg-neutral-50 ${isNew ? "bg-red-50/50" : ""}`}>
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 text-white">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{n.message}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
            </div>
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className="block border-t border-neutral-100 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-neutral-500"
            >
              Activar alertas en mi navegador →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}