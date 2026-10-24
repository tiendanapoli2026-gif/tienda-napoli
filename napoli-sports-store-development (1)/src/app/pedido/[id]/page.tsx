"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Banknote, CheckCircle2, CreditCard, MessageCircle, Package, Truck } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import type { orders } from "@/db/schema";

type Order = typeof orders.$inferSelect & { whatsappUrl: string };

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Order) => setOrder(data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <h1 className="font-display text-4xl font-bold uppercase">Pedido no encontrado</h1>
        <Link href="/" className="btn-dark mt-6 inline-block px-10 py-3.5 text-sm">Volver a la tienda</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="py-32 text-center font-display text-2xl font-bold uppercase text-neutral-400">Cargando pedido…</div>;
  }

  const isCod = order.paymentMethod === "cod";

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 anim-pop">
          <CheckCircle2 className="h-11 w-11 text-green-600" />
        </span>
        <h1 className="mt-5 font-display text-5xl font-bold uppercase">¡Pedido confirmado!</h1>
        <p className="mt-2 text-neutral-600">
          Gracias, <strong>{order.customer.name}</strong>. Tu pedido <span className="border border-neutral-950 bg-neutral-50 px-2 py-0.5 font-bold">{order.number}</span> fue registrado.
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {isCod ? "Pagarás en efectivo al recibir tu pedido." : "Tu pago en línea fue aprobado exitosamente."}
        </p>
      </div>

      {/* WhatsApp — notificación automática servidor → tienda */}
      <div className="mt-8 border-2 border-[#25D366] bg-[#25D366]/5 p-5 text-center">
        {order.waStatus === "enviado" ? (
          <>
            <p className="flex items-center justify-center gap-2 font-display text-xl font-bold uppercase text-[#128C4B]">
              <CheckCircle2 className="h-5 w-5" /> La tienda ya fue notificada por WhatsApp
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Recibimos tu pedido al instante. <strong>Te llamaremos o escribiremos al {order.customer.phone}</strong> para confirmarlo. No tienes que hacer nada más. 📞
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center justify-center gap-2 font-display text-xl font-bold uppercase text-[#128C4B]">
              <MessageCircle className="h-5 w-5" /> Confirma tu pedido por WhatsApp
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Envíanos el resumen con un clic y te llamaremos para confirmar la entrega:
            </p>
            <a
              href={order.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-[#25D366] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" /> Enviar resumen por WhatsApp
            </a>
          </>
        )}
      </div>

      {/* Detalle */}
      <div className="mt-8 border border-neutral-200">
        <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 font-display text-lg font-bold uppercase tracking-wider">
          Detalle del pedido
        </div>
        <div className="divide-y divide-neutral-100 px-5">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt="" className="h-16 w-14 object-cover" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-neutral-500">Talla {i.size} · Cantidad {i.qty}</p>
              </div>
              <span className="text-sm font-bold">{formatCOP(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <dl className="space-y-1.5 border-t border-neutral-200 bg-neutral-50 px-5 py-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal productos</dt><dd className="font-semibold">{formatCOP(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Envío ({order.shippingZone})</dt><dd className="font-semibold">{order.shippingCost === 0 ? "GRATIS" : formatCOP(order.shippingCost)}</dd></div>
          {order.codFee > 0 && <div className="flex justify-between"><dt>Recargo contra entrega</dt><dd className="font-semibold">{formatCOP(order.codFee)}</dd></div>}
          {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Descuento {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>-{formatCOP(order.discount)}</dd></div>}
          <div className="flex items-baseline justify-between border-t border-neutral-300 pt-2">
            <dt className="font-display text-lg font-bold uppercase">Total {isCod ? "a pagar al recibir" : "pagado"}</dt>
            <dd className="font-display text-3xl font-bold">{formatCOP(order.total)}</dd>
          </div>
          <div className="flex items-center gap-2 pt-2 text-xs text-neutral-600">
            {isCod ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            Método: <strong className="uppercase">{order.paymentMethod}</strong> · Estado: <strong className="uppercase">{order.paymentStatus}</strong>
          </div>
        </dl>
      </div>

      {/* Timeline */}
      <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { icon: CheckCircle2, label: "Confirmado", active: true },
          { icon: Package, label: "En preparación", active: order.status !== "pendiente" },
          { icon: Truck, label: "En camino", active: ["enviado", "entregado"].includes(order.status) },
        ].map((s) => (
          <div key={s.label} className={`flex flex-col items-center gap-1.5 border p-4 ${s.active ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-400"}`}>
            <s.icon className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/categoria/todos" className="btn-dark px-8 py-3.5 text-sm">Seguir comprando</Link>
        <Link href="/cuenta" className="border-2 border-neutral-950 px-8 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-neutral-950 hover:text-white">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}