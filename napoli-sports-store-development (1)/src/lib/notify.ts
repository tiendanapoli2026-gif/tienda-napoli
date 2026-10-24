import type { SiteSettings } from "@/lib/settings";

export type NotifyResult = { status: "enviado" | "error" | "no_configurado" | "desactivado"; detail: string };

/**
 * Envía la notificación del pedido DIRECTAMENTE al WhatsApp de la tienda,
 * sin que el cliente tenga que abrir WhatsApp ni hacer nada.
 *
 * Proveedores soportados:
 *  - CallMeBot (gratis, ideal para empezar): el dueño de la tienda autoriza
 *    su número una sola vez y recibe una API key.
 *  - WhatsApp Cloud API (Meta, producción): requiere Phone Number ID y token.
 */
export async function notifyStoreWhatsApp(s: SiteSettings, message: string): Promise<NotifyResult> {
  const cfg = s.whatsapp.notify;
  if (!cfg?.enabled) return { status: "desactivado", detail: "Notificación automática desactivada en el panel" };

  const phone = s.whatsapp.number.replace(/\D/g, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    if (cfg.provider === "callmebot") {
      if (!cfg.callmebotApiKey) {
        return { status: "no_configurado", detail: "Falta la API key de CallMeBot (Panel → Ajustes → WhatsApp)" };
      }
      const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${phone}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(cfg.callmebotApiKey)}`;
      const res = await fetch(url, { signal: controller.signal });
      const body = await res.text();
      if (res.ok && !/error/i.test(body.slice(0, 200))) {
        return { status: "enviado", detail: "Enviado vía CallMeBot" };
      }
      return { status: "error", detail: `CallMeBot respondió ${res.status}: ${body.slice(0, 180)}` };
    }

    // WhatsApp Cloud API (Meta)
    if (!cfg.cloudPhoneId || !cfg.cloudToken) {
      return { status: "no_configurado", detail: "Faltan Phone Number ID / Token de WhatsApp Cloud API" };
    }
    const res = await fetch(`https://graph.facebook.com/v21.0/${cfg.cloudPhoneId}/messages`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${cfg.cloudToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { status: "enviado", detail: "Enviado vía WhatsApp Cloud API" };
    return { status: "error", detail: `Cloud API ${res.status}: ${JSON.stringify(data).slice(0, 180)}` };
  } catch (e) {
    return { status: "error", detail: e instanceof Error ? e.message : "Error de red" };
  } finally {
    clearTimeout(timeout);
  }
}