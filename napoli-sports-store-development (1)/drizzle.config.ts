import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Usa DATABASE_URL del entorno (.env local o la URL de tu base de datos en la
// nube, ej. Neon/Supabase, al desplegar en producción).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});