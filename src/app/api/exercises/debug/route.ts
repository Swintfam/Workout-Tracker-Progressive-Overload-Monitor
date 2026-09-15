import { NextResponse } from "next/server";

// Debug-only route hitting an external API — must not be statically
// prerendered at build time (that invokes it during `next build`).
export const dynamic = "force-dynamic";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";
const HEADERS = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
};

export async function GET() {
  if (!RAPIDAPI_KEY) return NextResponse.json({ error: "No key" }, { status: 503 });

  const res = await fetch(
    "https://exercisedb.p.rapidapi.com/exercises?limit=2&offset=0",
    { headers: HEADERS }
  );

  const data = await res.json();
  // Return raw so we can see all fields including gifUrl
  return NextResponse.json({ status: res.status, data });
}
