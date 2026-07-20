import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AddFoodForm from "@/components/AddFoodForm";
import { getFoodLibrary } from "@/lib/nutrition";
import DeleteFoodButton from "@/components/DeleteFoodButton";

export default async function FoodLibraryPage() {
  const foods = await getFoodLibrary();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
        <header className="mb-8">
          <Link
            href="/nutrition"
            className="mb-2 flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
          >
            <ChevronLeft size={14} />
            Back to Nutrition
          </Link>
          <h1 className="text-2xl font-semibold">Food Library</h1>
          <p className="text-sm text-muted">{foods.length} saved food{foods.length !== 1 ? "s" : ""}</p>
        </header>

        <div className="flex flex-col gap-6">
          {/* Add food form */}
          <AddFoodForm />

          {/* Library list */}
          {foods.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center text-sm text-muted">
              Your library is empty. Add a food above to get started.
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <span>Name</span>
                <span className="text-right">Cal</span>
                <span className="text-right">Protein</span>
                <span className="text-right">Carbs</span>
                <span className="text-right">Fat</span>
                <span />
              </div>
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
                >
                  <div>
                    <span className="font-medium">{food.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      per {food.serving_size} {food.serving_unit}
                    </span>
                  </div>
                  <span className="text-right text-muted">{food.calories}</span>
                  <span className="text-right text-muted">{food.protein_g}g</span>
                  <span className="text-right text-muted">{food.carbs_g}g</span>
                  <span className="text-right text-muted">{food.fat_g}g</span>
                  <DeleteFoodButton foodId={food.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
