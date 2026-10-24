import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numeric = Number(id);
  const [row] = Number.isFinite(numeric) && numeric > 0 && !id.startsWith("NAP")
    ? await db.select().from(orders).where(eq(orders.id, numeric))
    : await db.select().from(orders).where(eq(orders.number, id));
  if (!row) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  const s = await getSettings();
  const whatsappUrl = `https://wa.me/${s.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(row.whatsappMessage)}`;
  return NextResponse.json({ ...row, whatsappUrl });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const numeric = Number(id);
  const [deleted] = Number.isFinite(numeric) && numeric > 0 && !id.startsWith("NAP")
    ? await db.delete(orders).where(eq(orders.id, numeric)).returning({ id: orders.id })
    : await db.delete(orders).where(eq(orders.number, id)).returning({ id: orders.id });
  if (!deleted) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: 1 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(orders)
    .set({ status: body.status, paymentStatus: body.paymentStatus })
    .where(eq(orders.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}