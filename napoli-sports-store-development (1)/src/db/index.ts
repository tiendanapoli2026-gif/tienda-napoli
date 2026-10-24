import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// IMPORTANTE: no lanzar error al importar este módulo.
// Durante el build de Vercel puede que DATABASE_URL aún no esté disponible
// y Next.js importa todas las rutas para "recolectar datos de página".
// La conexión real solo se abre cuando se ejecuta la primera consulta.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.warn(
    "[Napoli] ⚠️ DATABASE_URL no está definida. Agrégala en Vercel → Settings → Environment Variables."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
    // En serverless (Vercel) cada instancia usa pocas conexiones para no agotar el límite de Neon
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 15000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);