"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote, Check, ChevronLeft, CreditCard, Globe, Landmark, Loader2,
  Lock, MapPin, ShieldCheck, ShoppingBag, Smartphone, Tag, Truck, User,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";
import { COLOMBIA } from "@/data/colombia";

type Quote = { cost: number; zone: string; label: string; free: boolean; codEnabled: boolean; codFee: number; freeThreshold: number };
type CouponState = { valid: boolean; code?: string; percent?: number; reason?: string } | null;

const STEP_LABELS = ["Tus datos", "Envío", "Pago"];

export default function CheckoutPage() {
  const { items, subtotal, clearCart, settings, toast } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "Bogotá", department: "Bogotá D.C.", country: "Colombia", otherCountry: "", notes: "",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [method, setMethod] = useState("wompi");
  const [subMethod, setSubMethod] = useState("pse");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponState>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const isColombia = form.country === "Colombia";
  const effectiveCountry = isColombia ? "Colombia" : form.otherCountry || "Internacional";
  const isCod = method === "cod";

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((me) => {
      if (me.authenticated && me.role === "user") {
        setForm((f) => ({ ...f, name: me.name || f.name, email: me.email || f.email, phone: me.phone || f.phone }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: effectiveCountry, city: form.city, subtotal }),
        });
        const q: Quote = await res.json();
        setQuote(q);
        if (method === "cod" && !q.codEnabled) setMethod("wompi");
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [effectiveCountry, form.city, subtotal, method]);

  // Si el administrador desactivó las pasarelas en línea, seleccionar contra entrega automáticamente
  useEffect(() => {
    if (!settings || method === "cod") return;
    const gatewayOn = settings.payments[method as keyof typeof settings.payments];
    if (!gatewayOn && quote?.codEnabled) setMethod("cod");
  }, [settings, method, quote]);

  const cities = useMemo(
    () => COLOMBIA.find((d) => d.departamento === form.department)?.ciudades ?? [],
    [form.department]
  );

  const discount = useMemo(
    () => (coupon?.valid && coupon.percent ? Math.round((subtotal * coupon.percent) / 100) : 0),
    [coupon, subtotal]
  );
  const shipping = quote?.cost ?? 0;
  const codFee = isCod && quote?.codEnabled ? quote.codFee : 0;
  const total = subtotal + shipping + codFee - discount;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(couponInput)}`);
      const data = await res.json();
      setCoupon(data);
      if (data.valid) toast(`Cupón ${data.code} aplicado: -${data.percent}%`);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const validStep0 = form.name.trim().length > 2 && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length >= 7;
  const validStep1 = form.address.trim().length > 4 && form.city.trim().length > 2 && (isColombia || form.otherCountry.trim().length > 2);

  const pay = async () => {
    setProcessing(true);
    setError("");
    // Pasarela en modo sandbox: simula la autorización del pago (Wompi / PayU / Bold / PayPal)
    if (!isCod) await new Promise((r) => setTimeout(r, 2000));
    try {
      const paymentId = isCod ? "cod" : subMethod ? `${method}:${subMethod}` : method;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name, email: form.email, phone: form.phone, address: form.address,
            city: form.city, department: isColombia ? form.department : "", country: effectiveCountry, notes: form.notes,
          },
          items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
          paymentMethod: paymentId,
          couponCode: coupon?.valid ? coupon.code : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el pedido");
      clearCart();
      router.push(`/pedido/${data.number}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setProcessing(false);
    }
  };

  if (items.length === 0 && !processing) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-28 text-center">
        <ShoppingBag className="h-16 w-16 text-neutral-300" />
        <h1 className="font-display text-4xl font-bold uppercase">Tu carrito está vacío</h1>
        <p className="text-sm text-neutral-500">Agrega productos antes de finalizar la compra.</p>
        <Link href="/categoria/todos" className="btn-dark px-10 py-3.5 text-sm">Ir a la tienda</Link>
      </div>
    );
  }

  const gateways = [
    { id: "wompi", label: "Wompi", desc: "PSE · Nequi · Daviplata · Tarjetas", icon: Landmark, enabled: settings?.payments.wompi !== false,
      subs: [{ id: "pse", label: "PSE", icon: Landmark }, { id: "nequi", label: "Nequi", icon: Smartphone }, { id: "daviplata", label: "Daviplata", icon: Smartphone }, { id: "tarjeta", label: "Tarjeta", icon: CreditCard }] },
    { id: "payu", label: "PayU", desc: "Tarjetas crédito/débito y PSE", icon: CreditCard, enabled: settings?.payments.payu !== false,
      subs: [{ id: "tarjeta", label: "Tarjeta", icon: CreditCard }, { id: "pse", label: "PSE", icon: Landmark }] },
    { id: "bold", label: "Bold", desc: "Tarjetas y llaves bancarias", icon: ShieldCheck, enabled: settings?.payments.bold !== false,
      subs: [{ id: "tarjeta", label: "Tarjeta", icon: CreditCard }, { id: "llave", label: "Llave bancaria", icon: Landmark }] },
    { id: "paypal", label: "PayPal", desc: "Pago internacional en USD", icon: Globe, enabled: settings?.payments.paypal !== false,
      subs: [{ id: "paypal", label: "Cuenta PayPal", icon: Globe }] },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="font-display text-5xl font-bold uppercase">Finalizar compra</h1>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2 sm:gap-4">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 ${i <= step ? "" : "opacity-40"}`}
            >
              <span className={`flex h-8 w-8 items-center justify-center font-display text-base font-bold ${i < step ? "bg-green-600 text-white" : i === step ? "bg-neutral-950 text-white" : "border-2 border-neutral-300"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="hidden font-display text-lg font-bold uppercase tracking-wider sm:block">{label}</span>
            </button>
            {i < 2 && <span className="h-0.5 w-8 bg-neutral-200 sm:w-16" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          {/* PASO 1: DATOS */}
          {step === 0 && (
            <section className="anim-fade-in">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><User className="h-5 w-5" /> Tus datos</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold sm:col-span-2">Nombre completo *
                  <input className="field mt-1" value={form.name} onChange={set("name")} placeholder="Ej: Laura Gómez" />
                </label>
                <label className="block text-sm font-semibold">Correo electrónico *
                  <input type="email" className="field mt-1" value={form.email} onChange={set("email")} placeholder="tu@correo.com" />
                </label>
                <label className="block text-sm font-semibold">Celular / WhatsApp *
                  <input className="field mt-1" value={form.phone} onChange={set("phone")} placeholder="300 123 4567" />
                </label>
              </div>
              <p className="mt-3 text-xs text-neutral-500">Usaremos tu celular para enviarte la confirmación del pedido por WhatsApp.</p>
              <button disabled={!validStep0} onClick={() => setStep(1)} className="btn-dark mt-6 px-10 py-3.5 text-sm">
                Continuar al envío →
              </button>
            </section>
          )}

          {/* PASO 2: ENVÍO */}
          {step === 1 && (
            <section className="anim-fade-in">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><MapPin className="h-5 w-5" /> Dirección de envío</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">País *
                  <select className="field mt-1" value={form.country} onChange={set("country")}>
                    <option>Colombia</option>
                    <option>Internacional</option>
                  </select>
                </label>
                {isColombia ? (
                  <label className="block text-sm font-semibold">Departamento * <span className="font-normal text-neutral-400">({COLOMBIA.length})</span>
                    <select
                      className="field mt-1"
                      value={form.department}
                      onChange={(e) => {
                        const dep = e.target.value;
                        const first = COLOMBIA.find((d) => d.departamento === dep)?.ciudades[0] ?? "";
                        setForm((f) => ({ ...f, department: dep, city: first }));
                      }}
                    >
                      {COLOMBIA.map((d) => <option key={d.departamento}>{d.departamento}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="block text-sm font-semibold">Escribe tu país *
                    <input className="field mt-1" value={form.otherCountry} onChange={set("otherCountry")} placeholder="Ej: México, España, USA…" />
                  </label>
                )}
                {isColombia ? (
                  <label className="block text-sm font-semibold">Ciudad / Municipio * <span className="font-normal text-neutral-400">({cities.length} en {form.department})</span>
                    <select className="field mt-1" value={form.city} onChange={set("city")}>
                      {cities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="block text-sm font-semibold">Ciudad *
                    <input className="field mt-1" value={form.city} onChange={set("city")} placeholder="Tu ciudad" />
                  </label>
                )}
                <label className="block text-sm font-semibold">Dirección completa *
                  <input className="field mt-1" value={form.address} onChange={set("address")} placeholder="Calle, número, barrio, apto…" />
                </label>
                <label className="block text-sm font-semibold sm:col-span-2">Indicaciones adicionales
                  <textarea className="field mt-1" rows={2} value={form.notes} onChange={set("notes")} placeholder="Ej: portería, horario de entrega…" />
                </label>
              </div>
              {quote && (
                <div className="mt-5 flex items-start gap-3 border border-neutral-200 bg-neutral-50 p-4">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">{quote.label}</p>
                    <p className="text-neutral-600">Costo: <strong>{quote.cost === 0 ? "GRATIS 🎉" : formatCOP(quote.cost)}</strong>
                      {!quote.free && quote.zone !== "internacional" && <> · Gratis desde {formatCOP(quote.freeThreshold)}</>}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(0)} className="flex items-center gap-1 border-2 border-neutral-300 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:border-neutral-950">
                  <ChevronLeft className="h-4 w-4" /> Volver
                </button>
                <button disabled={!validStep1} onClick={() => setStep(2)} className="btn-dark px-10 py-3.5 text-sm">
                  Continuar al pago →
                </button>
              </div>
            </section>
          )}

          {/* PASO 3: PAGO */}
          {step === 2 && (
            <section className="anim-fade-in">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><CreditCard className="h-5 w-5" /> Método de pago</h2>
              <div className="mt-4 space-y-3">
                {gateways.filter((g) => g.enabled).map((g) => (
                  <div key={g.id} className={`border-2 transition-colors ${method === g.id ? "border-neutral-950" : "border-neutral-200"}`}>
                    <button onClick={() => { setMethod(g.id); setSubMethod(g.subs[0].id); }} className="flex w-full items-center gap-4 p-4 text-left">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${method === g.id ? "border-neutral-950" : "border-neutral-300"}`}>
                        {method === g.id && <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />}
                      </span>
                      <g.icon className="h-6 w-6" />
                      <span>
                        <span className="block font-display text-lg font-bold uppercase tracking-wider">{g.label}</span>
                        <span className="block text-xs text-neutral-500">{g.desc}</span>
                      </span>
                    </button>
                    {method === g.id && (
                      <div className="flex flex-wrap gap-2 border-t border-neutral-100 bg-neutral-50 p-3 anim-fade-in">
                        {g.subs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSubMethod(sub.id)}
                            className={`flex items-center gap-1.5 border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${subMethod === sub.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white hover:border-neutral-950"}`}
                          >
                            <sub.icon className="h-3.5 w-3.5" /> {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {quote?.codEnabled && (
                  <div className={`border-2 transition-colors ${method === "cod" ? "border-neutral-950" : "border-neutral-200"}`}>
                    <button onClick={() => setMethod("cod")} className="flex w-full items-center gap-4 p-4 text-left">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${method === "cod" ? "border-neutral-950" : "border-neutral-300"}`}>
                        {method === "cod" && <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />}
                      </span>
                      <Banknote className="h-6 w-6 text-green-700" />
                      <span>
                        <span className="block font-display text-lg font-bold uppercase tracking-wider">Pago contra entrega</span>
                        <span className="block text-xs text-neutral-500">Paga en efectivo al recibir · Recargo {formatCOP(quote.codFee)}</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
                <Lock className="h-3.5 w-3.5" /> Pasarela en modo sandbox de demostración — conexión SSL encriptada. Ningún cargo real será realizado.
              </p>
              {error && <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 border-2 border-neutral-300 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:border-neutral-950">
                  <ChevronLeft className="h-4 w-4" /> Volver
                </button>
                <button onClick={pay} disabled={processing} className="btn-dark flex flex-1 items-center justify-center gap-2 py-4 text-base">
                  {isCod ? <><Banknote className="h-5 w-5" /> Confirmar pedido · {formatCOP(total)}</> : <><Lock className="h-5 w-5" /> Pagar {formatCOP(total)}</>}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* RESUMEN */}
        <aside className="h-fit border border-neutral-200 bg-neutral-50 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold uppercase tracking-wider">Resumen del pedido</h2>
          <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={`${i.productId}-${i.size}`} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" className="h-14 w-12 object-cover" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold leading-snug">{i.name}</p>
                  <p className="text-neutral-500">Talla {i.size} × {i.qty}</p>
                </div>
                <span className="text-xs font-bold">{formatCOP(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                className="field pl-9 uppercase"
                placeholder="Cupón de descuento"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
            </div>
            <button onClick={applyCoupon} disabled={checkingCoupon} className="border-2 border-neutral-950 px-4 text-xs font-bold uppercase tracking-wider hover:bg-neutral-950 hover:text-white disabled:opacity-50">
              {checkingCoupon ? "…" : "Aplicar"}
            </button>
          </div>
          {coupon && !coupon.valid && <p className="mt-2 text-xs font-semibold text-red-600">{coupon.reason}</p>}
          {coupon?.valid && <p className="mt-2 text-xs font-bold text-green-700">✓ Cupón {coupon.code}: -{coupon.percent}%</p>}

          <dl className="mt-4 space-y-1.5 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal productos</dt><dd className="font-semibold">{formatCOP(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Envío ({quote?.zone || "—"})</dt><dd className="font-semibold">{shipping === 0 ? "GRATIS" : formatCOP(shipping)}</dd></div>
            {codFee > 0 && <div className="flex justify-between"><dt>Recargo contra entrega</dt><dd className="font-semibold">{formatCOP(codFee)}</dd></div>}
            {discount > 0 && <div className="flex justify-between text-green-700"><dt>Descuento</dt><dd className="font-semibold">-{formatCOP(discount)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-neutral-300 pt-3">
              <dt className="font-display text-lg font-bold uppercase">Total</dt>
              <dd className="font-display text-3xl font-bold">{formatCOP(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-green-600" /> Compra protegida con certificado SSL
          </p>
        </aside>
      </div>

      {/* OVERLAY PASARELA */}
      {processing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/80 anim-fade-in">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 bg-white p-10 text-center anim-pop">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="font-display text-2xl font-bold uppercase">
              {isCod ? "Registrando tu pedido…" : "Procesando pago seguro…"}
            </p>
            <p className="text-xs text-neutral-500">
              {isCod ? "Estamos notificando a la tienda por WhatsApp." : `Conectando con ${method.toUpperCase()} · No cierres esta ventana.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}