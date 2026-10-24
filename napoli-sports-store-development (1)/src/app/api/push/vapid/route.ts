import { NextResponse } from "next/server";
import { VAPID_PUBLIC, VAPID_PRIVATE } from "@/lib/vapid";

export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC,
    enabled: Boolean(VAPID_PUBLIC && VAPID_PRIVATE),
  });
}