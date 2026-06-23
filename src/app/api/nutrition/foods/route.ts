import { NextResponse } from "next/server";
import { getFoodLibrary, addFood } from "@/lib/nutrition";

export async function GET() {
  try {
    const foods = await getFoodLibrary();
    return NextResponse.json(foods);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const food = await addFood(body);
    return NextResponse.json(food);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
