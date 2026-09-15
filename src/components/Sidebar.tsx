"use client";

import {
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  PersonStanding,
  Plus,
  Salad,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", soon: false },
  { label: "Workouts", icon: Dumbbell, href: "/workouts", soon: false },
  { label: "Calendar", icon: CalendarDays, href: "/calendar", soon: false },
  { label: "Nutrition", icon: Salad, href: "/nutrition", soon: false },
  { label: "Goals", icon: Target, href: "/goals", soon: false },
  { label: "Body", icon: PersonStanding, href: "/body", soon: false },
];

const bottomTabs = [
  { label: "Home", icon: LayoutDashboard, href: "/" },
  { label: "Workouts", icon: Dumbbell, href: "/workouts" },
  { label: "Nutrition", icon: Salad, href: "/nutrition" },
  { label: "Body", icon: PersonStanding, href: "/body" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("You");

  useEffect(() => {
    fetch("/api/user-targets")
      .then((r) => r.json())
      .then((data) => {
        if (data?.display_name) setDisplayName(data.display_name);
      })
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
    {/* ── MOBILE BOTTOM NAV ── */}
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      {/* Floating bar */}
      <div className="mx-3 mb-3 flex items-center justify-around rounded-2xl bg-surface/90 backdrop-blur-md shadow-[0_-2px_32px_rgba(0,0,0,0.18)] border border-border/60 px-1 py-1">

        {/* Left two tabs */}
        {bottomTabs.slice(0, 2).map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-all">
              <span className={`flex items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? "bg-accent/15 px-4 py-2"
                  : "px-4 py-2"
              }`}>
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${active ? "text-accent" : "text-muted"}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>
              <span className={`text-[9px] font-medium transition-colors duration-200 ${active ? "text-accent" : "text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB — Log workout */}
        <Link href="/workouts/log" className="flex flex-col items-center gap-0.5 -mt-5 px-2">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 ${
            pathname === "/workouts/log"
              ? "bg-accent scale-95 shadow-accent/30"
              : "bg-accent shadow-accent/25 hover:scale-105"
          }`}
            style={{ boxShadow: "0 4px 20px rgba(var(--color-accent), 0.35)" }}
          >
            <Plus size={26} className="text-background" strokeWidth={2.5} />
          </span>
          <span className={`text-[9px] font-medium mt-0.5 transition-colors ${
            pathname === "/workouts/log" ? "text-accent" : "text-muted"
          }`}>
            Log
          </span>
        </Link>

        {/* Right two tabs */}
        {bottomTabs.slice(2).map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-all">
              <span className={`flex items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? "bg-accent/15 px-4 py-2"
                  : "px-4 py-2"
              }`}>
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${active ? "text-accent" : "text-muted"}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>
              <span className={`text-[9px] font-medium transition-colors duration-200 ${active ? "text-accent" : "text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>

    {/* ── DESKTOP SIDEBAR ── */}
    <aside className="hidden lg:flex h-screen w-64 flex-col justify-between border-r border-border bg-surface px-4 py-6">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-background">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{displayName}</p>
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
    </>
  );
}
