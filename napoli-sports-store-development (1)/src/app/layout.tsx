import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import StoreShell from "@/components/StoreShell";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tienda deportiva Napoli | Ropa y equipamiento deportivo",
    template: "%s | Tienda deportiva Napoli",
  },
  description:
    "Tienda deportiva Napoli: camisetas, tenis, balones y ropa deportiva para mujer, hombre y niños. Envíos a toda Colombia. Pago contra entrega: paga cuando recibas.",
  keywords: ["tienda deportiva", "ropa deportiva", "camisetas de fútbol", "Colombia", "Napoli", "pago contra entrega"],
  openGraph: {
    title: "Tienda deportiva Napoli",
    description: "Ropa y equipamiento deportivo con el ADN del barrio. Envíos a toda Colombia y pago contra entrega.",
    type: "website",
    locale: "es_CO",
    siteName: "Tienda deportiva Napoli",
  },
  // Verificación de Google Search Console: define GOOGLE_SITE_VERIFICATION en
  // las variables de entorno de tu hosting (Vercel) y Google podrá indexarte.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${manrope.variable}`}>
      <body className="bg-white text-neutral-950 antialiased">
        <StoreProvider>
          <StoreShell>{children}</StoreShell>
        </StoreProvider>
      </body>
    </html>
  );
}