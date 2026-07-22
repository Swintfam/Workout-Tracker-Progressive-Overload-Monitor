import { NextRequest, NextResponse } from "next/server";

// USDA nutrient IDs we care about
const NUTRIENT_MAP: Record<number, string> = {
  1008: "calories",
  1003: "protein_g",
  1004: "fat_g",
  1005: "carbs_g",
  1079: "fiber_g",
  2000: "sugar_g",
};

interface UsdaNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: UsdaNutrient[];
}

function extractNutrients(foodNutrients: UsdaNutrient[]) {
  const out: Record<string, number> = {
    calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0, sugar_g: 0,
  };
  for (const n of foodNutrients) {
    const key = NUTRIENT_MAP[n.nutrientId];
    if (key) out[key] = Math.round(n.value * 10) / 10;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ foods: [] });

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "USDA_API_KEY not set" }, { status: 500 });

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");
  url.searchParams.set("pageSize", "12");
  url.searchParams.set("pageNumber", "1");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`USDA responded with ${res.status}`);

    const json = await res.json();
    const foods = (json.foods as UsdaFood[]).map((f) => ({
      fdcId: f.fdcId,
      name: f.description,
      brand: f.brandOwner ?? null,
      // USDA values are per 100g unless a servingSize is given
      per100g: extractNutrients(f.foodNutrients),
      defaultServing: f.servingSize ?? 100,
      servingUnit: f.servingSizeUnit ?? "g",
    }));

    return NextResponse.json({ foods });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
