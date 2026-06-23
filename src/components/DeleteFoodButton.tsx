"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteFoodButton({ foodId }: { foodId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this food from your library?")) return;
    setLoading(true);
    try {
      await fetch(`/api/nutrition/foods/${foodId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1.5 text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
      aria-label="Delete food"
    >
      <Trash2 size={14} />
    </button>
  );
}
