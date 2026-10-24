"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Pause } from "lucide-react";
import { useStore } from "@/lib/store";
import type { HeroSlide } from "@/lib/settings";

const INTERVAL = 10000; // 10 segundos por diapositiva

export default function HeroCarousel({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const { settings } = useStore();
  const source = settings?.heroSlides?.length ? settings.heroSlides : initialSlides;
  const slides = source.filter((s) => s.active && s.image);
  const list = slides.length ? slides : initialSlides.slice(0, 1);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const safeIndex = Math.min(index, list.length - 1);
  const slide = list[safeIndex];

  const go = useCallback(
    (dir: number) => setIndex((i) => (Math.min(i, list.length - 1) + dir + list.length) % list.length),
    [list.length]
  );

  // Cambio automático cada 10 s — se reinicia tras navegación manual
  useEffect(() => {
    if (paused || list.length < 2) return;
    const t = setInterval(() => go(1), INTERVAL);
    return () => clearInterval(t);
  }, [paused, safeIndex, list.length, go]);

  if (!slide) return null;

  return (
    <section
      className="group/car relative overflow-hidden bg-neutral-950 text-white"
      aria-roledescription="carrusel"
      aria-label="Banner principal de la tienda"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const delta = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
        }
        touchX.current = null;
        setPaused(false);
      }}
    >
      {/* Capas de imagen con crossfade + zoom lento (Ken Burns) */}
      {list.map((s, i) => (
        <div
          key={`${s.image}-${i}`}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === safeIndex ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== safeIndex}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className="h-full w-full object-cover object-right opacity-80 transition-transform ease-linear"
            style={{
              transform: i === safeIndex ? "scale(1.08)" : "scale(1)",
              transitionDuration: i === safeIndex ? `${INTERVAL + 1500}ms` : "1200ms",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
          {/* Acento de color sutil por diapositiva */}
          <div
            className="absolute inset-x-0 bottom-0 h-1 transition-colors duration-1000"
            style={{ backgroundColor: i === safeIndex ? s.accent : "transparent" }}
          />
        </div>
      ))}

      {/* Contenido */}
      <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20 lg:px-8">
        <div key={safeIndex}>
          <p className="hero-text-in flex items-center gap-2 text-xs font-bold uppercase tracking-[0.35em] text-neutral-400">
            <Sparkles className="h-4 w-4" style={{ color: slide.accent }} /> {slide.tag}
          </p>
          <h1 className="display-tight hero-text-in hero-text-in-1 mt-5 max-w-3xl font-display text-7xl font-bold uppercase sm:text-8xl lg:text-[9rem]">
            {slide.title}
            <span style={{ color: slide.accent }}>.</span>
          </h1>
          <p className="hero-text-in hero-text-in-2 mt-6 max-w-md text-base leading-relaxed text-neutral-300">
            {slide.subtitle}
          </p>
          <div className="hero-text-in hero-text-in-3 mt-9 flex flex-wrap gap-3">
            <Link
              href={slide.ctaLink || "/categoria/todos"}
              className="group flex items-center gap-3 bg-white px-8 py-4 font-display text-lg font-bold uppercase tracking-widest text-neutral-950 transition-colors hover:bg-neutral-200"
            >
              {slide.ctaText || "Comprar ahora"} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/categoria/ofertas"
              className="group flex items-center gap-3 border-2 border-white px-8 py-4 font-display text-lg font-bold uppercase tracking-widest transition-colors hover:bg-white hover:text-neutral-950"
            >
              Ver ofertas <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="hero-text-in hero-text-in-4 mt-14 flex flex-wrap gap-x-10 gap-y-2 font-display text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
          <span>Fútbol</span><span>Running</span><span>Training</span><span>Urbano</span>
        </div>
      </div>

      {/* Flechas */}
      {list.length > 1 && (
        <>
          <button
            aria-label="Diapositiva anterior"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-neutral-950/40 text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-neutral-950 sm:opacity-0 sm:group-hover/car:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label="Diapositiva siguiente"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-neutral-950/40 text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-neutral-950 sm:opacity-0 sm:group-hover/car:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Controles inferiores: indicadores con progreso + contador */}
      {list.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 pb-6 lg:px-8">
            <div className="flex items-center gap-2" role="tablist" aria-label="Elegir diapositiva">
              {list.map((s, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === safeIndex}
                  aria-label={`Ir a la diapositiva ${i + 1}: ${s.title}`}
                  onClick={() => setIndex(i)}
                  className="group/dot relative h-4 w-10 overflow-hidden sm:w-14"
                >
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white/25 transition-colors group-hover/dot:bg-white/50" />
                  {i === safeIndex && (
                    <span
                      key={`fill-${safeIndex}`}
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2"
                      style={{
                        backgroundColor: s.accent,
                        animation: `progress-fill ${INTERVAL}ms linear both`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              ))}
              {paused && (
                <span className="ml-2 hidden items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/60 sm:flex">
                  <Pause className="h-3 w-3" /> Pausado
                </span>
              )}
            </div>
            <p className="font-display text-lg font-bold tracking-[0.3em] text-white/70">
              {String(safeIndex + 1).padStart(2, "0")} <span className="text-white/30">/ {String(list.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}