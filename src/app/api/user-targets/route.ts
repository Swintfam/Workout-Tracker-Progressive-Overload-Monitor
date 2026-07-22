import { getUserTargets } from "@/lib/targets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const targets = await getUserTargets();
    return NextResponse.json(targets ?? { exists: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
