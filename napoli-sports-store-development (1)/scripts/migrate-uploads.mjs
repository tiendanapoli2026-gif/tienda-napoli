// Migra archivos de public/uploads a la tabla media y actualiza las URLs
// guardadas en settings (branding, banners) y products.images.
import pg from "pg";
import { readdir, readFile } from "fs/promises";
import path from "path";
import "dotenv/config";

const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif" };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const dir = path.join(process.cwd(), "public", "uploads");

const mapping = {};
try {
  const files = await readdir(dir);
  for (const name of files) {
    const ext = name.split(".").pop().toLowerCase();
    if (!MIME[ext]) continue;
    const buf = await readFile(path.join(dir, name));
    const { rows } = await pool.query(
      "INSERT INTO media (filename, mime_type, data) VALUES ($1,$2,$3) RETURNING id",
      [name, MIME[ext], buf.toString("base64")]
    );
    mapping[`/uploads/${name}`] = `/api/media/${rows[0].id}`;
  }
} catch (e) {
  console.log("Sin carpeta uploads o vacía:", e.message);
}

const replaceAll = (obj) => {
  if (typeof obj === "string") return mapping[obj] || obj;
  if (Array.isArray(obj)) return obj.map(replaceAll);
  if (obj && typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, replaceAll(v)]));
  return obj;
};

if (Object.keys(mapping).length) {
  const settings = await pool.query("SELECT key, value FROM settings");
  for (const row of settings.rows) {
    const updated = replaceAll(row.value);
    if (JSON.stringify(updated) !== JSON.stringify(row.value)) {
      await pool.query("UPDATE settings SET value=$1 WHERE key=$2", [JSON.stringify(updated), row.key]);
      console.log(`settings.${row.key} actualizado`);
    }
  }
  const products = await pool.query("SELECT id, images FROM products");
  for (const row of products.rows) {
    const updated = replaceAll(row.images);
    if (JSON.stringify(updated) !== JSON.stringify(row.images)) {
      await pool.query("UPDATE products SET images=$1 WHERE id=$2", [JSON.stringify(updated), row.id]);
      console.log(`producto ${row.id} actualizado`);
    }
  }
  console.log("Migración:", mapping);
} else {
  console.log("Nada que migrar.");
}
await pool.end();