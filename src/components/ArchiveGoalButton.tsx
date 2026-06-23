"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ArchiveGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleArchive() {
    if (!confirm("Archive this goal?")) return;
    setBusy(true);
    try {
      await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={busy}
      className="text-muted underline-offset-2 transition hover:text-foreground hover:underline disabled:opacity-50"
    >
      {busy ? "Archiving…" : "Archive"}
    </button>
  );
}
