import {
  Brain,
  Dumbbell,
  Film,
  LayoutDashboard,
  Salad,
  Settings,
  Target,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", status: "active" },
  { label: "Workouts", icon: Dumbbell, href: "/workouts", status: "soon" },
  { label: "Nutrition", icon: Salad, href: "/nutrition", status: "soon" },
  { label: "Goals", icon: Target, href: "/goals", status: "soon" },
  { label: "Content", icon: Film, href: "/content", status: "soon" },
  { label: "Mental Health", icon: Brain, href: "/mental-health", status: "soon" },
] as const;

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-border bg-surface px-4 py-6">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-background font-bold">
            N
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Naeem</p>
            <p className="text-xs text-muted leading-tight">Dashboard</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, status }) => {
            const isActive = status === "active";
            const isSoon = status === "soon";
            return (
              <div
                key={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-accent text-background font-medium"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                } ${isSoon ? "cursor-default opacity-60" : "cursor-pointer"}`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </span>
                {isSoon && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    Soon
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted">
          <Settings size={18} />
          Settings
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
