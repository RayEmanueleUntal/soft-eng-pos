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
import { InventoryItem, StockMovementResponseDto } from "@/lib/inventory/types";
import { StockMovementResponse } from "@/lib/inventory/stock-movement-api";
import { StockAdjustmentModal } from "@/app/dashboard/inventory/_components/StockAdjustmentModal";
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
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

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
  sortKey: SortKey;
  onSortKeyChange: (value: SortKey) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
  onAdjustmentSuccess: (
    movement: StockMovementResponse,
    item: InventoryItem,
  ) => void;
}

const HEAD_CLASS = "";

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ALL: "All Types",
  IN: "In",
  OUT: "Out",
  ADJUSTMENT: "Adjustment",
  SALE: "Sale",
  RETURN: "Return",
};

function badgeVariant(type: StockMovementResponseDto["type"]): BadgeVariant {
  if (type === "IN") return "default";
  if (type === "OUT") return "destructive";
  if (type === "ADJUSTMENT") return "secondary";
  return "outline";
}

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
  sortKey,
  onSortKeyChange,
  hasActiveFilters,
  onResetFilters,
  onRefresh,
  onAdjustmentSuccess,
}: StockMovementHistoryTableProps) {
  const [selectedReason, setSelectedReason] = React.useState<string | null>(
    null,
  );

  return (
    <div className="space-y-4">
      {/* Single-Row Multi-attribute Filter Bar */}
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
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


        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange} // or setStartDate if this component owns useState
          onEndDateChange={onEndDateChange} // or setEndDate if this component owns useState
          inputClassName="h-9"
        />

        <SortSelect
          value={sortKey}
          onChange={onSortKeyChange}
          options={[
            "NAME_ASC",
            "NAME_DESC",
            "STOCK_DESC",
            "STOCK_ASC",
            "DATE_DESC",
            "DATE_ASC",
          ]}
          labelOverrides={{
            STOCK_DESC: {
              shortLabel: "High to Low",
              menuLabel: "Qty Adj High to Low",
            },
            STOCK_ASC: {
              shortLabel: "Low to High",
              menuLabel: "Qty Adj Low to High",
            },
          }}
          triggerClassName="!h-8 w-[125px]"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
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
      <div className="overflow-x-auto rounded-[4px] border border-input bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted border-b border-border">
              <TableHead className={HEAD_CLASS}>Date</TableHead>
              <TableHead className={HEAD_CLASS}>Product</TableHead>
              <TableHead className={HEAD_CLASS}>Type</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Qty Changed
              </TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Before / After
              </TableHead>
              <TableHead className={HEAD_CLASS}>Staff</TableHead>
              <TableHead className={HEAD_CLASS}>Reason</TableHead>
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
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center h-16 text-muted-foreground text-xs"
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((log) => {
                const productName =
                  log.product?.name ?? `Product #${log.productId}`;
                const productSku = log.product?.sku ?? null;
                const baseUom = log.product?.base_uom ?? log.current_uom;

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
                  <TableRow key={log.id} className="h-[36px] border-b border-border hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors">
                    {/* date */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(log.date)}
                    </TableCell>

                    {/* product */}
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground break-words">
                          {productName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {productSku ?? "-"}
                        </span>
                      </div>
                    </TableCell>

                    {/* type */}
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

                    {/* qty changed */}
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
                      {baseUom}
                      {log.current_uom && log.current_uom !== baseUom && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          via {log.current_uom}
                        </span>
                      )}
                    </TableCell>

                    {/* before/after */}
                    <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
                      {log.previous_quantity} → {log.new_quantity}
                    </TableCell>

                    {/* staff */}
                    <TableCell className="text-xs font-medium text-foreground">
                      {staffDisplayName}
                    </TableCell>

                    {/* reason */}
                    <TableCell className="text-xs">
                      {log.reason ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReason(log.reason ?? null)}
                          className="h-7 gap-1.5 rounded-[4px] text-xs border-input hover:bg-muted font-sans"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <Dialog
          open={selectedReason !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedReason(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Movement Reason</DialogTitle>
              <DialogDescription className="sr-only">
                Full reason note recorded for this stock movement
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap break-words">
              {selectedReason}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
