import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET =
  process.env.SESSION_SECRET || "660218cccb05d45270c37086001b03466ae110bed3a13e651f2d4e49f635338b";
const COOKIE = "napoli_session";

export type Session = { role: "admin" | "user"; userId?: number; name?: string; exp: number };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  return s?.role === "admin";
}

export const SESSION_COOKIE = COOKIE;
// Claves fijas del panel. Si las variables de entorno no existen (por ejemplo,
// si un archivo .env no se subió), se usan estas por defecto: Napoli2026 / Napoli2026.
export const ADMIN_USER = process.env.ADMIN_USER || "Napoli2026";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Napoli2026";