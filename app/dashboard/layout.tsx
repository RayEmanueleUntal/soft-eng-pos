// Dashboard shell for the POS system: sidebar, mobile navigation and top bar.
// Shows main modules and the Inventory sub-links (ROP, Adjustments), hiding stock-only and admin links by role.
// Wraps every /dashboard page and handles sign-out.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { ReactNode, useState } from "react";

import {
  Boxes,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
  UserRound,
  Truck,
  UserStar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { canManageStock } from "@/lib/auth/permissions";
import { Role, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { clearAuthSession, useCurrentUserName } from "@/lib/auth/storage";
import Image from "next/image";

import { STORE_CONFIG } from "@/lib/pos";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavChild {
  name: string;
  href: string;
  requiresStockRole?: boolean;
  allowedRoles?: Role[];
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof Boxes;
  children?: NavChild[];
  allowedRoles?: Role[];
}

const navigation: NavItem[] = [
  {
    name: "POS",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    children: [
      {
        name: "Receipts",
        href: "/dashboard/pos/receipt",
      },
    ],
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    children: [
      { name: "ROP", href: "/dashboard/inventory/rop" },
      { name: "Bin Locations", href: "/dashboard/inventory/bins" },
      {
        name: "Adjustments",
        href: "/dashboard/inventory/adjustments",
        requiresStockRole: true,
      },
      {
        name: "Deliveries",
        href: "/dashboard/inventory/deliveries",
      },
      {
        name: "Purchase Orders",
        href: "/dashboard/inventory/purchase-orders",
        allowedRoles: ROLE_PERMISSIONS["/dashboard/inventory/purchase-orders"],
      },
    ],
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
    name: "Forwarders",
    href: "/dashboard/forwarders",
    icon: Truck,
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: UserRound,
  },
  {
    name: "Admin",
    href: "/dashboard/admin/system-settings",
    icon: UserStar,
    allowedRoles: ROLE_PERMISSIONS["/dashboard/admin"],
    children: [
      {
        name: "System Settings",
        href: "/dashboard/admin/system-settings",
      },
      {
        name: "Request Approvals",
        href: "/dashboard/admin/approval-requests",
      },
    ],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useCurrentRole();
  const username = useCurrentUserName();

  // State initialized with all parent hrefs containing children so they start open by default.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (item.children && item.children.length > 0) {
        initial[item.href] = true;
      }
    });
    return initial;
  });

  const toggleSubmenu = (href: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const visibleNavigation = navigation.filter(
    (item) =>
      !item.allowedRoles ||
      (!!role && item.allowedRoles.includes(role as Role)),
  );

  function getVisibleChildren(item: NavItem): NavChild[] {
    return (item.children ?? []).filter(
      (child) =>
        (!child.requiresStockRole || canManageStock(role)) &&
        (!child.allowedRoles ||
          (!!role && child.allowedRoles.includes(role as Role))),
    );
  }

  async function handleLogout() {
    clearAuthSession();

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/auth/login");
    router.refresh();
  }

  function isActive(href: string, exact = false) {
    if (href === "/dashboard" || exact) {
      return pathname === href;
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
        <div className="flex h-auto min-h-[4rem] items-center border-b px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src={"/images/logo.png"}
                alt="logo"
                fill
                priority
                sizes="40px"
                className="object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold leading-tight tracking-tight text-foreground break-words">
                {STORE_CONFIG.name}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                POS & Inventory System
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Main Menu
          </p>

          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const children = getVisibleChildren(item);
            const hasChildren = children.length > 0;
            const isOpen = !!openItems[item.href];
            const active = isActive(item.href, hasChildren);

            return (
              <div key={item.href} className="space-y-1">
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`group flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>

                  {/* Toggle button for collapsible sub-items */}
                  {hasChildren && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSubmenu(item.href)}
                      className="ml-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Toggle ${item.name} sub-menu`}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Sub-links (visible when open) */}
                {hasChildren && isOpen && (
                  <div className="ml-4 space-y-1 border-l pl-2">
                    {children.map((child) => {
                      const childActive = isActive(child.href, true);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            childActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Staff Account */}
        <div className="border-t p-3">
          <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{username}</p>
              <p className="truncate text-xs text-muted-foreground">{role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive"
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
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
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
        <nav className="flex gap-0.5 overflow-x-auto border-t px-3 py-2">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, !!item.children);

            return (
              <React.Fragment key={item.href}>
                <Link
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

                {getVisibleChildren(item).map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`flex shrink-0 items-center rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      isActive(child.href, true)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {child.name}
                  </Link>
                ))}
              </React.Fragment>
            );
          })}
        </nav>
      </header>

      {/* =========================
          Main Content
      ========================= */}
      <div className="md:pl-64">
        <main className="min-h-[calc(100vh-4rem)] p-3 md:p-8">{children}</main>
      </div>
    </div>
  );
}
