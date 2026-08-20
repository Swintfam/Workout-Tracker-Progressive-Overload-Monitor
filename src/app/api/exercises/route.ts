import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";
const BASE = "https://exercisedb.p.rapidapi.com";
const HEADERS = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
};

export async function GET(req: NextRequest) {
  if (!RAPIDAPI_KEY) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not configured" }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const bodyPart  = searchParams.get("bodyPart");
  const equipment = searchParams.get("equipment");
  const search    = searchParams.get("search");
  const limit     = searchParams.get("limit") ?? "50";
  const offset    = searchParams.get("offset") ?? "0";

  const target = searchParams.get("target");

  let url: string;
  if (search) {
    url = `${BASE}/exercises/name/${encodeURIComponent(search)}?limit=${limit}&offset=${offset}`;
  } else if (target) {
    url = `${BASE}/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=${offset}`;
  } else if (bodyPart) {
    url = `${BASE}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=${offset}`;
  } else if (equipment) {
    url = `${BASE}/exercises/equipment/${encodeURIComponent(equipment)}?limit=${limit}&offset=${offset}`;
  } else {
    url = `${BASE}/exercises?limit=${limit}&offset=${offset}`;
  }

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const data = await res.json();
    // Inject gifUrl from exercise ID if API didn't return it
    const enriched = Array.isArray(data)
      ? data.map((ex: Record<string, unknown>) => ({
          ...ex,
          gifUrl: ex.gifUrl || `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.id}/images/0.jpg`,
        }))
      : data;
    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Available body parts for filters
export async function POST(req: NextRequest) {
  const { type } = await req.json();
  if (!RAPIDAPI_KEY) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not configured" }, { status: 503 });
  }
  const endpoint = type === "equipment"
    ? `${BASE}/exercises/equipmentList`
    : `${BASE}/exercises/bodyPartList`;
  const res = await fetch(endpoint, { headers: HEADERS });
  const data = await res.json();
  return NextResponse.json(data);
}
