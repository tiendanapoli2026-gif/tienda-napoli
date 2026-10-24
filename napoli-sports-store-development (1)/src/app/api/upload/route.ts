import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB por imagen (límite de Vercel: 4.5 MB por solicitud)
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Sin archivos" }, { status: 400 });

  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of files.slice(0, 8)) {
    if (!ALLOWED.includes(file.type)) {
      errors.push(`"${file.name}": formato no soportado (${file.type || "desconocido"}). Usa PNG, JPG, WEBP o SVG.`);
      continue;
    }
    if (file.size > MAX_SIZE) {
      errors.push(`"${file.name}": supera 4 MB. Comprímela en tinypng.com y vuelve a subirla.`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const [row] = await db
      .insert(media)
      .values({ filename: file.name, mimeType: file.type, data: buffer.toString("base64") })
      .returning({ id: media.id });
    urls.push(`/api/media/${row.id}`);
  }

  if (!urls.length) {
    return NextResponse.json({ error: errors.join(" ") || "No se pudo guardar la imagen" }, { status: 400 });
  }
  return NextResponse.json({ urls, warnings: errors });
}