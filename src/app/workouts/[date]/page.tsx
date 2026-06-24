import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SessionEditor from "@/components/SessionEditor";
import { getSessionByDate } from "@/lib/workouts";

export default async function SessionDetailPage({
  params,
}: {
  params: { date: string };
}) {
  const { date } = params;
  const exercises = await getSessionByDate(date);

  const sessionType = exercises[0]?.session_type ?? "Session";
  const label = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 px-8 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/workouts"
              className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{sessionType} Day</h1>
              <p className="text-sm text-muted">{label}</p>
            </div>
          </div>

          <SessionEditor date={date} initialExercises={exercises} />
        </div>
      </main>
    </div>
  );
}
