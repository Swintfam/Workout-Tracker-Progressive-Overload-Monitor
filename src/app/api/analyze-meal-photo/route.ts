import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a nutrition analysis assistant. When given a photo of food, identify every distinct food item visible and estimate the portion size in grams based on visual cues (plate/bowl size, standard serving sizes, density).

Return ONLY valid JSON — no markdown, no explanation — in this exact format:
{
  "items": [
    { "food_name": "string", "estimated_grams": number },
    ...
  ],
  "notes": "string or null"
}

Rules:
- Be specific with food names (e.g. "white rice" not "rice", "grilled chicken breast" not "chicken")
- estimated_grams must be a positive integer
- If you cannot identify the food clearly, still include your best guess with a descriptive name
- notes: brief comment if portion estimation is uncertain, otherwise null
- Return between 1 and 15 items`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: "imageBase64 and mediaType required" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Analyze this meal photo and return the food items with estimated gram portions as JSON.",
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON — strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("analyze-meal-photo error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
