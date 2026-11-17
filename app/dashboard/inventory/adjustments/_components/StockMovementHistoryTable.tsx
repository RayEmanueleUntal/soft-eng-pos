// Movement log table for the Stock Adjustments page of the POS inventory module.
// Shows each recorded movement with product, type, quantity change, before/after, reason and resolved staff name.
"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  InventoryItem,
  StockMovementResponseDto,
} from "@/lib/inventory/types";
import { StockMovementResponse } from "@/lib/inventory/stock-movement-api";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, RefreshCw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MovementSortOrder =
  | "DEFAULT"
  | "NAME_ASC"
  | "NAME_DESC"
  | "QTY_DESC"
  | "QTY_ASC";

const SORT_LABELS: Record<MovementSortOrder, string> = {
  DEFAULT: "Default Sort",
  NAME_ASC: "A-Z",
  NAME_DESC: "Z-A",
  QTY_DESC: "High to Low",
  QTY_ASC: "Low to High",
};

interface CategoryOption {
  id: number | string;
  name: string;
}

interface StockMovementHistoryTableProps {
  movements: StockMovementResponseDto[];
  staffMap?: Record<number, string>;
  loading?: boolean;
  totalCount: number;

  // Filter & action props
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoriesList?: CategoryOption[];
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
  onAdjustmentSuccess: (
    movement: StockMovementResponse,
    item: InventoryItem,
  ) => void;
}

const HEAD_CLASS =
  "text-foreground font-semibold font-mono text-[11px] uppercase tracking-wider";

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ALL: "All Types",
  IN: "In",
  OUT: "Out",
  ADJUSTMENT: "Adjustment",
  SALE: "Sale",
  RETURN: "Return",
};

// Picks a badge style for a movement type.
function badgeVariant(type: StockMovementResponseDto["type"]): BadgeVariant {
  if (type === "IN") return "default";
  if (type === "OUT") return "destructive";
  if (type === "ADJUSTMENT") return "secondary";
  return "outline";
}

// Formats an ISO date as a short local date and time.
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

