"use client";

import {
  Brain,
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Salad,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", soon: false },
  { label: "Workouts", icon: Dumbbell, href: "/workouts", soon: false },
  { label: "Calendar", icon: CalendarDays, href: "/calendar", soon: false },
  { label: "Nutrition", icon: Salad, href: "/nutrition", soon: false },
  { label: "Goals", icon: Target, href: "/goals", soon: false },
  { label: "Mental Health", icon: Brain, href: "/mental-health", soon: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-border bg-surface px-4 py-6">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-background">
            N
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Naeem</p>
            <p className="text-xs leading-tight text-muted">Dashboard</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, href, soon }) => {
            if (soon) {
              return (
                <div
                  key={label}
                  className="flex cursor-default items-center justify-between rounded-xl px-3 py-2 text-sm opacity-60 text-muted"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {label}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    Soon
                  </span>
                </div>
              );
            }

            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-accent font-medium text-background"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 px-2">
        <div className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted">
          <Settings size={18} />
          Settings
        </div>
        <ThemeToggle />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
