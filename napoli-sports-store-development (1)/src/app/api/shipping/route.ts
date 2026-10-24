import { NextRequest, NextResponse } from "next/server";
import { getSettings, computeShipping } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const s = await getSettings();
  const quote = computeShipping(s, body.country || "Colombia", body.city || "", Number(body.subtotal) || 0);
  return NextResponse.json({
    ...quote,
    codEnabled: s.cod.enabled && quote.zone !== "internacional",
    codFee: s.cod.fee,
    freeThreshold: s.shipping.freeThreshold,
  });
}