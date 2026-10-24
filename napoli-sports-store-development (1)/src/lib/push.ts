import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT } from "@/lib/vapid";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Envía una notificación push a todos los navegadores suscritos. */
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) return { sent: 0, removed: 0 };
  const subs = await db.select().from(pushSubscriptions);
  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }
        );
        sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Suscripción caducada o revocada por el usuario → limpiar
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          removed++;
        }
      }
    })
  );
  return { sent, removed };
}

export function pushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
}