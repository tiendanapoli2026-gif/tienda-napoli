import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons, orders } from "@/db/schema";
import { isAdmin, getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.trim().toUpperCase()));
    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, reason: "El cupón no existe o está inactivo" });
    }
    if (coupon.newUsersOnly) {
      const session = await getSession();
      if (session?.role !== "user" || !session.userId) {
        return NextResponse.json({ valid: false, reason: "Cupón exclusivo para usuarios nuevos registrados. Inicia sesión o crea tu cuenta." });
      }
      const previous = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, session.userId));
      if (previous.length > 0) {
        return NextResponse.json({ valid: false, reason: "Este cupón aplica solo para tu primera compra." });
      }
    }
    return NextResponse.json({ valid: true, code: coupon.code, percent: coupon.percent });
  }
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(coupons);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  if (!body.code || !body.percent) {
    return NextResponse.json({ error: "Código y porcentaje requeridos" }, { status: 400 });
  }
  const [row] = await db
    .insert(coupons)
    .values({
      code: String(body.code).trim().toUpperCase(),
      percent: Number(body.percent),
      description: body.description || "",
      newUsersOnly: Boolean(body.newUsersOnly),
      active: body.active !== false,
    })
    .returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const [row] = await db
    .update(coupons)
    .set({
      active: body.active,
      percent: body.percent !== undefined ? Number(body.percent) : undefined,
      description: body.description,
      newUsersOnly: body.newUsersOnly,
    })
    .where(eq(coupons.id, Number(body.id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  await db.delete(coupons).where(eq(coupons.id, id));
  return NextResponse.json({ ok: true });
}