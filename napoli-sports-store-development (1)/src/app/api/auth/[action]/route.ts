import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, coupons } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  encodeSession,
  getSession,
  SESSION_COOKIE,
  ADMIN_USER,
  ADMIN_PASSWORD,
} from "@/lib/auth";
import { getSettings } from "@/lib/settings";

type Params = { params: Promise<{ action: string }> };

function sessionResponse(payload: Parameters<typeof encodeSession>[0], extra: Record<string, unknown> = {}) {
  const res = NextResponse.json({ ok: true, ...extra });
  res.cookies.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { action } = await params;
  const body = await req.json().catch(() => ({}));
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;

  if (action === "login") {
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Completa todos los campos" }, { status: 400 });
    }
    if (email.trim().toLowerCase() === ADMIN_USER.trim().toLowerCase() && password === ADMIN_PASSWORD) {
      return sessionResponse({ role: "admin", name: "Administrador", exp });
    }
    const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }
    return sessionResponse({ role: "user", userId: user.id, name: user.name, exp }, { name: user.name, email: user.email });
  }

  if (action === "register") {
    const { name, email, password, phone } = body;
    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Nombre, correo y contraseña (mínimo 6 caracteres) son obligatorios" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    if (normalized === ADMIN_USER.trim().toLowerCase()) {
      return NextResponse.json({ error: "Correo no disponible" }, { status: 400 });
    }
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalized));
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con este correo" }, { status: 409 });
    }
    const [user] = await db
      .insert(users)
      .values({ name, email: normalized, phone: phone || "", passwordHash: hashPassword(password) })
      .returning();

    const s = await getSettings();
    let welcomeCoupon: { code: string; percent: number } | null = null;
    if (s.newUserCoupon.enabled) {
      await db
        .insert(coupons)
        .values({
          code: s.newUserCoupon.code,
          percent: s.newUserCoupon.percent,
          description: "Cupón automático para usuarios nuevos",
          newUsersOnly: true,
          active: true,
        })
        .onConflictDoNothing();
      welcomeCoupon = { code: s.newUserCoupon.code, percent: s.newUserCoupon.percent };
    }
    return sessionResponse({ role: "user", userId: user.id, name: user.name, exp }, { name: user.name, email: user.email, welcomeCoupon });
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { action } = await params;
  if (action === "me") {
    const session = await getSession();
    if (!session) return NextResponse.json({ authenticated: false });
    if (session.role === "admin") return NextResponse.json({ authenticated: true, role: "admin", name: "Administrador" });
    const [user] = session.userId
      ? await db.select().from(users).where(eq(users.id, session.userId))
      : [undefined];
    return NextResponse.json({
      authenticated: true,
      role: "user",
      name: user?.name || session.name,
      email: user?.email,
      phone: user?.phone,
    });
  }
  return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
}