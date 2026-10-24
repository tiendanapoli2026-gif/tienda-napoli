import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export type SizeStock = { size: string; stock: number };

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(), // mujer | hombre | ninos | deportes
  sport: text("sport").notNull().default("Fútbol"),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<SizeStock[]>().notNull().default([]),
  trending: boolean("trending").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// Imágenes subidas desde el panel (logo, fotos de producto).
// Se guardan en la base de datos para que sobrevivan a los rebuilds
// y se sirvan correctamente en producción vía /api/media/[id].
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // base64
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  percent: integer("percent").notNull(),
  description: text("description").notNull().default(""),
  newUsersOnly: boolean("new_users_only").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

// Suscripciones de notificaciones push del navegador (clientes que aceptaron recibir ofertas)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Anuncios de la tienda (ofertas, descuentos, nuevos artículos) — campanita + push
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link").notNull().default(""),
  pushSent: integer("push_sent").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  country: string;
  notes?: string;
};

export type OrderItem = {
  productId: number;
  name: string;
  size: string;
  qty: number;
  price: number;
  image: string;
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  userId: integer("user_id"),
  customer: jsonb("customer").$type<OrderCustomer>().notNull(),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pendiente"),
  status: text("status").notNull().default("pendiente"),
  subtotal: integer("subtotal").notNull(),
  shippingCost: integer("shipping_cost").notNull(),
  codFee: integer("cod_fee").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  couponCode: text("coupon_code"),
  shippingZone: text("shipping_zone").notNull().default(""),
  whatsappMessage: text("whatsapp_message").notNull().default(""),
  waStatus: text("wa_status").notNull().default("desactivado"),
  waDetail: text("wa_detail").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});