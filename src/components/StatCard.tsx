import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  accent?: boolean;
};

export default function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = false,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            accent ? "bg-accent text-background" : "bg-surface-hover text-muted"
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
