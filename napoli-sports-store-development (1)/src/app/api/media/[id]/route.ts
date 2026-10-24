import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
  const [row] = await db.select().from(media).where(eq(media.id, numeric));
  if (!row) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });

  const buffer = Buffer.from(row.data, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}