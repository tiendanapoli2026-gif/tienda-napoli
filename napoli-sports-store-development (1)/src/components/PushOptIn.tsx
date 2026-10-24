"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

export default function PushOptIn() {
  const { toast } = useStore();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setState(sub ? "on" : "off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  const activate = async () => {
    setState("busy");
    try {
      const { publicKey, enabled } = await (await fetch("/api/push/vapid")).json();
      if (!enabled || !publicKey) throw new Error("Notificaciones no configuradas");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setState("on");
      toast("🔔 ¡Listo! Te avisaremos de ofertas y nuevos artículos");
    } catch {
      setState("off");
      toast("No se pudieron activar las notificaciones");
    }
  };

  const deactivate = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      toast("Notificaciones desactivadas");
    } catch {
      setState("on");
    }
  };

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-2 border-neutral-950 bg-neutral-50 p-5">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 items-center justify-center ${state === "on" ? "bg-green-600" : "bg-neutral-950"} text-white`}>
          {state === "on" ? <BellRing className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
        </span>
        <div>
          <p className="font-display text-xl font-bold uppercase tracking-wide">Alertas de ofertas y novedades</p>
          <p className="text-xs text-neutral-500">
            {state === "on" && <span className="flex items-center gap-1 font-semibold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Activadas — te llegará una notificación aunque la página esté cerrada.</span>}
            {state === "off" && "Recibe descuentos, ofertas y nuevos artículos directo en tu navegador o celular."}
            {state === "denied" && "Bloqueaste las notificaciones. Actívalas en el candado 🔒 de la barra de direcciones → Notificaciones → Permitir."}
            {state === "busy" && "Configurando…"}
          </p>
        </div>
      </div>
      {state === "on" ? (
        <button onClick={deactivate} className="border-2 border-neutral-300 px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-neutral-950">
          Desactivar
        </button>
      ) : state === "off" || state === "busy" ? (
        <button onClick={activate} disabled={state === "busy"} className="btn-dark flex items-center gap-2 px-6 py-3 text-xs">
          <BellRing className="h-4 w-4" /> {state === "busy" ? "Activando…" : "Activar notificaciones"}
        </button>
      ) : null}
    </div>
  );
}