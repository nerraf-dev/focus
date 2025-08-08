"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, LayoutDashboard, Timer as TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: React.ElementType }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden w-full flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">FocusFlow</span>
        </Link>
        <div className="flex-1" />
        <NavLink href="/" icon={TimerIcon}>
          Timer
        </NavLink>
        <NavLink href="/dashboard" icon={LayoutDashboard}>
          Dashboard
        </NavLink>
      </nav>
      {/* Mobile Nav could be added here with a Sheet component */}
    </header>
  );
}
