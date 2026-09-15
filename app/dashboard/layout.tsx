"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

import {
  Boxes,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Users,
  UserRound,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "POS",
    href: "/dashboard/pos",
    icon: ShoppingCart,
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
  },
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: UserRound,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/auth/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* =========================
          Desktop Sidebar
      ========================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              P
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">
                POS System
              </span>
              <span className="text-xs text-muted-foreground">Management</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Main Menu
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>{item.name}</span>

                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Staff Account */}
        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Staff User</p>

              <p className="truncate text-xs text-muted-foreground">
                Staff Account
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* =========================
          Mobile Header
      ========================= */}
      <header className="sticky top-0 z-30 border-b bg-background md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              P
            </div>

            <span className="text-sm font-bold">POS System</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* =========================
          Main Content
      ========================= */}
      <div className="md:pl-64">
        {/* Desktop Top Bar */}
        <header className="hidden h-16 items-center justify-between border-b bg-background px-8 md:flex">
          <div>
            <p className="text-sm text-muted-foreground">Management System</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </div>

            <div className="text-right">
              <p className="text-sm font-medium">Staff User</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
