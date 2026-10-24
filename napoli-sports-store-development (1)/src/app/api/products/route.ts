import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const ids = sp.get("ids");
  const sort = sp.get("sort") || "nuevo";
  const limit = Math.min(Number(sp.get("limit") || 60), 100);
  const includeInactive = sp.get("all") === "1" && (await isAdmin());

  const conditions = [];
  if (!includeInactive) conditions.push(eq(products.active, true));
  if (q) {
    conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`), ilike(products.sport, `%${q}%`)));
  }
  if (ids) {
    const list = ids.split(",").map(Number).filter(Boolean);
    if (list.length === 0) return NextResponse.json([]);
    conditions.push(inArray(products.id, list));
  }
  if (category && category !== "todos") {
    if (category === "ofertas") conditions.push(isNotNull(products.salePrice));
    else if (category === "tendencias") conditions.push(eq(products.trending, true));
    else conditions.push(eq(products.category, category));
  }

  const orderBy =
    sort === "precio-asc"
      ? asc(sql`coalesce(${products.salePrice}, ${products.price})`)
      : sort === "precio-desc"
        ? desc(sql`coalesce(${products.salePrice}, ${products.price})`)
        : sort === "descuento"
          ? desc(sql`case when ${products.salePrice} is not null then 1 - ${products.salePrice}::float / ${products.price} else 0 end`)
          : desc(products.createdAt);

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name || !body.price) {
    return NextResponse.json({ error: "Nombre y precio son obligatorios" }, { status: 400 });
  }
  let slug = slugify(body.slug || body.name);
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug));
  if (existing.length) slug = `${slug}-${Date.now().toString(36)}`;
  const [row] = await db
    .insert(products)
    .values({
      slug,
      name: body.name,
      description: body.description || "",
      category: body.category || "hombre",
      sport: body.sport || "Fútbol",
      price: Number(body.price),
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      images: body.images || [],
      sizes: body.sizes || [],
      trending: Boolean(body.trending),
      active: body.active !== false,
    })
    .returning();
  return NextResponse.json(row);
}