// Renders the movement log, newest first as supplied by the page.
export function StockMovementHistoryTable({
  movements,
  staffMap = {},
  loading = false,
  totalCount,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoriesList = [],
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  hasActiveFilters,
  onResetFilters,
  onRefresh,
  onAdjustmentSuccess,
}: StockMovementHistoryTableProps) {
  const [sortOrder, setSortOrder] = React.useState<MovementSortOrder>("DEFAULT");

  const displayedMovements = React.useMemo(() => {
    const list = [...movements];
    if (sortOrder === "NAME_ASC") {
      list.sort((a, b) =>
        (a.product?.name ?? `Product #${a.productId}`).localeCompare(
          b.product?.name ?? `Product #${b.productId}`,
        ),
      );
    } else if (sortOrder === "NAME_DESC") {
      list.sort((a, b) =>
        (b.product?.name ?? `Product #${b.productId}`).localeCompare(
          a.product?.name ?? `Product #${a.productId}`,
        ),
      );
    } else if (sortOrder === "QTY_ASC") {
      list.sort((a, b) => a.quantity_changed - b.quantity_changed);
    } else if (sortOrder === "QTY_DESC") {
      list.sort((a, b) => b.quantity_changed - a.quantity_changed);
    }
    return list;
  }, [movements, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Single-Row Multi-attribute Filter Bar */}
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product, SKU, or reason..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 w-[220px] text-xs rounded-[2px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Movement Type</Label>
          <Select
            value={typeFilter}
            onValueChange={(val) => onTypeFilterChange(val ?? "ALL")}
          >
            <SelectTrigger className="!h-8 w-[120px] text-xs rounded-[2px]">
              <SelectValue placeholder="All Types">
                {MOVEMENT_TYPE_LABELS[typeFilter] ?? "All Types"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs">
                All Types
              </SelectItem>
              <SelectItem value="IN" className="text-xs">
                In
              </SelectItem>
              <SelectItem value="OUT" className="text-xs">
                Out
              </SelectItem>
              <SelectItem value="ADJUSTMENT" className="text-xs">
                Adjustment
              </SelectItem>
              <SelectItem value="SALE" className="text-xs">
                Sale
              </SelectItem>
              <SelectItem value="RETURN" className="text-xs">
                Return
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoriesList.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={categoryFilter}
              onValueChange={(val) => onCategoryFilterChange(val ?? "ALL")}
            >
              <SelectTrigger className="!h-8 w-[160px] text-xs rounded-[2px]">
                <SelectValue placeholder="Category">
                  {(val: string | null) => {
                    if (!val || val === "ALL") return "All Categories";
                    return (
                      categoriesList.find((cat) => String(cat.id) === val)
                        ?.name ?? "Category"
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="ALL" className="text-xs">
                  All Categories
                </SelectItem>
                {categoriesList.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={String(cat.id)}
                    className="text-xs"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>Date Range</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 w-[125px] text-xs rounded-[2px] font-mono"
            />
            <span className="text-xs text-muted-foreground">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 w-[125px] text-xs rounded-[2px] font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Sort</Label>
          <Select
            value={sortOrder}
            onValueChange={(val) =>
              setSortOrder((val ?? "DEFAULT") as MovementSortOrder)
            }
          >
            <SelectTrigger className="!h-8 w-[125px] text-xs rounded-[2px] justify-start gap-2 [&>svg:last-child]:hidden">
              <ArrowUpDown className="h-3.5 w-2.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Filters">
                {SORT_LABELS[sortOrder] ?? "Filters"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="NAME_ASC" className="text-xs">
                Alphabetical A-Z
              </SelectItem>
              <SelectItem value="NAME_DESC" className="text-xs">
                Alphabetical Z-A
              </SelectItem>
              <SelectItem value="QTY_DESC" className="text-xs">
                Qty High to Low
              </SelectItem>
              <SelectItem value="QTY_ASC" className="text-xs">
                Qty Low to High
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(hasActiveFilters || sortOrder !== "DEFAULT") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSortOrder("DEFAULT");
              onResetFilters();
            }}
            className="h-8 px-2 text-xs rounded-[2px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8 rounded-[2px] shrink-0"
          title="Refresh movements"
          aria-label="Refresh movements"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        {/* Add Stock Adjustment Button (Furthest Right) */}
        <div className="ml-auto">
          <StockAdjustmentModal onSuccess={onAdjustmentSuccess} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Stock Movement History
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {totalCount}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-[4px] border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
              <TableHead className={HEAD_CLASS}>Date</TableHead>
              <TableHead className={HEAD_CLASS}>Product</TableHead>
              <TableHead className={HEAD_CLASS}>Type</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Qty Changed
              </TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Before / After
              </TableHead>
              <TableHead className={HEAD_CLASS}>Reason</TableHead>
              <TableHead className={HEAD_CLASS}>Staff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center h-20 text-muted-foreground text-xs"
                >
                  Loading stock movements...
                </TableCell>
              </TableRow>
            ) : displayedMovements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center h-16 text-muted-foreground text-xs"
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              displayedMovements.map((log) => {
                const productName =
                  log.product?.name ?? `Product #${log.productId}`;
                const productSku = log.product?.sku ?? null;

                // Staff name resolution priority:
                // 1. Staff map (from /staff-users/{id})
                // 2. Nested staff object (first/last or username)
                // 3. Fallback Staff #ID
                let staffDisplayName = staffMap[log.staffId];
                if (!staffDisplayName && log.staff) {
                  const first =
                    log.staff.first_name || log.staff.firstName || "";
                  const last = log.staff.last_name || log.staff.lastName || "";
                  const full = `${first} ${last}`.trim();
                  staffDisplayName =
                    full || log.staff.username || `Staff #${log.staffId}`;
                }
                if (!staffDisplayName) {
                  staffDisplayName = `Staff #${log.staffId}`;
                }

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(log.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">
                          {productName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {productSku ?? "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={badgeVariant(log.type)}
                          className="text-[10px] font-mono"
                        >
                          {log.type}
                        </Badge>
                        {log.isOverride && (
                          <span className="text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/20 px-1 py-0.5 rounded-[2px] font-bold">
                            Override
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums text-xs font-bold ${
                        log.quantity_changed >= 0
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {log.quantity_changed >= 0
                        ? `+${log.quantity_changed}`
                        : log.quantity_changed}{" "}
                      {log.current_uom}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
                      {log.previous_quantity} → {log.new_quantity}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-xs max-w-[200px] truncate"
                      title={log.reason}
                    >
                      {log.reason || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {staffDisplayName}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}