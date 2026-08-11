import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Dashboard</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard/products"
            className="block px-3 py-2 rounded hover:bg-gray-200"
          >
            Products
          </Link>
          {/* Later add more links here: Customers, Inventory, Reports, etc. */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
