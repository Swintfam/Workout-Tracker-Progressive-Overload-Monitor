import Sidebar from "@/components/Sidebar";
import NutritionDateNav from "@/components/NutritionDateNav";
import NutritionPageClient from "@/components/NutritionPageClient";
import {
  getNutritionTargets,
  getDailyLogs,
  getDailyTotals,
  getDailyRequirement,
  getFoodLibrary,
  getWeeklyAdherence,
} from "@/lib/nutrition";
import { getWeekStart } from "@/lib/workouts";

interface SearchParams {
  date?: string;
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const today = new Date().toISOString().split("T")[0];
  const activeDate = searchParams.date ?? today;
  const weekStart = getWeekStart();

  const [targets, logs, totals, foods, adherence] = await Promise.all([
    getNutritionTargets(),
    getDailyLogs(activeDate),
    getDailyTotals(activeDate),
    getFoodLibrary(),
    getWeeklyAdherence(weekStart),
  ]);

  const dailyReq = targets ? getDailyRequirement(targets) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nutrition</h1>
          <NutritionDateNav activeDate={activeDate} />
        </header>

        <NutritionPageClient
          logs={logs}
          totals={totals}
          dailyReq={dailyReq}
          foods={foods}
          adherence={adherence}
          targets={targets}
          activeDate={activeDate}
          today={today}
        />
      </main>
    </div>
  );
}
