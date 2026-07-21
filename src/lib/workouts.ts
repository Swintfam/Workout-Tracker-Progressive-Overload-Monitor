export async function getLastSession() {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const { data: latest } = await admin
    .from("workout_sessions")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1);

  const lastDate = latest?.[0]?.date;
  if (!lastDate) return [];

  const { data } = await admin
    .from("workout_sessions")
    .select("date, session_type, exercise, muscle_group, sets, reps, weight")
    .eq("user_id", userId)
    .eq("date", lastDate)
    .order("created_at", { ascending: false });

  return data ?? [];
}
