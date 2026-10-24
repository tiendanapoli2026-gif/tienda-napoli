import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, coupons, type OrderItem, type OrderCustomer } from "@/db/schema";
import { isAdmin, getSession } from "@/lib/auth";
import { getSettings, computeShipping } from "@/lib/settings";
import { formatCOP } from "@/lib/utils";
import { notifyStoreWhatsApp } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("mine") === "1") {
    const session = await getSession();
    if (!session || session.role !== "user" || !session.userId) return NextResponse.json([]);
    const rows = await db.select().from(orders).where(eq(orders.userId, session.userId)).orderBy(desc(orders.createdAt));
    return NextResponse.json(rows);
  }
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return NextResponse.json(rows);
}

// Vaciar TODOS los pedidos (solo administrador) — útil para limpiar pruebas
// antes de cargar la información real de la tienda.
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const deleted = await db.delete(orders).returning({ id: orders.id });
  return NextResponse.json({ ok: true, deleted: deleted.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const customer = body.customer as OrderCustomer;
  const requested = body.items as { productId: number; size: string; qty: number }[];
  const paymentMethod: string = body.paymentMethod || "wompi";
  const isCod = paymentMethod === "cod";

  if (!customer?.name || !customer.phone || !customer.address || !customer.city || !customer.country) {
    return NextResponse.json({ error: "Completa los datos de envío" }, { status: 400 });
  }
  if (!requested?.length) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const s = await getSettings();
  if (isCod && (!s.cod.enabled || customer.country.trim().toLowerCase() !== "colombia")) {
    return NextResponse.json({ error: "El pago contra entrega no está disponible" }, { status: 400 });
  }

  const ids = [...new Set(requested.map((i) => i.productId))];
  const rows = await db.select().from(products).where(inArray(products.id, ids));

  const items: OrderItem[] = [];
  for (const reqItem of requested) {
    const product = rows.find((p) => p.id === reqItem.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: "Un producto del carrito ya no está disponible" }, { status: 400 });
    }
    const variant = product.sizes.find((v) => v.size === reqItem.size);
    if (!variant || variant.stock < reqItem.qty) {
      return NextResponse.json({ error: `Stock insuficiente de ${product.name} (talla ${reqItem.size})` }, { status: 400 });
    }
    const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
    items.push({
      productId: product.id,
      name: product.name,
      size: reqItem.size,
      qty: reqItem.qty,
      price,
      image: product.images[0] || "",
    });
  }

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const ship = computeShipping(s, customer.country, customer.city, subtotal);
  const codFee = isCod ? s.cod.fee : 0;

  let discount = 0;
  let couponCode: string | null = null;
  const session = await getSession();
  if (body.couponCode) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, String(body.couponCode).trim().toUpperCase()));
    if (coupon && coupon.active) {
      let eligible = true;
      if (coupon.newUsersOnly) {
        eligible = session?.role === "user" && !!session.userId;
        if (eligible && session?.userId) {
          const prev = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, session.userId));
          eligible = prev.length === 0;
        }
      }
      if (eligible) {
        discount = Math.round((subtotal * coupon.percent) / 100);
        couponCode = coupon.code;
      }
    }
  }

  const total = subtotal + ship.cost + codFee - discount;
  const number = `NAP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const paymentLabel = isCod ? "💵 PAGO CONTRA ENTREGA (paga al recibir)" : `✅ PAGO EN LÍNEA EXITOSO (${paymentMethod.toUpperCase()})`;

  const lines = [
    "🛒 *NUEVO PEDIDO — TIENDA DEPORTIVA NAPOLI*",
    "",
    `👤 Cliente: ${customer.name}`,
    `🧾 Pedido: *${number}*`,
    "",
    "📦 *Productos:*",
    ...items.map((i) => `• ${i.name} ×${i.qty} — Talla ${i.size} — ${formatCOP(i.price * i.qty)}`),
    "",
    `💳 Método de pago: ${paymentLabel}`,
    "",
    "💰 *Desglose:*",
    `Subtotal productos: ${formatCOP(subtotal)}`,
    `Envío (${ship.zone}): ${ship.cost === 0 ? "GRATIS" : formatCOP(ship.cost)}`,
    ...(codFee ? [`Recargo contra entrega: ${formatCOP(codFee)}`] : []),
    ...(discount ? [`Descuento (${couponCode}): -${formatCOP(discount)}`] : []),
    `*TOTAL A PAGAR: ${formatCOP(total)}*`,
    "",
    `📍 ${customer.address}, ${customer.city}, ${customer.department || ""} — ${customer.country}`,
    `📞 ${customer.phone}`,
  ];
  const whatsappMessage = lines.join("\n");
  const whatsappUrl = `https://wa.me/${s.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  // Descontar stock por variante
  for (const product of rows) {
    const newSizes = product.sizes.map((v) => {
      const sold = items.filter((i) => i.productId === product.id && i.size === v.size).reduce((a, i) => a + i.qty, 0);
      return sold ? { ...v, stock: Math.max(0, v.stock - sold) } : v;
    });
    await db.update(products).set({ sizes: newSizes }).where(eq(products.id, product.id));
  }

  const [order] = await db
    .insert(orders)
    .values({
      number,
      userId: session?.role === "user" ? session.userId : null,
      customer,
      items,
      paymentMethod,
      paymentStatus: isCod ? "contraentrega" : "pagado",
      status: "pendiente",
      subtotal,
      shippingCost: ship.cost,
      codFee,
      discount,
      total,
      couponCode,
      shippingZone: ship.zone,
      whatsappMessage,
    })
    .returning();

  // 🔔 Notificación automática al WhatsApp de la tienda (server → server).
  // El cliente NO tiene que abrir WhatsApp ni hacer nada.
  const notify = await notifyStoreWhatsApp(s, whatsappMessage);
  await db
    .update(orders)
    .set({ waStatus: notify.status, waDetail: notify.detail })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ number: order.number, whatsappUrl, total: order.total, waStatus: notify.status });
}