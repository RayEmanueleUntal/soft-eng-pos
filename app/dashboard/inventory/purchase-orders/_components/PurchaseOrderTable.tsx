// Paginated, expandable purchase orders table for the POS inventory module.
// Each row expands to show line items and receipt status; PENDING rows offer a Cancel action.
// Used only by the /dashboard/inventory/purchase-orders page.
"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PO_STATUSES,
  PurchaseOrderDto,
} from "@/lib/inventory/purchase-order-types";
import { formatPeso } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { PurchaseOrderItemsDetail } from "./PurchaseOrderItemsDetail";
import { PurchaseOrderStatusBadge } from "./PurchaseOrderStatusBadge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type POStatus = PurchaseOrderDto["po_status"];
const COLUMN_COUNT = 9;

interface PurchaseOrderTableProps {
  orders: PurchaseOrderDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  canCancel: boolean;
  onPageChange: (page: number) => void;
  onCancelRequest: (order: PurchaseOrderDto) => void;

  // Filter & action props
  statusFilter: POStatus | "ALL";
  onStatusFilterChange: (status: POStatus | "ALL") => void;
  startDate?: string;
  onStartDateChange?: (value: string) => void;
  endDate?: string;
  onEndDateChange?: (value: string) => void;
  sort?: SortKey;
  onSortChange?: (value: SortKey) => void;
  onRefresh: () => void;
  canCreate: boolean;
  onOpenCreateModal: () => void;
}

// Renders the PO list with expandable rows and pagination controls.
export function PurchaseOrderTable({
  orders,
  loading,
  page,
  totalPages,
  total,
  pageSize,
  canCancel,
  onPageChange,
  onCancelRequest,
  statusFilter,
  onStatusFilterChange,
  startDate: externalStartDate,
  onStartDateChange: externalOnStartDateChange,
  endDate: externalEndDate,
  onEndDateChange: externalOnEndDateChange,
  sort: externalSort,
  onSortChange: externalOnSortChange,
  onRefresh,
  canCreate,
  onOpenCreateModal,
}: PurchaseOrderTableProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  const [internalStartDate, setInternalStartDate] = React.useState("");
  const [internalEndDate, setInternalEndDate] = React.useState("");
  const [internalSort, setInternalSort] = React.useState<SortKey>("DEFAULT");

  const startDate = externalStartDate ?? internalStartDate;
  const onStartDateChange = externalOnStartDateChange ?? setInternalStartDate;
  const endDate = externalEndDate ?? internalEndDate;
  const onEndDateChange = externalOnEndDateChange ?? setInternalEndDate;
  const sort = externalSort ?? internalSort;
  const onSortChange = externalOnSortChange ?? setInternalSort;

  // Expands or collapses one row; several rows may stay open at once.
  const toggleRow = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatStatusLabel = (status: string) =>
    status === "ALL"
      ? "All Status"
      : status
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

  const hasClientFilter = Boolean(startDate || endDate || sort !== "DEFAULT");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Status -> Date -> Sort -> Refresh */}
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex flex-col gap-2 w-[220px]">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                onStatusFilterChange((value ?? "ALL") as POStatus | "ALL")
              }
            >
              <SelectTrigger className="!h-9 w-full rounded-[4px] sm:w-44">
                <SelectValue placeholder="All Status">
                  {(value: string) => formatStatusLabel(value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="ALL">All Status</SelectItem>
                {PO_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            inputClassName="h-9 w-[135px]"
          />

          <SortSelect
            value={sort}
            onChange={onSortChange}
            showDefaultOption
            options={[
              "DATE_DESC",
              "DATE_ASC",
              "TOTAL_COST_ASC",
              "TOTAL_COST_DESC",
              "NAME_ASC",
              "NAME_DESC",
              "ID_DESC",
              "ID_ASC",
            ]}
            labelOverrides={{
              TOTAL_COST_DESC: {
                shortLabel: "Total High-Low",
                menuLabel: "Grand Total High to Low",
              },
              TOTAL_COST_ASC: {
                shortLabel: "Total Low-High",
                menuLabel: "Grand Total Low to High",
              },
              NAME_ASC: {
                shortLabel: "Supplier A-Z",
                menuLabel: "Supplier A-Z",
              },
              NAME_DESC: {
                shortLabel: "Supplier Z-A",
                menuLabel: "Supplier Z-A",
              },
            }}
            triggerClassName="w-[170px] !h-9 text-xs rounded-[4px]"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-2.5 text-xs rounded-[4px]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {hasClientFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onStartDateChange("");
                onEndDateChange("");
                onSortChange("DEFAULT");
              }}
              className="h-9 px-2.5 text-xs rounded-[4px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* New Purchase Order Button (Furthest Right) */}
        {canCreate && (
          <div className="ml-auto shrink-0">
            <Button
              onClick={onOpenCreateModal}
              className="h-9 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> New Purchase Order
            </Button>
          </div>
        )}
      </div>

      {/*info subheading */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Purchase Order History
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {total}
        </span>
      </div>

      {/*actual table */}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Grand total</TableHead>
              <TableHead>Order date</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Loading purchase orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No purchase orders found. Use &quot;New Purchase Order&quot;
                  to create one.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const expanded = expandedIds.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                    <TableRow
                      className={`cursor-pointer text-xs transition-colors ${
                        expanded ? "bg-muted/40 font-medium" : ""
                      }`}
                      onClick={() => toggleRow(order.id)}
                    >
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-expanded={expanded}
                          aria-label={
                            expanded
                              ? `Collapse PO #${order.id}`
                              : `Expand PO #${order.id}`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(order.id);
                          }}
                        >
                          {expanded ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-foreground">
                        #{order.id}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span
                          className="block max-w-[220px] truncate"
                          title={order.supplierName}
                        >
                          {order.supplierName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PurchaseOrderStatusBadge status={order.po_status} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {order.items.length}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                        {formatPeso(Number(order.grand_total))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.order_date).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className="block max-w-[160px] truncate"
                          title={order.createdByName}
                        >
                          {order.createdByName}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canCancel && order.po_status === "PENDING" ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancelRequest(order)}
                          >
                            <XCircle /> Cancel PO
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMN_COUNT} className="p-0">
                          <PurchaseOrderItemsDetail listOrder={order} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="purchase orders"
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
