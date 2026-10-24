export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Devuelve negro o blanco según el brillo del color de fondo (para texto legible). */
export function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return "#ffffff";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0a0a0a" : "#ffffff";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function effectivePrice(p: { price: number; salePrice: number | null }): number {
  return p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function discountPercent(p: { price: number; salePrice: number | null }): number {
  if (!p.salePrice || p.salePrice >= p.price) return 0;
  return Math.round((1 - p.salePrice / p.price) * 100);
}

export const CATEGORIES = [
  { slug: "mujer", label: "Mujer" },
  { slug: "hombre", label: "Hombre" },
  { slug: "ninos", label: "Niños" },
  { slug: "tendencias", label: "Tendencias" },
  { slug: "deportes", label: "Deportes" },
  { slug: "ofertas", label: "Ofertas" },
];

export const COLOMBIA_DEPARTMENTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bogotá D.C.","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada",
];