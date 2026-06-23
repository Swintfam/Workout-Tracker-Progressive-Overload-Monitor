import { NextResponse } from "next/server";
import { getNutritionTargets, setNutritionTargets } from "@/lib/nutrition";

export async function GET() {
  try {
    const targets = await getNutritionTargets();
    return NextResponse.json(targets ?? null);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const targets = await setNutritionTargets(body);
    return NextResponse.json(targets);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
