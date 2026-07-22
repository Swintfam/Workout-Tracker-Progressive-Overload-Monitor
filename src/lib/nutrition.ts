import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { getWeekStart, getWeekEnd } from "@/lib/workouts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NutritionTargets {
  id: string;
  user_id: string;
  calories_weekly: number;
  protein_weekly_g: number;
  carbs_weekly_g: number;
  fat_weekly_g: number;
  updated_at: string;
}

export interface NutritionFood {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: number;
  serving_unit: string;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meal_name: string;
  food_name: string;
  food_id: string | null;
  servings: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  notes: string | null;
  created_at: string;
}

export interface DailyMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Per-day requirement = weekly target ÷ 7 */
export function getDailyRequirement(targets: NutritionTargets): DailyMacros {
  return {
    calories: targets.calories_weekly / 7,
    protein_g: targets.protein_weekly_g / 7,
    carbs_g: targets.carbs_weekly_g / 7,
    fat_g: targets.fat_weekly_g / 7,
  };
}

// ─── Targets ──────────────────────────────────────────────────────────────────

export async function getNutritionTargets(): Promise<NutritionTargets | null> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("nutrition_targets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function setNutritionTargets(
  input: Omit<NutritionTargets, "id" | "user_id" | "updated_at">
): Promise<NutritionTargets> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await db
    .from("nutrition_targets")
    .upsert(
      { user_id: userId, ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Food Library ──────────────────────────────────────────────────────────────

export async function getFoodLibrary(): Promise<NutritionFood[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("nutrition_foods")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  return data ?? [];
}

export type AddFoodInput = Pick<
  NutritionFood,
  "name" | "calories" | "protein_g" | "carbs_g" | "fat_g" | "serving_size" | "serving_unit"
>;

export async function addFood(input: AddFoodInput): Promise<NutritionFood> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await db
    .from("nutrition_foods")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFood(id: string): Promise<void> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  await db
    .from("nutrition_foods")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
}

// ─── Meal Logs ─────────────────────────────────────────────────────────────────

export async function getDailyLogs(date: string): Promise<NutritionLog[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export interface AddLogInput {
  date: string;
  meal_name: string;  // e.g. "Breakfast", "Post-workout", user-defined
  food_name: string;  // display name of the food
  food_id?: string | null;
  servings?: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
  sugar_g?: number | null;
  notes?: string | null;
}

export async function addLog(input: AddLogInput): Promise<NutritionLog> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await db
    .from("meals")
    .insert({
      user_id: userId,
      date: input.date,
      meal_name: input.meal_name,
      food_name: input.food_name,
      food_id: input.food_id ?? null,
      servings: input.servings ?? null,
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      fiber_g: input.fiber_g ?? null,
      sugar_g: input.sugar_g ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLog(id: string): Promise<void> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  await db
    .from("meals")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
}

// ─── Aggregates ────────────────────────────────────────────────────────────────

export async function getDailyTotals(date: string): Promise<DailyMacros> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("meals")
    .select("calories, protein_g, carbs_g, fat_g")
    .eq("user_id", userId)
    .eq("date", date);

  return (data ?? []).reduce(
    (sum, row) => ({
      calories: sum.calories + (row.calories ?? 0),
      protein_g: sum.protein_g + (row.protein_g ?? 0),
      carbs_g: sum.carbs_g + (row.carbs_g ?? 0),
      fat_g: sum.fat_g + (row.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export interface DayAdherence {
  date: string;
  totals: DailyMacros;
  /** True if calories AND protein both reached ≥90% of daily requirement */
  met: boolean;
  /** True if any food was logged */
  logged: boolean;
}

/** Adherence for every day in the current week (Mon–Sun). */
export async function getWeeklyAdherence(weekStart?: string): Promise<DayAdherence[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const ws = weekStart ?? getWeekStart();
  const we = getWeekEnd(ws);

  const targets = await getNutritionTargets();
  const dailyReq = targets ? getDailyRequirement(targets) : null;

  const { data } = await db
    .from("meals")
    .select("date, calories, protein_g, carbs_g, fat_g")
    .eq("user_id", userId)
    .gte("date", ws)
    .lte("date", we);

  const byDate: Record<string, DailyMacros> = {};
  for (const row of data ?? []) {
    if (!byDate[row.date]) {
      byDate[row.date] = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    }
    byDate[row.date].calories += row.calories ?? 0;
    byDate[row.date].protein_g += row.protein_g ?? 0;
    byDate[row.date].carbs_g += row.carbs_g ?? 0;
    byDate[row.date].fat_g += row.fat_g ?? 0;
  }

  const result: DayAdherence[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const totals = byDate[dateStr] ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    const logged = totals.calories > 0 || totals.protein_g > 0;
    const met = logged && !!dailyReq &&
      totals.calories >= dailyReq.calories * 0.9 &&
      totals.protein_g >= dailyReq.protein_g * 0.9;
    result.push({ date: dateStr, totals, met, logged });
  }

  return result;
}
