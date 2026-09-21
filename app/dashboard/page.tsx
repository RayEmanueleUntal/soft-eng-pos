import Link from "next/link";

import {
  ArrowUpRight,
  Boxes,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickActions = [
  {
    title: "Point of Sale",
    description: "Process a new transaction",
    href: "/dashboard/pos",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    description: "View and manage stock",
    href: "/dashboard/inventory",
    icon: Boxes,
  },
  {
    title: "Products",
    description: "Manage your products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Customers",
    description: "View customer records",
    href: "/dashboard/customers",
    icon: Users,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here&apos;s an overview of your system.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Sales
            </CardTitle>

            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">₱0.00</div>

            <p className="mt-1 text-xs text-muted-foreground">
              Today&apos;s total sales
            </p>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">0</div>

            <p className="mt-1 text-xs text-muted-foreground">
              Products in the system
            </p>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>

            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">0</div>

            <p className="mt-1 text-xs text-muted-foreground">
              Items currently in stock
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>

            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">0</div>

            <p className="mt-1 text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>

          <p className="text-sm text-muted-foreground">
            Quickly access frequently used areas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Card
                key={action.href}
                className="group transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  {/* Icon */}
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold">{action.title}</h3>

                  {/* Description */}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {action.description}
                  </p>

                  {/* Action */}
                  <Link
                    href={action.href}
                    className="mt-4 -ml-3 inline-flex h-9 items-center justify-center gap-0.5 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Open
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
