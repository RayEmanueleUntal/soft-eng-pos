export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Page content */}
      <main className="p-4">{children}</main>
    </div>
  );
}