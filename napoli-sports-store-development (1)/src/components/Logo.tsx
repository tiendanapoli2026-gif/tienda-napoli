"use client";

import { useStore } from "@/lib/store";

/**
 * Logo de la tienda — se controla desde el panel (Ajustes → Logo e identidad).
 * Si el administrador sube un logo, reemplaza el emblema por defecto en
 * header, footer y panel. `tone` adapta el emblema por defecto a fondos claros u oscuros.
 */
export default function Logo({ tone = "light", compact = false }: { tone?: "light" | "dark"; compact?: boolean }) {
  const { settings } = useStore();
  const brand = settings?.branding;
  const name = brand?.name || "Napoli";
  const tagline = brand?.tagline || "Tienda deportiva";
  const darkBg = tone === "dark"; // se muestra sobre fondo oscuro

  if (brand?.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logoUrl}
        alt={`${tagline} ${name}`}
        className={`${compact ? "h-9" : "h-11"} w-auto max-w-[190px] object-contain ${darkBg ? "bg-white p-1" : ""}`}
      />
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex ${compact ? "h-8 w-8" : "h-9 w-9"} items-center justify-center ${darkBg ? "bg-white" : "bg-neutral-950"}`}>
        <svg viewBox="0 0 24 24" className={`${compact ? "h-4.5 w-4.5" : "h-5 w-5"} ${darkBg ? "fill-neutral-950" : "fill-white"}`} aria-hidden>
          <path d="M4 20 8 4h3l3.5 10L17 4h3l-4 16h-3L9.5 10 7 20H4z" />
        </svg>
      </span>
      <span className={`leading-none ${darkBg ? "text-white" : "text-neutral-950"}`}>
        <span className={`block text-[9px] font-bold uppercase tracking-[0.28em] ${darkBg ? "text-neutral-400" : "text-neutral-500"}`}>
          {tagline}
        </span>
        <span className="block font-display text-2xl font-bold uppercase tracking-wide">{name}</span>
      </span>
    </span>
  );
}