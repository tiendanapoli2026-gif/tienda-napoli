"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, MessageCircle, Minus, Plus, Ruler, ShoppingBag, Truck, RotateCcw, ShieldCheck, ZoomIn } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCOP, discountPercent, effectivePrice } from "@/lib/utils";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;

const CAT_LABEL: Record<string, string> = { mujer: "Mujer", hombre: "Hombre", ninos: "Niños", deportes: "Deportes" };

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem, setCartOpen, favorites, toggleFavorite, toast, settings } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [openSection, setOpenSection] = useState<string | null>("desc");
  const imgRef = useRef<HTMLDivElement>(null);

  const off = discountPercent(product);
  const price = effectivePrice(product);
  const isFav = favorites.includes(product.id);
  const selectedVariant = product.sizes.find((s) => s.size === size);
  const maxQty = selectedVariant?.stock ?? 1;
  const totalStock = product.sizes.reduce((a, s) => a + s.stock, 0);
  const images = product.images.length ? product.images : ["/images/hero.jpg"];

  const handleMove = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const addToCart = () => {
    if (!size || !selectedVariant) {
      setSizeError(true);
      toast("Selecciona una talla disponible");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: images[0],
      size,
      price,
      qty,
      stock: selectedVariant.stock,
    });
    toast(`${product.name} (talla ${size}) agregado al carrito`);
    setCartOpen(true);
  };

  const waNumber = settings?.whatsapp.number?.replace(/\D/g, "") || "573001112233";

  const sections = [
    { id: "desc", title: "Descripción", icon: null, content: <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{product.description}</p> },
    {
      id: "envios",
      title: "Envíos y pagos",
      icon: <Truck className="h-4 w-4" />,
      content: (
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>🚚 Envío GRATIS en Colombia por compras superiores a {formatCOP(settings?.shipping.freeThreshold ?? 250000)}.</li>
          <li>🏙️ Ciudades principales: 1–2 días hábiles. Resto del país: 2–5 días.</li>
          <li>🌎 Envíos internacionales: 5–10 días hábiles.</li>
          <li>💳 Paga con PSE, Nequi, Daviplata, tarjeta crédito/débito o PayPal.</li>
          {settings?.cod.enabled && <li>💵 Pago contra entrega disponible en Colombia (+{formatCOP(settings.cod.fee)}).</li>}
        </ul>
      ),
    },
    {
      id: "cambios",
      title: "Cambios y garantía",
      icon: <RotateCcw className="h-4 w-4" />,
      content: <p className="text-sm leading-relaxed text-neutral-600">Tienes 30 días para cambiar tu talla o producto sin costo. Garantía de 90 días por defectos de fabricación. Escríbenos por WhatsApp y lo resolvemos de inmediato.</p>,
    },
  ];

  return (
    <div>
      <nav className="text-xs text-neutral-500" aria-label="Miga de pan">
        <Link href="/" className="hover:text-neutral-950">Inicio</Link> /{" "}
        <Link href={`/categoria/${product.category}`} className="hover:text-neutral-950">{CAT_LABEL[product.category]}</Link> /{" "}
        <span className="font-semibold text-neutral-950">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-10 lg:grid-cols-2">
        {/* GALERÍA */}
        <div>
          <div
            ref={imgRef}
            className="zoom-lens relative aspect-[4/5] overflow-hidden bg-neutral-100"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMove}
            onClick={() => setZoom((z) => !z)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImg]}
              alt={`${product.name} — foto ${activeImg + 1}`}
              className="h-full w-full object-cover"
              style={{ transform: zoom ? "scale(2)" : "scale(1)", transformOrigin: origin }}
            />
            {off > 0 && (
              <span className="absolute left-4 top-4 bg-red-600 px-2.5 py-1 font-display text-base font-bold tracking-wider text-white">-{off}%</span>
            )}
            <span className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 px-3 py-1.5 text-xs font-semibold">
              <ZoomIn className="h-4 w-4" /> {zoom ? "Clic para alejar" : "Pasa el cursor para zoom"}
            </span>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-24 w-20 overflow-hidden border-2 transition-colors ${i === activeImg ? "border-neutral-950" : "border-transparent hover:border-neutral-300"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
            {CAT_LABEL[product.category]} · {product.sport}
          </p>
          <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className={`text-2xl font-extrabold ${off ? "text-red-600" : ""}`}>{formatCOP(price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-neutral-400 line-through">{formatCOP(product.price)}</span>
                <span className="bg-red-600 px-2 py-0.5 text-xs font-bold text-white">AHORRA {formatCOP(product.price - price)}</span>
              </>
            )}
          </div>

          {/* TALLAS */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold uppercase tracking-wider">
                Selecciona tu talla {size && <span className="ml-1 text-neutral-500">— {size}</span>}
              </p>
              <span className="flex items-center gap-1 text-xs text-neutral-500"><Ruler className="h-4 w-4" /> Las tachadas están agotadas</span>
            </div>
            <div className={`mt-3 flex flex-wrap gap-2 ${sizeError && !size ? "anim-pop" : ""}`}>
              {product.sizes.map((v) => {
                const soldOut = v.stock <= 0;
                const selected = size === v.size;
                return (
                  <button
                    key={v.size}
                    disabled={soldOut}
                    onClick={() => { setSize(v.size); setSizeError(false); setQty(1); }}
                    aria-label={soldOut ? `Talla ${v.size} agotada` : `Talla ${v.size}`}
                    className={`min-w-14 border-2 px-4 py-2.5 font-display text-lg font-bold uppercase transition-all ${
                      soldOut
                        ? "size-soldout border-neutral-200 bg-neutral-50"
                        : selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 hover:border-neutral-950"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
            {sizeError && !size && <p className="mt-2 text-xs font-bold text-red-600">⚠ Debes seleccionar una talla para continuar.</p>}
            {selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
              <p className="mt-2 text-xs font-bold text-orange-600">🔥 ¡Solo quedan {selectedVariant.stock} unidades en talla {size}!</p>
            )}
          </div>

          {/* CANTIDAD + AGREGAR */}
          <div className="mt-7 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border-2 border-neutral-300">
              <button aria-label="Restar" onClick={() => setQty((v) => Math.max(1, v - 1))} className="px-3.5 py-3 hover:bg-neutral-100">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button aria-label="Sumar" onClick={() => setQty((v) => Math.min(maxQty, v + 1))} className="px-3.5 py-3 hover:bg-neutral-100 disabled:opacity-30" disabled={qty >= maxQty}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={totalStock === 0}
              className="btn-dark flex flex-1 items-center justify-center gap-3 px-8 py-4 text-base"
            >
              <ShoppingBag className="h-5 w-5" /> {totalStock === 0 ? "Agotado" : "Agregar al carrito"}
            </button>
            <button
              aria-label="Favorito"
              onClick={() => { toggleFavorite(product.id); toast(isFav ? "Eliminado de favoritos" : "Guardado en favoritos ♥"); }}
              className="flex w-14 items-center justify-center border-2 border-neutral-300 transition-colors hover:border-neutral-950"
            >
              <Heart className={`h-5 w-5 ${isFav ? "fill-red-600 text-red-600" : ""}`} />
            </button>
          </div>

          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`¡Hola! Me interesa el producto "${product.name}" (${formatCOP(price)}). ¿Está disponible?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-[#25D366] py-3 text-sm font-bold text-[#128C4B] transition-colors hover:bg-[#25D366]/10"
          >
            <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
          </a>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Envío gratis desde {formatCOP(settings?.shipping.freeThreshold ?? 250000)}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Pago seguro SSL</span>
            <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4" /> Cambios por 30 días</span>
          </div>

          {/* ACORDEÓN */}
          <div className="mt-8 border-t border-neutral-200">
            {sections.map((s) => (
              <div key={s.id} className="border-b border-neutral-200">
                <button
                  onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-bold uppercase tracking-wider"
                  aria-expanded={openSection === s.id}
                >
                  <span className="flex items-center gap-2">{s.icon}{s.title}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === s.id ? "rotate-180" : ""}`} />
                </button>
                {openSection === s.id && <div className="pb-5 anim-fade-in">{s.content}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}