"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Layers, ImagePlus, Palette, Plus, Save, Trash2, Type, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { contrastText } from "@/lib/utils";
import type { SiteSettings } from "@/lib/settings";

type Coupon = { id: number; code: string; percent: number; description: string; newUsersOnly: boolean; active: boolean };

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-green-600" : "bg-neutral-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

export default function AdminSettings({ section }: { section: "portada" | "marquesina" | "promociones" | "ajustes" }) {
  const { settings, setSettings, toast } = useStore();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [couponList, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", percent: "10", description: "", newUsersOnly: false });
  const [busy, setBusy] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const [previewSlide, setPreviewSlide] = useState(0);

  const uploadSlideImage = async (idx: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file || !draft) return;
    setUploadingSlide(idx);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.urls?.[0]) {
        setDraft({ ...draft, heroSlides: draft.heroSlides.map((s, j) => (j === idx ? { ...s, image: data.urls[0] } : s)) });
        toast("Imagen subida ✓ — pulsa Guardar portada para publicarla");
      } else {
        toast(data.error || "No se pudo subir la imagen");
      }
    } finally {
      setUploadingSlide(null);
    }
  };

  const uploadLogo = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !draft) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.urls?.[0]) {
        setDraft({ ...draft, branding: { ...draft.branding, logoUrl: data.urls[0] } });
        toast("Logo subido ✓ — pulsa Guardar para publicarlo");
      } else {
        toast(data.error || "No se pudo subir el logo");
      }
      if (data.warnings?.length) toast(data.warnings.join(" "));
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (settings) setDraft(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const loadCoupons = useCallback(async () => {
    const res = await fetch("/api/coupons");
    if (res.ok) setCoupons(await res.json());
  }, []);

  useEffect(() => {
    if (section === "promociones") loadCoupons();
  }, [section, loadCoupons]);

  if (!draft) return <p className="py-20 text-center text-neutral-400">Cargando configuración…</p>;

  const save = async (keys: (keyof SiteSettings)[]) => {
    setBusy(true);
    try {
      const payload: Partial<SiteSettings> = {};
      keys.forEach((k) => { (payload as Record<string, unknown>)[k] = draft[k]; });
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSettings(await res.json());
      toast("Configuración guardada ✓ — ya está visible en la tienda");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- PORTADA (CARRUSEL HERO) ---------- */
  if (section === "portada") {
    const hs = draft.heroSlides;
    const setSlide = (idx: number, patch: Partial<(typeof hs)[number]>) =>
      setDraft({ ...draft, heroSlides: hs.map((s, j) => (j === idx ? { ...s, ...patch } : s)) });
    const moveSlide = (idx: number, dir: -1 | 1) => {
      const next = [...hs];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return;
      [next[idx], next[target]] = [next[target], next[idx]];
      setDraft({ ...draft, heroSlides: next });
      setPreviewSlide(target);
    };
    const preview = hs[Math.min(previewSlide, hs.length - 1)];

    return (
      <div className="max-w-4xl">
        <h2 className="font-display text-3xl font-bold uppercase">Portada — carrusel principal</h2>
        <p className="mt-1 text-sm text-neutral-500">
          El banner grande del inicio rota automáticamente cada <strong>10 segundos</strong>, se pausa al pasar el cursor y tiene flechas e indicadores. Edita imagen, textos y color de acento de cada diapositiva.
        </p>

        {/* Vista previa */}
        {preview && (
          <div className="relative mt-6 aspect-[21/9] overflow-hidden bg-neutral-950 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image} alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
            <div className="relative flex h-full flex-col justify-center px-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-neutral-400">{preview.tag}</p>
              <p className="display-tight mt-2 max-w-md font-display text-4xl font-bold uppercase sm:text-5xl">
                {preview.title}<span style={{ color: preview.accent }}>.</span>
              </p>
              <p className="mt-2 hidden max-w-xs text-[11px] text-neutral-300 sm:block">{preview.subtitle}</p>
              <span className="mt-3 inline-flex w-fit items-center gap-2 bg-white px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-neutral-950">
                {preview.ctaText} →
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: preview.accent }} />
            <span className="absolute right-3 top-3 bg-neutral-950/70 px-2 py-1 text-[9px] font-bold uppercase tracking-widest">
              Vista previa · {Math.min(previewSlide, hs.length - 1) + 1}/{hs.length} {!preview.active && "· OCULTA"}
            </span>
          </div>
        )}

        {/* Lista de diapositivas */}
        <div className="mt-6 space-y-4">
          {hs.map((slide, i) => (
            <div
              key={i}
              className={`border-2 bg-white transition-colors ${previewSlide === i ? "border-neutral-950" : "border-neutral-200"}`}
              onClick={() => setPreviewSlide(i)}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-4 py-2.5">
                <span className="font-display text-xl font-bold">{String(i + 1).padStart(2, "0")}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt="" className="h-10 w-16 border border-neutral-200 object-cover" />
                <span className="text-sm font-semibold">{slide.title || "Sin título"}</span>
                <span className="h-4 w-4 border border-neutral-300" style={{ backgroundColor: slide.accent }} title={`Acento ${slide.accent}`} />
                <div className="ml-auto flex items-center gap-2">
                  <Toggle checked={slide.active} onChange={(v) => setSlide(i, { active: v })} label={slide.active ? "Visible" : "Oculta"} />
                  <button onClick={() => moveSlide(i, -1)} disabled={i === 0} aria-label="Subir diapositiva" className="border border-neutral-300 p-1.5 hover:border-neutral-950 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => moveSlide(i, 1)} disabled={i === hs.length - 1} aria-label="Bajar diapositiva" className="border border-neutral-300 p-1.5 hover:border-neutral-950 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => { setDraft({ ...draft, heroSlides: hs.filter((_, j) => j !== i) }); setPreviewSlide(0); }}
                    disabled={hs.length <= 1}
                    aria-label="Eliminar diapositiva"
                    className="border border-red-200 p-1.5 text-red-600 hover:border-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider">Imagen de fondo</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <label className={`flex cursor-pointer items-center gap-2 border-2 border-neutral-950 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-neutral-950 hover:text-white ${uploadingSlide === i ? "opacity-50" : ""}`}>
                      <ImagePlus className="h-4 w-4" /> {uploadingSlide === i ? "Subiendo…" : "Subir imagen"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingSlide === i} onChange={(e) => uploadSlideImage(i, e.target.files)} />
                    </label>
                    <input
                      className="field flex-1"
                      placeholder="…o URL de la imagen (recomendado 1920×1080, sujeto a la derecha)"
                      value={slide.image}
                      onChange={(e) => setSlide(i, { image: e.target.value })}
                    />
                  </div>
                </div>
                <label className="text-xs font-bold uppercase tracking-wider">Etiqueta superior (tag)
                  <input className="field mt-1" value={slide.tag} onChange={(e) => setSlide(i, { tag: e.target.value })} placeholder="Ej: Temporada 25/26 · Nueva colección" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider">Título grande
                  <input className="field mt-1 uppercase" value={slide.title} onChange={(e) => setSlide(i, { title: e.target.value })} placeholder="Ej: Imposible es nada" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Subtítulo
                  <textarea rows={2} className="field mt-1" value={slide.subtitle} onChange={(e) => setSlide(i, { subtitle: e.target.value })} />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider">Texto del botón
                  <input className="field mt-1" value={slide.ctaText} onChange={(e) => setSlide(i, { ctaText: e.target.value })} placeholder="Ej: Comprar hombre" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider">Enlace del botón
                  <input className="field mt-1" value={slide.ctaLink} onChange={(e) => setSlide(i, { ctaLink: e.target.value })} placeholder="Ej: /categoria/ofertas" />
                </label>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider">Color de acento</p>
                  <input type="color" value={slide.accent} onChange={(e) => setSlide(i, { accent: e.target.value })} className="h-9 w-12 cursor-pointer border border-neutral-300 bg-white p-0.5" aria-label="Color de acento" />
                  <input className="field w-28 uppercase" value={slide.accent} onChange={(e) => setSlide(i, { accent: e.target.value })} />
                  {["#dc2626", "#38bdf8", "#4ade80", "#facc15", "#f97316", "#e879f9"].map((c) => (
                    <button key={c} onClick={() => setSlide(i, { accent: c })} aria-label={`Usar acento ${c}`} className="h-6 w-6 border border-neutral-300 transition-transform hover:scale-110" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setDraft({ ...draft, heroSlides: [...hs, { image: "/images/hero.jpg", tag: "Nueva colección", title: "Nuevo título", subtitle: "", accent: "#dc2626", ctaText: "Comprar", ctaLink: "/categoria/todos", active: false }] });
              setPreviewSlide(hs.length);
            }}
            disabled={hs.length >= 6}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar diapositiva {hs.length >= 6 && "(máximo 6)"}
          </button>
          <button onClick={() => save(["heroSlides"])} disabled={busy} className="btn-dark ml-auto flex items-center gap-2 px-8 py-3 text-xs">
            <Save className="h-4 w-4" /> {busy ? "Guardando…" : "Guardar portada"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- MARQUESINA ---------- */
  if (section === "marquesina") {
    const m = draft.marquee;
    const bm = draft.bottomMarquee;
    const setBm = (patch: Partial<typeof bm>) => setDraft({ ...draft, bottomMarquee: { ...bm, ...patch } });
    const bmPreviewColors = bm.mode === "text" ? ["#0a0a0a"] : bm.colors.length ? bm.colors : ["#0a0a0a"];
    const bmShowText = bm.mode !== "colors" && bm.text.trim().length > 0;
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold uppercase">Banner superior (marquesina)</h2>
        <p className="mt-1 text-sm text-neutral-500">Edita los textos, la velocidad y activa o desactiva la barra animada.</p>

        <div className="mt-6 space-y-6 border border-neutral-200 bg-white p-6">
          <Toggle checked={m.enabled} onChange={(v) => setDraft({ ...draft, marquee: { ...m, enabled: v } })} label="Marquesina activa" />

          <div>
            <label className="text-xs font-bold uppercase tracking-wider">
              Velocidad del recorrido: <span className="text-neutral-500">{m.speed}s por ciclo (menor = más rápido)</span>
            </label>
            <input
              type="range" min={6} max={80} value={m.speed}
              onChange={(e) => setDraft({ ...draft, marquee: { ...m, speed: Number(e.target.value) } })}
              className="mt-2 w-full accent-neutral-950"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Mensajes (se muestran en rotación continua)</p>
            <div className="mt-2 space-y-2">
              {m.messages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field flex-1 uppercase"
                    value={msg}
                    onChange={(e) => setDraft({ ...draft, marquee: { ...m, messages: m.messages.map((x, j) => (j === i ? e.target.value : x)) } })}
                  />
                  <button onClick={() => setDraft({ ...draft, marquee: { ...m, messages: m.messages.filter((_, j) => j !== i) } })} aria-label="Eliminar mensaje" className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDraft({ ...draft, marquee: { ...m, messages: [...m.messages, "NUEVO MENSAJE"] } })}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar mensaje
              </button>
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Vista previa</p>
            <div className="mt-2 overflow-hidden bg-neutral-950 py-2 text-white">
              <div className="marquee-track" style={{ "--marquee-speed": `${m.speed}s` } as React.CSSProperties}>
                {[0, 1].map((half) => (
                  <div key={half} className="flex shrink-0">
                    {m.messages.map((msg, i) => (
                      <span key={i} className="mx-6 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.2em]">{msg} <span className="text-neutral-500">◆</span></span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => save(["marquee"])} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3 text-xs">
            <Save className="h-4 w-4" /> {busy ? "Guardando…" : "Guardar marquesina"}
          </button>
        </div>

        {/* MARQUESINA INFERIOR */}
        <h2 className="mt-12 font-display text-3xl font-bold uppercase">Marquesina inferior (cinta de colores)</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Se muestra al final de toda la página, debajo del footer. Combina hasta 4 colores en secuencia continua (ej: verde → blanco → rojo) con el nombre o texto de tu marca.
        </p>

        <div className="mt-6 space-y-6 border border-neutral-200 bg-white p-6">
          <Toggle checked={bm.enabled} onChange={(v) => setBm({ enabled: v })} label="Marquesina inferior activa" />

          {/* Modo */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">¿Qué debe mostrar?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                { id: "colors", label: "Solo colores", icon: Palette },
                { id: "text", label: "Solo texto", icon: Type },
                { id: "both", label: "Colores + texto", icon: Layers },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBm({ mode: opt.id })}
                  className={`flex flex-col items-center gap-1.5 border-2 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                    bm.mode === opt.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 hover:border-neutral-950"
                  }`}
                >
                  <opt.icon className="h-5 w-5" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Texto */}
          {bm.mode !== "colors" && (
            <label className="block text-xs font-bold uppercase tracking-wider anim-fade-in">
              Nombre o texto a mostrar
              <input
                className="field mt-1 uppercase"
                value={bm.text}
                onChange={(e) => setBm({ text: e.target.value })}
                placeholder="Ej: TIENDA DEPORTIVA NAPOLI"
              />
            </label>
          )}

          {/* Colores */}
          {bm.mode !== "text" && (
            <div className="anim-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider">
                Colores en secuencia <span className="text-neutral-400">({bm.colors.length}/4 — salen uno tras otro)</span>
              </p>
              <div className="mt-2 space-y-2">
                {bm.colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-center font-display text-lg font-bold text-neutral-400">{i + 1}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setBm({ colors: bm.colors.map((c, j) => (j === i ? e.target.value : c)) })}
                      className="h-10 w-14 cursor-pointer border border-neutral-300 bg-white p-0.5"
                      aria-label={`Elegir color ${i + 1}`}
                    />
                    <input
                      className="field w-32 uppercase"
                      value={color}
                      onChange={(e) => setBm({ colors: bm.colors.map((c, j) => (j === i ? e.target.value : c)) })}
                      placeholder="#000000"
                    />
                    <span className="flex h-10 flex-1 items-center justify-center border border-neutral-200 font-display text-sm font-bold uppercase tracking-[0.25em]" style={{ backgroundColor: color, color: contrastText(color) }}>
                      {bmShowText ? bm.text || "TEXTO" : "COLOR"}
                    </span>
                    <button
                      onClick={() => setBm({ colors: bm.colors.filter((_, j) => j !== i) })}
                      aria-label={`Quitar color ${i + 1}`}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setBm({ colors: [...bm.colors, "#0a0a0a"] })}
                  disabled={bm.colors.length >= 4}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar color {bm.colors.length >= 4 && "(máximo 4)"}
                </button>
                <span className="text-neutral-300">·</span>
                <span className="text-[11px] text-neutral-400">Sugerencias:</span>
                {[
                  { label: "Italia", colors: ["#009246", "#ffffff", "#ce2b37"] },
                  { label: "Colombia", colors: ["#fcd116", "#003893", "#ce1126"] },
                  { label: "Napoli clásico", colors: ["#0a0a0a", "#ffffff"] },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setBm({ colors: p.colors })}
                    className="flex items-center gap-1 border border-neutral-300 px-2 py-1 text-[10px] font-bold uppercase hover:border-neutral-950"
                  >
                    {p.colors.map((c, i) => <span key={i} className="h-3 w-3 border border-neutral-200" style={{ backgroundColor: c }} />)}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Velocidad */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">
              Velocidad: <span className="text-neutral-500">{bm.speed}s por ciclo (menor = más rápido)</span>
            </label>
            <input type="range" min={6} max={80} value={bm.speed} onChange={(e) => setBm({ speed: Number(e.target.value) })} className="mt-2 w-full accent-neutral-950" />
          </div>

          {/* Vista previa en vivo */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Vista previa en vivo</p>
            <div className="mt-2 overflow-hidden border border-neutral-200">
              {bm.enabled ? (
                <div className="marquee-track" style={{ "--marquee-speed": `${Math.max(6, bm.speed)}s` } as React.CSSProperties}>
                  {[0, 1].map((half) => (
                    <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
                      {[...bmPreviewColors, ...bmPreviewColors, ...bmPreviewColors, ...bmPreviewColors].map((color, i) => (
                        <span
                          key={i}
                          className="flex min-h-12 items-center justify-center whitespace-nowrap px-12 py-3 font-display text-lg font-bold uppercase tracking-[0.3em]"
                          style={{ backgroundColor: color, color: contrastText(color), minWidth: bmShowText ? undefined : "180px" }}
                        >
                          {bmShowText ? bm.text : "\u00A0"}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-xs text-neutral-400">Marquesina inferior desactivada — no se mostrará en la tienda.</p>
              )}
            </div>
          </div>

          <button onClick={() => save(["bottomMarquee"])} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3 text-xs">
            <Save className="h-4 w-4" /> {busy ? "Guardando…" : "Guardar marquesina inferior"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- PROMOCIONES ---------- */
  if (section === "promociones") {
    const nc = draft.newUserCoupon;
    return (
      <div className="max-w-3xl space-y-10">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase">Promociones y descuentos</h2>
          <p className="mt-1 text-sm text-neutral-500">Cupón automático para usuarios nuevos y banners de la página principal.</p>
        </div>

        {/* Cupón nuevos usuarios */}
        <div className="border border-neutral-200 bg-white p-6">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider">Cupón de bienvenida (usuarios nuevos)</h3>
          <div className="mt-4 space-y-4">
            <Toggle checked={nc.enabled} onChange={(v) => setDraft({ ...draft, newUserCoupon: { ...nc, enabled: v } })} label="Entregar cupón automáticamente al registrarse" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider">Código
                <input className="field mt-1 uppercase" value={nc.code} onChange={(e) => setDraft({ ...draft, newUserCoupon: { ...nc, code: e.target.value.toUpperCase() } })} />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider">Porcentaje de descuento
                <input type="number" min={1} max={90} className="field mt-1" value={nc.percent} onChange={(e) => setDraft({ ...draft, newUserCoupon: { ...nc, percent: Number(e.target.value) } })} />
              </label>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="border border-neutral-200 bg-white p-6">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider">Banners promocionales del inicio</h3>
          <div className="mt-4 space-y-5">
            {draft.banners.map((b, i) => (
              <div key={i} className="border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <Toggle checked={b.active} onChange={(v) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, active: v } : x)) })} label={`Banner ${i + 1} visible`} />
                  <button onClick={() => setDraft({ ...draft, banners: draft.banners.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700" aria-label="Eliminar banner">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input className="field sm:col-span-2" placeholder="URL de imagen" value={b.image} onChange={(e) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, image: e.target.value } : x)) })} />
                  <input className="field" placeholder="Título" value={b.title} onChange={(e) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <input className="field" placeholder="Subtítulo" value={b.subtitle} onChange={(e) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, subtitle: e.target.value } : x)) })} />
                  <input className="field" placeholder="Texto del botón" value={b.cta} onChange={(e) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, cta: e.target.value } : x)) })} />
                  <input className="field" placeholder="Enlace (ej: /categoria/ofertas)" value={b.link} onChange={(e) => setDraft({ ...draft, banners: draft.banners.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)) })} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setDraft({ ...draft, banners: [...draft.banners, { image: "", title: "NUEVO BANNER", subtitle: "", cta: "Comprar", link: "/categoria/todos", active: false }] })}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar banner
            </button>
          </div>
          <button onClick={() => save(["banners", "newUserCoupon"])} disabled={busy} className="btn-dark mt-5 flex items-center gap-2 px-8 py-3 text-xs">
            <Save className="h-4 w-4" /> Guardar promociones
          </button>
        </div>

        {/* Cupones */}
        <div className="border border-neutral-200 bg-white p-6">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider">Cupones de descuento</h3>
          <div className="mt-4 space-y-2">
            {couponList.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 border border-neutral-200 px-4 py-2.5 text-sm">
                <span className="border border-dashed border-neutral-950 bg-neutral-50 px-2 py-0.5 font-bold">{c.code}</span>
                <span className="font-semibold text-red-600">-{c.percent}%</span>
                <span className="text-xs text-neutral-500">{c.description}</span>
                {c.newUsersOnly && <span className="bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-800">Solo nuevos</span>}
                <div className="ml-auto flex items-center gap-3">
                  <Toggle checked={c.active} onChange={async (v) => {
                    await fetch("/api/coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, active: v }) });
                    toast(v ? "Cupón activado ✓" : "Cupón desactivado");
                    loadCoupons();
                  }} label={c.active ? "Activo" : "Inactivo"} />
                  <button onClick={async () => { await fetch(`/api/coupons?id=${c.id}`, { method: "DELETE" }); loadCoupons(); }} aria-label="Eliminar cupón" className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_100px_1fr_auto]">
            <input className="field uppercase" placeholder="CÓDIGO" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
            <input type="number" className="field" placeholder="%" value={newCoupon.percent} onChange={(e) => setNewCoupon({ ...newCoupon, percent: e.target.value })} />
            <input className="field" placeholder="Descripción" value={newCoupon.description} onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })} />
            <button
              onClick={async () => {
                if (!newCoupon.code) return;
                const res = await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newCoupon, percent: Number(newCoupon.percent) }) });
                if (res.ok) { toast("Cupón creado ✓"); setNewCoupon({ code: "", percent: "10", description: "", newUsersOnly: false }); loadCoupons(); }
              }}
              className="btn-dark px-5 py-2 text-xs"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- AJUSTES ---------- */
  const sh = draft.shipping;
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold uppercase">Ajustes de la tienda</h2>
        <p className="mt-1 text-sm text-neutral-500">Logo, WhatsApp, contra entrega, tarifas de envío y pasarelas de pago.</p>
      </div>

      {/* LOGO E IDENTIDAD */}
      <div className="border-2 border-neutral-950 bg-white p-6">
        <h3 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider">
          <ImagePlus className="h-5 w-5" /> Logo e identidad de marca
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Sube el logo de tu tienda y reemplazará el emblema por defecto en el <strong>header</strong>, el <strong>footer</strong> y el <strong>panel</strong>. Recomendado: PNG con fondo transparente, alto mínimo 120 px.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr]">
          {/* Vista previa */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Vista previa</p>
            <div className="flex h-24 w-56 items-center justify-center border border-neutral-200 bg-white p-3">
              {draft.branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.branding.logoUrl} alt="Logo sobre fondo claro" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-neutral-400">Emblema por defecto (fondo claro)</span>
              )}
            </div>
            <div className="flex h-24 w-56 items-center justify-center bg-neutral-950 p-3">
              {draft.branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.branding.logoUrl} alt="Logo sobre fondo oscuro" className="max-h-full max-w-full bg-white object-contain p-1" />
              ) : (
                <span className="text-xs text-neutral-500">Emblema por defecto (fondo oscuro)</span>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <label className={`btn-dark flex cursor-pointer items-center gap-2 px-6 py-3 text-xs ${uploadingLogo ? "opacity-60" : ""}`}>
                <ImagePlus className="h-4 w-4" /> {uploadingLogo ? "Subiendo…" : "Subir logo desde mi equipo"}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={(e) => uploadLogo(e.target.files)} />
              </label>
              {draft.branding.logoUrl && (
                <button
                  onClick={() => setDraft({ ...draft, branding: { ...draft.branding, logoUrl: "" } })}
                  className="flex items-center gap-1.5 border-2 border-red-300 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:border-red-600"
                >
                  <X className="h-4 w-4" /> Quitar logo
                </button>
              )}
            </div>
            <label className="block text-xs font-bold uppercase tracking-wider">…o pega la URL del logo
              <input
                className="field mt-1"
                placeholder="https://…/mi-logo.png"
                value={draft.branding.logoUrl}
                onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, logoUrl: e.target.value } })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider">Nombre de la marca
                <input
                  className="field mt-1"
                  value={draft.branding.name}
                  onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, name: e.target.value } })}
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider">Línea superior (tagline)
                <input
                  className="field mt-1"
                  value={draft.branding.tagline}
                  onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, tagline: e.target.value } })}
                />
              </label>
            </div>
            <p className="text-[11px] text-neutral-400">El nombre y el tagline se usan cuando no hay logo subido, y como texto alternativo (SEO) del logo.</p>
            <button onClick={() => save(["branding"])} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3 text-xs">
              <Save className="h-4 w-4" /> {busy ? "Guardando…" : "Guardar logo e identidad"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-2 border-[#25D366] bg-white p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider">Canal de WhatsApp y notificación automática</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider">Número de la tienda (con indicativo)
            <input className="field mt-1" value={draft.whatsapp.number} onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, number: e.target.value } })} placeholder="573001112233" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Mensaje de saludo del botón flotante
            <input className="field mt-1" value={draft.whatsapp.greeting} onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, greeting: e.target.value } })} />
          </label>
        </div>

        <div className="mt-5 border-t border-neutral-100 pt-5">
          <Toggle
            checked={draft.whatsapp.notify.enabled}
            onChange={(v) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, notify: { ...draft.whatsapp.notify, enabled: v } } })}
            label="🔔 Notificarme AUTOMÁTICAMENTE cada pedido (el cliente no hace nada)"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Al confirmarse un pedido, el servidor envía el resumen directo a tu WhatsApp: cliente, teléfono, productos, tallas, total y dirección — listo para que lo llames y confirmes.
          </p>

          {draft.whatsapp.notify.enabled && (
            <div className="mt-4 space-y-4 anim-fade-in">
              <label className="block text-xs font-bold uppercase tracking-wider">Proveedor de envío
                <select
                  className="field mt-1"
                  value={draft.whatsapp.notify.provider}
                  onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, notify: { ...draft.whatsapp.notify, provider: e.target.value as "callmebot" | "cloud" } } })}
                >
                  <option value="callmebot">CallMeBot — gratis y fácil (recomendado para empezar)</option>
                  <option value="cloud">WhatsApp Cloud API de Meta (producción / alto volumen)</option>
                </select>
              </label>

              {draft.whatsapp.notify.provider === "callmebot" ? (
                <>
                  <label className="block text-xs font-bold uppercase tracking-wider">API Key de CallMeBot
                    <input
                      className="field mt-1"
                      value={draft.whatsapp.notify.callmebotApiKey}
                      onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, notify: { ...draft.whatsapp.notify, callmebotApiKey: e.target.value } } })}
                      placeholder="Ej: 1234567"
                    />
                  </label>
                  <div className="border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
                    <p className="font-bold uppercase tracking-wider text-neutral-950">Cómo obtener tu API key gratis (2 minutos, una sola vez):</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4">
                      <li>Guarda en tu celular el contacto <strong>+34 644 59 71 67</strong> (CallMeBot).</li>
                      <li>Desde el WhatsApp de la tienda, envíale el mensaje: <strong>I allow callmebot to send me messages</strong></li>
                      <li>El bot te responde con tu <strong>apikey</strong> — pégala arriba y guarda.</li>
                    </ol>
                    <p className="mt-2">El número que recibe los avisos es el &quot;Número de la tienda&quot; configurado arriba.</p>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wider">Phone Number ID (Meta)
                    <input
                      className="field mt-1"
                      value={draft.whatsapp.notify.cloudPhoneId}
                      onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, notify: { ...draft.whatsapp.notify, cloudPhoneId: e.target.value } } })}
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider">Token de acceso permanente
                    <input
                      type="password"
                      className="field mt-1"
                      value={draft.whatsapp.notify.cloudToken}
                      onChange={(e) => setDraft({ ...draft, whatsapp: { ...draft.whatsapp, notify: { ...draft.whatsapp.notify, cloudToken: e.target.value } } })}
                    />
                  </label>
                  <p className="text-xs text-neutral-500 sm:col-span-2">
                    Créalos en developers.facebook.com → tu app → WhatsApp → Configuración de la API. Nota: para iniciar conversaciones fuera de la ventana de 24 h, Meta exige plantillas aprobadas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-500">Si la notificación automática está apagada, el cliente verá un botón para enviarte el resumen manualmente y cada pedido queda registrado en el panel.</p>
      </div>

      {/* UBICACIÓN FÍSICA */}
      <div className="border border-neutral-200 bg-white p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider">Ubicación física de la tienda (mapa)</h3>
        <div className="mt-4 space-y-4">
          <Toggle checked={draft.storeLocation.enabled} onChange={(v) => setDraft({ ...draft, storeLocation: { ...draft.storeLocation, enabled: v } })} label="Mostrar sección Visítanos con mapa en la página principal" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider">Dirección
              <input className="field mt-1" value={draft.storeLocation.address} onChange={(e) => setDraft({ ...draft, storeLocation: { ...draft.storeLocation, address: e.target.value } })} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">Ciudad / País
              <input className="field mt-1" value={draft.storeLocation.city} onChange={(e) => setDraft({ ...draft, storeLocation: { ...draft.storeLocation, city: e.target.value } })} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Horario de atención
              <input className="field mt-1" value={draft.storeLocation.hours} onChange={(e) => setDraft({ ...draft, storeLocation: { ...draft.storeLocation, hours: e.target.value } })} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Búsqueda del mapa (Google Maps)
              <input className="field mt-1" value={draft.storeLocation.mapQuery} onChange={(e) => setDraft({ ...draft, storeLocation: { ...draft.storeLocation, mapQuery: e.target.value } })} placeholder="Ej: Calle 53 #24-15, Bogotá, Colombia" />
            </label>
          </div>
          {draft.storeLocation.mapQuery && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Vista previa del mapa</p>
              <iframe
                title="Vista previa ubicación"
                src={`https://www.google.com/maps?q=${encodeURIComponent(draft.storeLocation.mapQuery)}&output=embed`}
                className="mt-2 h-56 w-full border border-neutral-200"
                loading="lazy"
              />
            </div>
          )}
          <button onClick={() => save(["storeLocation"])} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3 text-xs">
            <Save className="h-4 w-4" /> Guardar ubicación
          </button>
        </div>
      </div>

      <div className="border border-neutral-200 bg-white p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider">Pago contra entrega</h3>
        <div className="mt-4 space-y-4">
          <Toggle checked={draft.cod.enabled} onChange={(v) => setDraft({ ...draft, cod: { ...draft.cod, enabled: v } })} label="Habilitar pago contra entrega (solo Colombia)" />
          <label className="block max-w-xs text-xs font-bold uppercase tracking-wider">Recargo por contra entrega (COP)
            <input type="number" className="field mt-1" value={draft.cod.fee} onChange={(e) => setDraft({ ...draft, cod: { ...draft.cod, fee: Number(e.target.value) } })} />
          </label>
        </div>
      </div>

      <div className="border border-neutral-200 bg-white p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider">Tarifas de envío automáticas</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider">Envío GRATIS desde (COP)
            <input type="number" className="field mt-1" value={sh.freeThreshold} onChange={(e) => setDraft({ ...draft, shipping: { ...sh, freeThreshold: Number(e.target.value) } })} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Tarifa ciudades principales
            <input type="number" className="field mt-1" value={sh.local} onChange={(e) => setDraft({ ...draft, shipping: { ...sh, local: Number(e.target.value) } })} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Tarifa nacional
            <input type="number" className="field mt-1" value={sh.national} onChange={(e) => setDraft({ ...draft, shipping: { ...sh, national: Number(e.target.value) } })} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Tarifa internacional
            <input type="number" className="field mt-1" value={sh.international} onChange={(e) => setDraft({ ...draft, shipping: { ...sh, international: Number(e.target.value) } })} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Ciudades principales (separadas por coma)
            <input className="field mt-1" value={sh.localCities.join(", ")} onChange={(e) => setDraft({ ...draft, shipping: { ...sh, localCities: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) } })} />
          </label>
        </div>
      </div>

      <div className="border border-neutral-200 bg-white p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider">Pasarelas de pago habilitadas</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(["wompi", "payu", "bold", "paypal"] as const).map((p) => (
            <Toggle key={p} checked={draft.payments[p]} onChange={(v) => setDraft({ ...draft, payments: { ...draft.payments, [p]: v } })} label={p === "paypal" ? "PayPal (internacional)" : p.charAt(0).toUpperCase() + p.slice(1)} />
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-500">Modo sandbox: las pasarelas simulan la aprobación. Conecta tus llaves de producción de Wompi/PayU/Bold/PayPal para cobros reales.</p>
      </div>

      <button onClick={() => save(["branding", "whatsapp", "cod", "shipping", "payments", "storeLocation"])} disabled={busy} className="btn-dark flex items-center gap-2 px-8 py-3.5 text-xs">
        <Save className="h-4 w-4" /> {busy ? "Guardando…" : "Guardar ajustes"}
      </button>
    </div>
  );
}