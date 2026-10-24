import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { sendPushToAll } from "@/lib/push";

export const runtime = "nodejs";

// Público: anuncios activos para la campanita de la tienda
export async function GET() {
  const rows = await db
    .select()
    .from(announcements)
    .where(eq(announcements.active, true))
    .orderBy(desc(announcements.createdAt))
    .limit(20);
  return NextResponse.json(rows);
}

// Admin: crear anuncio + envío opcional de push a todos los suscriptores
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  if (!body.title || !body.message) {
    return NextResponse.json({ error: "Título y mensaje son obligatorios" }, { status: 400 });
  }
  let pushSent = 0;
  if (body.sendPush) {
    const result = await sendPushToAll({
      title: `🏷️ ${body.title}`,
      body: body.message,
      url: body.link || "/",
    });
    pushSent = result.sent;
  }
  const [row] = await db
    .insert(announcements)
    .values({
      title: body.title,
      message: body.message,
      link: body.link || "",
      pushSent,
      active: true,
    })
    .returning();
  return NextResponse.json({ ...row, pushSent });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  await db.delete(announcements).where(eq(announcements.id, id));
  return NextResponse.json({ ok: true });
}