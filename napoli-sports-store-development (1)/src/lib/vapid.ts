// Llaves de notificaciones push de la tienda (VAPID).
// Se leen del entorno; si no existen se usan estas por defecto, para que las
// notificaciones funcionen aunque un archivo .env no se haya subido.
export const VAPID_PUBLIC =
  process.env.VAPID_PUBLIC_KEY ||
  "BJQw73ECa3cYrxS-pMNhsUXL11_6fUuWtdQWnZeFcXFJUYjv69v8TDjpscCzM4oU1vs-XZvd-NQcZgsjCWaBoH8";
export const VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || "Qjm8wL_AM6Pdu4qvVPNupHxuw6-lygPfI8UvTMQppDo";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:tiendanapoli@gmail.com";