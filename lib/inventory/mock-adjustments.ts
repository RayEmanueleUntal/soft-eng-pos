export interface StockMovement {
  id: string
  date: string
  productId: string
  adjustmentType: "STOCK_IN" | "STOCK_OUT"
  quantity: number
  reason: string
  staffId: string
}

export const mockMovements: StockMovement[] = [
  {
    id: "LOG-001",
    date: "2026-08-24 10:15 AM",
    productId: "PROD-101 (Hex Bolt M8)",
    adjustmentType: "STOCK_IN",
    quantity: 150,
    reason: "New shipment arrival",
    staffId: "EMP-102",
  },
  {
    id: "LOG-002",
    date: "2026-08-24 02:40 PM",
    productId: "PROD-104 (Flange Nut M6)",
    adjustmentType: "STOCK_OUT",
    quantity: 12,
    reason: "Damaged during handling",
    staffId: "EMP-105",
  },
]