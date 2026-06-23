"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteLogButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/nutrition/logs/${logId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1 text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
      aria-label="Delete entry"
    >
      <Trash2 size={14} />
    </button>
  );
}
