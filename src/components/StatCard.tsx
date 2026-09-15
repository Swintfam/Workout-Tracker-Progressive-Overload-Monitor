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
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-medium text-muted leading-tight">{label}</span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg lg:h-9 lg:w-9 lg:rounded-xl ${
            accent ? "bg-accent text-background" : "bg-surface-hover text-muted"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold leading-none lg:text-2xl">{value}</p>
        {sublabel && <p className="text-[10px] text-muted mt-1 leading-tight lg:text-xs">{sublabel}</p>}
      </div>
    </div>
  );
}
