# 🚀 Guía de despliegue — Tienda deportiva Napoli (versión final)

## 🔑 Acceso al panel
- **URL:** `https://TU-DOMINIO/admin`
- **Usuario:** `Napoli2026` · **Clave:** `Napoli2026`

---

## PARTE A · Borrar el despliegue anterior (si ya habías subido uno)

### A1. Borrar el proyecto viejo en Vercel
1. https://vercel.com/dashboard → clic en el proyecto viejo.
2. Pestaña **Settings** → baja hasta el final → **Delete Project**.
3. Escribe el nombre del proyecto para confirmar → **Delete**.

### A2. Borrar el repositorio viejo en GitHub (opcional pero recomendado)
1. https://github.com → tu repositorio viejo → **Settings**.
2. Baja hasta "Danger Zone" → **Delete this repository**.
3. Escribe `usuario/nombre-repo` para confirmar.

### A3. Base de datos Neon
- Puedes **conservar la misma** base Neon (recomendado: conserva tus clientes y
  configuración) o crear un proyecto nuevo en https://neon.tech.

---

## PARTE B · Subir la versión nueva

### B1. GitHub — repositorio nuevo
1. https://github.com/new → nombre: `tienda-napoli` → **Create repository**.
2. Clic **"uploading an existing file"** → arrastra TODO el proyecto
   (incluye `.env`, `.env.local`, `.env.example`, `public/`, `src/`, `scripts/`)
   **excepto** `node_modules` y `.next` → **Commit changes**.

### B2. Vercel — proyecto nuevo
1. https://vercel.com → **Add New… → Project** → importa `tienda-napoli`.
2. Framework: Next.js (se detecta solo). NO cambies Build/Output.
3. Abre **Environment Variables** y agrega EXACTAMENTE estas filas
   (columna KEY = nombre, columna VALUE = valor):

| KEY | VALUE |
|---|---|
| `DATABASE_URL` | `postgresql://...` (la URL de tu base Neon — OBLIGATORIA) |
| `ADMIN_USER` | `Napoli2026` |
| `ADMIN_PASSWORD` | `Napoli2026` |
| `SESSION_SECRET` | `660218cccb05d45270c37086001b03466ae110bed3a13e651f2d4e49f635338b` |
| `VAPID_PUBLIC_KEY` | `BJQw73ECa3cYrxS-pMNhsUXL11_6fUuWtdQWnZeFcXFJUYjv69v8TDjpscCzM4oU1vs-XZvd-NQcZgsjCWaBoH8` |
| `VAPID_PRIVATE_KEY` | `Qjm8wL_AM6Pdu4qvVPNupHxuw6-lygPfI8UvTMQppDo` |
| `VAPID_SUBJECT` | `mailto:tiendanapoli@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://tiendanapoli.vercel.app` (tu nombre elegido) |
| `GOOGLE_SITE_VERIFICATION` | (después, el código de Search Console — opcional) |

   Environment: deja **Production** (o "All Environments").
4. **Deploy** → espera ~2 minutos.

### B3. Crear tablas en Neon (una sola vez)
En tu computador con Node.js, dentro de la carpeta del proyecto:

**Windows (PowerShell):**
```powershell
npm install
$env:DATABASE_URL="postgresql://...tu-url-neon..."
npx drizzle-kit push
node scripts/seed.mjs   # OPCIONAL: 14 productos de ejemplo
```
**Mac / Linux:**
```bash
npm install
DATABASE_URL="postgresql://...tu-url-neon..." npx drizzle-kit push
DATABASE_URL="postgresql://...tu-url-neon..." node scripts/seed.mjs
```
> Si reutilizas tu base Neon anterior, las tablas ya existen; `push` solo
> agregará las nuevas (clientes push y anuncios). NO ejecutes seed si ya
> tienes tus productos reales.

### B4. Link limpio
Vercel → **Settings → Domains** → edita a `tiendanapoli.vercel.app`.
Si cambiaste el nombre, actualiza `NEXT_PUBLIC_SITE_URL` → **Redeploy**
(Deployments → ⋯ → Redeploy).

### B5. Google
1. https://search.google.com/search-console → propiedad **Prefijo de URL**.
2. Verificación **Etiqueta HTML** → copia el `content="..."` →
   Vercel → `GOOGLE_SITE_VERIFICATION` → Redeploy → Verificar.
3. Sitemaps → enviar `sitemap.xml`.
4. Tienda física: https://business.google.com (Google Maps).

---

## 🔔 Notificaciones a clientes (incluido en esta versión)
- **Campanita** en el header: todos los visitantes ven tus anuncios de ofertas.
- **Push del navegador:** el cliente entra a **Mi cuenta → Activar notificaciones**
  y acepta. Desde **Panel → Notificar** publicas el anuncio y le llega al
  navegador/celular aunque la página esté cerrada (Android/PC; en iPhone
  requiere la web añadida a pantalla de inicio, iOS 16.4+).
- **WhatsApp:** Panel → Clientes → botón "Enviar oferta por WhatsApp" por cliente.

## 👥 Clientes (CRM incluido)
Panel → **Clientes**: registrados e invitados, con historial completo
(qué compró, cuánto, cuándo, dirección), total gastado, llamar y WhatsApp.

## ✅ Checklist final
- [ ] Panel → Ajustes: número REAL de WhatsApp + activar CallMeBot
      (contacto +34 644 59 71 67 → "I allow callmebot to send me messages" → pegar API key).
- [ ] Panel → Ajustes: dirección real para el mapa.
- [ ] Panel → Pedidos: Vaciar pedidos de prueba.
- [ ] Panel → Notificar: publicar tu primera oferta 📣.