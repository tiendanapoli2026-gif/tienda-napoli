import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSetting, DEFAULT_SETTINGS } from "@/lib/settings";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json(s);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  const allowed = Object.keys(DEFAULT_SETTINGS);
  for (const key of Object.keys(body)) {
    if (allowed.includes(key)) {
      await saveSetting(key, body[key]);
    }
  }
  return NextResponse.json(await getSettings());
}