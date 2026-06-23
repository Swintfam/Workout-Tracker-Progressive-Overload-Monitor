import { NextResponse } from "next/server";
import { getMoodForDate, upsertMood } from "@/lib/mental";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const log = await getMoodForDate(date);
    return NextResponse.json(log ?? null);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const log = await upsertMood(body);
    return NextResponse.json(log);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
