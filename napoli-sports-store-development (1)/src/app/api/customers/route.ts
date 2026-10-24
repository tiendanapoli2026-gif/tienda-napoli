import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export type CustomerRow = {
  key: string;
  type: "registrado" | "invitado";
  userId: number | null;
  name: string;
  email: string;
  phone: string;
  registeredAt: Date | null;
  orderCount: number;
  totalSpent: number;
  lastPurchase: Date | null;
  orders: (typeof orders.$inferSelect)[];
};

// CRM: todos los clientes (registrados + compradores invitados) con su historial
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [allUsers, allOrders] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(orders).orderBy(desc(orders.createdAt)),
  ]);

  const map = new Map<string, CustomerRow>();

  for (const u of allUsers) {
    map.set(u.email.toLowerCase(), {
      key: `u-${u.id}`,
      type: "registrado",
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      registeredAt: u.createdAt,
      orderCount: 0,
      totalSpent: 0,
      lastPurchase: null,
      orders: [],
    });
  }

  for (const o of allOrders) {
    const email = (o.customer.email || "").toLowerCase();
    const key = email || `guest-${o.customer.phone || o.id}`;
    let row = map.get(key);
    if (!row && email) {
      // buscar por userId si el email difiere
      const byId = [...map.values()].find((r) => r.userId !== null && r.userId === o.userId);
      if (byId) row = byId;
    }
    if (!row) {
      row = {
        key,
        type: "invitado",
        userId: null,
        name: o.customer.name,
        email: o.customer.email,
        phone: o.customer.phone,
        registeredAt: null,
        orderCount: 0,
        totalSpent: 0,
        lastPurchase: null,
        orders: [],
      };
      map.set(key, row);
    }
    row.orders.push(o);
    if (o.status !== "cancelado") {
      row.orderCount++;
      row.totalSpent += o.total;
    }
    if (!row.lastPurchase || o.createdAt > row.lastPurchase) row.lastPurchase = o.createdAt;
    if (!row.phone && o.customer.phone) row.phone = o.customer.phone;
  }

  const rows = [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent || (b.registeredAt?.getTime() || 0) - (a.registeredAt?.getTime() || 0));
  return NextResponse.json(rows);
}