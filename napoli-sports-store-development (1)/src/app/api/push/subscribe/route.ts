import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Guardar la suscripción push del navegador de un cliente
export async function POST(req: NextRequest) {
  const body = await req.json();
  const endpoint: string = body?.subscription?.endpoint;
  const p256dh: string = body?.subscription?.keys?.p256dh;
  const auth: string = body?.subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }
  const session = await getSession();
  const userId = session?.role === "user" ? session.userId ?? null : null;
  await db
    .insert(pushSubscriptions)
    .values({ endpoint, p256dh, auth, userId })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh, auth, userId } });
  return NextResponse.json({ ok: true });
}

// El cliente desactiva sus notificaciones
export async function DELETE(req: NextRequest) {
  const endpoint = (await req.json())?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return NextResponse.json({ ok: true });
}

// Conteo de suscriptores (solo admin)
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions);
  return NextResponse.json({ count: rows.length });
}