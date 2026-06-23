import { NextResponse } from "next/server";
import { getDailyLogs, addLog } from "@/lib/nutrition";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const logs = await getDailyLogs(date);
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const log = await addLog(body);
    return NextResponse.json(log);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
