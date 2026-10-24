import { db } from "@/db";
import { settings } from "@/db/schema";

export type WhatsAppNotify = {
  enabled: boolean;
  provider: "callmebot" | "cloud";
  callmebotApiKey: string;
  cloudPhoneId: string;
  cloudToken: string;
};

export type HeroSlide = {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  accent: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
};

export type SiteSettings = {
  branding: { logoUrl: string; name: string; tagline: string };
  heroSlides: HeroSlide[];
  marquee: { enabled: boolean; speed: number; messages: string[] };
  bottomMarquee: { enabled: boolean; mode: "colors" | "text" | "both"; text: string; colors: string[]; speed: number };
  whatsapp: { number: string; greeting: string; notify: WhatsAppNotify };
  storeLocation: { enabled: boolean; address: string; city: string; hours: string; mapQuery: string };
  cod: { enabled: boolean; fee: number };
  shipping: {
    freeThreshold: number;
    local: number;
    national: number;
    international: number;
    localCities: string[];
  };
  banners: { image: string; title: string; subtitle: string; cta: string; link: string; active: boolean }[];
  newUserCoupon: { enabled: boolean; code: string; percent: number };
  payments: { wompi: boolean; payu: boolean; bold: boolean; paypal: boolean };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  branding: { logoUrl: "", name: "Napoli", tagline: "Tienda deportiva" },
  heroSlides: [
    {
      image: "/images/hero.jpg",
      tag: "Temporada 25/26 · Nueva colección",
      title: "Imposible es nada",
      subtitle: "Camisetas, tenis y equipamiento con el ADN del barrio. Envíos a toda Colombia y pago contra entrega.",
      accent: "#dc2626",
      ctaText: "Comprar hombre",
      ctaLink: "/categoria/hombre",
      active: true,
    },
    {
      image: "/images/hero-blue.jpg",
      tag: "Running · Serie Velocity",
      title: "Domina cada ruta",
      subtitle: "Amortiguación de retorno de energía para tus kilómetros. Tenis desde $279.900 con envío gratis.",
      accent: "#38bdf8",
      ctaText: "Ver tenis",
      ctaLink: "/categoria/todos?q=tenis",
      active: true,
    },
    {
      image: "/images/hero-red.jpg",
      tag: "Fútbol · Edición Napoli",
      title: "Sangre de campeones",
      subtitle: "La nueva piel del barrio ya está aquí. Camisetas local y visitante temporada 25/26.",
      accent: "#ef4444",
      ctaText: "Ver camisetas",
      ctaLink: "/categoria/todos?q=camiseta",
      active: true,
    },
    {
      image: "/images/hero-green.jpg",
      tag: "Training · Alto rendimiento",
      title: "Entrena sin excusas",
      subtitle: "Tops, leggings y pantalonetas que se mueven contigo. Paga contra entrega en toda Colombia.",
      accent: "#4ade80",
      ctaText: "Ver training",
      ctaLink: "/categoria/todos?q=training",
      active: true,
    },
    {
      image: "/images/hero-gold.jpg",
      tag: "Mujer · Colección Sprint",
      title: "Nacida para ganar",
      subtitle: "La colección femenina que combina potencia y estilo. Hasta 40% OFF en referencias seleccionadas.",
      accent: "#facc15",
      ctaText: "Comprar mujer",
      ctaLink: "/categoria/mujer",
      active: true,
    },
  ],
  marquee: {
    enabled: true,
    speed: 28,
    messages: [
      "HASTA 40% OFF EN REFERENCIAS SELECCIONADAS",
      "ENVÍO GRATIS POR COMPRAS SUPERIORES A $250.000",
      "PAGA CON PSE, NEQUI, DAVIPLATA O TARJETA",
      "PAGO CONTRA ENTREGA DISPONIBLE EN COLOMBIA",
    ],
  },
  bottomMarquee: {
    enabled: true,
    mode: "both",
    text: "Tienda deportiva Napoli",
    colors: ["#009246", "#ffffff", "#ce2b37"],
    speed: 20,
  },
  whatsapp: {
    number: "573001112233",
    greeting: "¡Hola Tienda deportiva Napoli! Quiero más información.",
    notify: { enabled: false, provider: "callmebot", callmebotApiKey: "", cloudPhoneId: "", cloudToken: "" },
  },
  storeLocation: {
    enabled: true,
    address: "Calle 53 # 24-15, Barrio Galerías",
    city: "Bogotá D.C., Colombia",
    hours: "Lunes a sábado: 9:00 a.m. – 7:00 p.m. · Domingos y festivos: 10:00 a.m. – 4:00 p.m.",
    mapQuery: "Calle 53 #24-15, Bogotá, Colombia",
  },
  cod: { enabled: true, fee: 5000 },
  shipping: {
    freeThreshold: 250000,
    local: 8000,
    national: 14000,
    international: 85000,
    localCities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga"],
  },
  banners: [
    {
      image: "https://images.pexels.com/photos/30612723/pexels-photo-30612723.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      title: "TEMPORADA 25/26",
      subtitle: "La nueva piel del barrio. Edición limitada Napoli.",
      cta: "Comprar camisetas",
      link: "/categoria/hombre",
      active: true,
    },
  ],
  newUserCoupon: { enabled: true, code: "NAPOLI10", percent: 10 },
  payments: { wompi: true, payu: true, bold: true, paypal: true },
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(settings);
    const merged: SiteSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    for (const row of rows) {
      if (!(row.key in merged)) continue;
      const stored = row.value;
      const def = (merged as unknown as Record<string, unknown>)[row.key];
      // Merge superficial para no perder campos nuevos al evolucionar la configuración
      if (def && typeof def === "object" && !Array.isArray(def) && stored && typeof stored === "object" && !Array.isArray(stored)) {
        (merged as unknown as Record<string, unknown>)[row.key] = { ...def, ...(stored as object) };
      } else {
        (merged as unknown as Record<string, unknown>)[row.key] = stored;
      }
    }
    // Merge del bloque anidado de notificaciones
    const storedWa = rows.find((r) => r.key === "whatsapp")?.value as { notify?: Partial<WhatsAppNotify> } | undefined;
    merged.whatsapp.notify = { ...DEFAULT_SETTINGS.whatsapp.notify, ...(storedWa?.notify || {}) };
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting(key: string, value: unknown) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export function computeShipping(
  s: SiteSettings,
  country: string,
  city: string,
  subtotal: number
): { cost: number; zone: string; label: string; free: boolean } {
  const isColombia = country.trim().toLowerCase() === "colombia";
  if (!isColombia) {
    return { cost: s.shipping.international, zone: "internacional", label: "Envío internacional (5–10 días hábiles)", free: false };
  }
  const isLocal = s.shipping.localCities.some((c) => c.toLowerCase() === city.trim().toLowerCase());
  const free = subtotal >= s.shipping.freeThreshold;
  if (isLocal) {
    return {
      cost: free ? 0 : s.shipping.local,
      zone: "local",
      label: "Envío ciudad principal (1–2 días hábiles)",
      free,
    };
  }
  return {
    cost: free ? 0 : s.shipping.national,
    zone: "nacional",
    label: "Envío nacional (2–5 días hábiles)",
    free,
  };
}