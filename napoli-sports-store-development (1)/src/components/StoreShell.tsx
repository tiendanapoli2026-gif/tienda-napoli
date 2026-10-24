"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, ShieldCheck, Truck, RotateCcw, Banknote, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import Logo from "@/components/Logo";
import { CATEGORIES, contrastText } from "@/lib/utils";

function Marquee() {
  const { settings } = useStore();
  const m = settings?.marquee;
  if (!m || !m.enabled || m.messages.length === 0) return null;
  const doubled = [...m.messages, ...m.messages, ...m.messages, ...m.messages];
  return (
    <div className="overflow-hidden bg-neutral-950 py-2 text-white" role="region" aria-label="Anuncios de la tienda">
      <div className="marquee-track" style={{ "--marquee-speed": `${Math.max(6, m.speed)}s` } as React.CSSProperties}>
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {doubled.map((msg, i) => (
              <span key={i} className="mx-6 flex items-center gap-6 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.2em]">
                {msg} <span className="text-neutral-500">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomMarquee() {
  const { settings } = useStore();
  const b = settings?.bottomMarquee;
  if (!b || !b.enabled) return null;
  const colors = b.mode === "text" ? ["#0a0a0a"] : b.colors.length ? b.colors.slice(0, 4) : ["#0a0a0a"];
  const showText = b.mode !== "colors" && b.text.trim().length > 0;
  // Repetir la secuencia para cubrir pantallas anchas y lograr el bucle continuo
  const seq = [...colors, ...colors, ...colors, ...colors];
  return (
    <div className="overflow-hidden border-t border-neutral-200" role="region" aria-label="Cinta de colores de la marca">
      <div className="marquee-track" style={{ "--marquee-speed": `${Math.max(6, b.speed)}s` } as React.CSSProperties}>
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
            {seq.map((color, i) => (
              <span
                key={i}
                className="flex min-h-12 items-center justify-center whitespace-nowrap px-12 py-3 font-display text-lg font-bold uppercase tracking-[0.3em] transition-colors"
                style={{ backgroundColor: color, color: contrastText(color), minWidth: showText ? undefined : "180px" }}
              >
                {showText ? b.text : "\u00A0"}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatsAppFloat() {
  const { settings } = useStore();
  const number = settings?.whatsapp.number?.replace(/\D/g, "") || "573001112233";
  const greeting = settings?.whatsapp.greeting || "¡Hola! Quiero más información.";
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(greeting)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp con la tienda"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-0 rounded-full bg-[#25D366] p-3.5 shadow-xl transition-all duration-300 hover:gap-2 hover:pr-5 active:scale-95"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
      <MessageCircle className="h-7 w-7 fill-white text-white" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-white transition-all duration-300 group-hover:max-w-40">
        ¿Te ayudamos?
      </span>
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-20 bg-neutral-950 text-white">
      <div className="border-b border-neutral-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 lg:px-8">
          {[
            { icon: Truck, title: "Envíos a todo el país", sub: "Y despachos internacionales" },
            { icon: Banknote, title: "Pago contra entrega", sub: "Paga cuando recibas" },
            { icon: RotateCcw, title: "Cambios fáciles", sub: "30 días para cambios de talla" },
            { icon: ShieldCheck, title: "Compra segura SSL", sub: "Transacciones encriptadas" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-1.5">
              <f.icon className="h-6 w-6 text-neutral-400" />
              <p className="font-display text-base font-bold uppercase tracking-wider">{f.title}</p>
              <p className="text-xs text-neutral-500">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
            Ropa y equipamiento deportivo para entrenar, competir y vivir el juego. Desde el barrio para el mundo.
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wider">Categorías</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className="transition-colors hover:text-white">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wider">Ayuda</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li><Link href="/cuenta" className="hover:text-white">Mi cuenta y pedidos</Link></li>
            <li><Link href="/favoritos" className="hover:text-white">Mis favoritos</Link></li>
            <li><Link href="/checkout" className="hover:text-white">Finalizar compra</Link></li>
            <li><Link href="/admin" className="hover:text-white">Panel administrativo</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wider">Pagos aceptados</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Wompi", "PayU", "Bold", "PSE", "Nequi", "Daviplata", "Visa", "Mastercard", "PayPal", "Efectivo"].map((p) => (
              <span key={p} className="border border-neutral-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                {p}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-green-500" /> Certificado SSL activo · Compra 100% segura
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} Tienda deportiva Napoli. Todos los derechos reservados.
      </div>
    </footer>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl anim-slide-down">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {t.message}
        </div>
      ))}
    </div>
  );
}

export default function StoreShell({ children }: { children: ReactNode }) {
  const { setSettings } = useStore();
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, [setSettings]);

  if (isAdminArea) {
    return (
      <>
        {children}
        <Toasts />
      </>
    );
  }

  return (
    <>
      <Marquee />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <BottomMarquee />
      <WhatsAppFloat />
      <CartDrawer />
      <Toasts />
    </>
  );
}