// Admin approval-request queue for return/exchange and similar pending actions.
// Loads the full list, then filters by search/status and pages the filtered rows in the browser.
// TablePagination stays visible even when the filtered list fits on one page.
"use client";

import React, { useEffect, useState } from "react";
import {
  ApprovalRequestResponseDto,
  ApprovalStatus,
  getApprovalRequests,
  approveApprovalRequest,
  rejectApprovalRequest,
} from "@/lib/approval/approval-api";
import { fetchStaffUserById } from "@/lib/inventory/stock-movement-api";
import { PayloadRenderer } from "@/app/dashboard/admin/approval-requests/_components/PayloadRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Filter,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/pageheader";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE = 15;

const HEAD_CLASS =
  "text-foreground font-semibold font-mono text-[11px] uppercase tracking-wider";

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

export default function ApprovalRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequestResponseDto[]>([]);
  const [staffMap, setStaffMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Modal States
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequestResponseDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [rejectingRequest, setRejectingRequest] =
    useState<ApprovalRequestResponseDto | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");
  const [approvingRequest, setApprovingRequest] =
    useState<ApprovalRequestResponseDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load Requests
  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getApprovalRequests();
      setRequests(data);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load approval requests:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load approval requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Resolve requestedById to staff name
  useEffect(() => {
    const missingIds = Array.from(
      new Set(
        requests
          .map((r) => Number(r.requestedById))
          .filter((id) => Boolean(id) && !staffMap[id]),
      ),
    );

    if (missingIds.length === 0) return;

    Promise.allSettled(
      missingIds.map((id) =>
        fetchStaffUserById(id)
          .then((user) => {
            const name =
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.username ||
              `Staff #${id}`;
            return { id, name };
          })
          .catch(() => ({ id, name: `Staff #${id}` })),
      ),
    ).then((results) => {
      setStaffMap((prev) => {
        const next = { ...prev };
        results.forEach((res) => {
          if (res.status === "fulfilled") {
            next[res.value.id] = res.value.name;
          }
        });
        return next;
      });
    });
  }, [requests, staffMap]);

  // Status Badge Styling Helper
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 shrink-0 text-[10px] font-mono">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> APPROVED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 shrink-0 text-[10px] font-mono">
            <XCircle className="w-3 h-3 shrink-0" /> REJECTED
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 shrink-0 text-[10px] font-mono">
            <Clock className="w-3 h-3 animate-pulse shrink-0" /> PENDING
          </Badge>
        );
    }
  };

  // Filter Logic (original logic preserved)
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      req.id.toString().toLowerCase().includes(query) ||
      req.type.toLowerCase().includes(query) ||
      req.requestedById.toString().toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // Action Handlers (original logic preserved)
  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await approveApprovalRequest(approvingRequest.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === approvingRequest.id ? updated : r)),
      );
      setApprovingRequest(null);
      setIsDetailsOpen(false);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || "Failed to approve request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await rejectApprovalRequest(rejectingRequest.id, {
        rejectionReason: rejectionReasonInput,
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === rejectingRequest.id ? updated : r)),
      );
      setRejectingRequest(null);
      setRejectionReasonInput("");
      setIsDetailsOpen(false);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || "Failed to reject request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

return (
    <div className="flex-1 space-y-6">
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        <PageHeader
          header="Approval Requests"
          subheader="Review, approve, or reject store manager overrides and staff exception requests."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-row items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium">
                Total Requests
              </p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-0.5">
                {requests.length}
              </p>
            </div>
            <FileCheck className="w-8 h-8 text-muted-foreground/30 shrink-0" />
          </Card>

          <Card className="p-4 flex flex-row items-center justify-between gap-3 border-amber-500/30 bg-amber-500/5">
            <div className="text-left">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Pending Review
              </p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-0.5 text-amber-700 dark:text-amber-400">
                {requests.filter((r) => r.status === "PENDING").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-500/40 shrink-0" />
          </Card>

          <Card className="p-4 flex flex-row items-center justify-between gap-3 border-emerald-500/30 bg-emerald-500/5">
            <div className="text-left">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Approved
              </p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-0.5 text-emerald-700 dark:text-emerald-400">
                {requests.filter((r) => r.status === "APPROVED").length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 shrink-0" />
          </Card>

          <Card className="p-4 flex flex-row items-center justify-between gap-3 border-rose-500/30 bg-rose-500/5">
            <div className="text-left">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                Rejected
              </p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-0.5 text-rose-700 dark:text-rose-400">
                {requests.filter((r) => r.status === "REJECTED").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-rose-500/40 shrink-0" />
          </Card>
        </div>

        {actionError && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 break-words">{actionError}</span>
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Status Bar (h-9) + Refresh Button directly to the right */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              Status:
            </span>
          </div>

          <div className="inline-flex h-9 items-center gap-1 bg-muted p-1 rounded-md text-xs overflow-x-auto">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`h-full px-3 rounded-[4px] inline-flex items-center justify-center transition-all font-medium whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={loadRequests}
            disabled={loading}
            className="h-9 px-3 gap-2 text-xs rounded-md shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-heading font-semibold text-foreground">
            Approval Request History
          </h2>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Total records: {filteredRequests.length}
          </span>
        </div>

        {/* Table + Flush Footer (py-0 gap-0 removes Card's default vertical spacing) */}
        <Card className="py-0 gap-0 overflow-hidden rounded-[4px]">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  <TableHead className={HEAD_CLASS}>Request ID</TableHead>
                  <TableHead className={HEAD_CLASS}>Date</TableHead>
                  <TableHead className={HEAD_CLASS}>Type</TableHead>
                  <TableHead className={HEAD_CLASS}>Status</TableHead>
                  <TableHead className={HEAD_CLASS}>Requested By</TableHead>
                  <TableHead className={HEAD_CLASS}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-20 text-muted-foreground text-xs"
                    >
                      Loading approval requests...
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-16 text-muted-foreground text-xs"
                    >
                      No approval requests found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((req) => {
                    const requesterName =
                      staffMap[Number(req.requestedById)] ||
                      (req.requestedById ? `Staff #${req.requestedById}` : "-");

                    return (
                      <TableRow key={req.id}>
                        {/* Request ID */}
                        <TableCell
                          className="font-mono text-xs font-medium text-foreground max-w-[120px] truncate"
                          title={String(req.id)}
                        >
                          #{req.id}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </TableCell>

                        {/* Type */}
                        <TableCell className="max-w-[180px]">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono break-all text-left whitespace-normal"
                          >
                            {req.type}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>{getStatusBadge(req.status)}</TableCell>

                        {/* Requested By (Resolved Staff Name) */}
                        <TableCell className="text-xs font-medium text-foreground max-w-[160px] truncate">
                          <span title={requesterName}>{requesterName}</span>
                        </TableCell>

                        {/* Actions (Details only) */}
                        <TableCell className="text-xs whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsDetailsOpen(true);
                            }}
                            className="h-7 gap-1.5 rounded-[4px] text-xs border-input hover:bg-muted font-sans"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>

          <div className="border-t px-4 py-2.5 bg-card">
            <TablePagination
              className="w-full px-0"
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={PAGE_SIZE}
              itemLabel="requests"
              loading={loading}
              onPageChange={setPage}
            />
          </div>
        </Card>

        {/* Details & Payload Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between gap-2 pr-4 flex-wrap sm:flex-nowrap">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 break-words">
                      Request Details ({selectedRequest.id})
                    </DialogTitle>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <DialogDescription className="break-words">
                    Review the audit trail metadata and payload content before
                    deciding.
                  </DialogDescription>
                </DialogHeader>

                {/* Clean Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">
                      Approval Type
                    </span>
                    <span className="font-semibold break-words text-foreground">
                      {selectedRequest.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">
                      Requested By
                    </span>
                    <span className="font-semibold break-words text-foreground">
                      {staffMap[Number(selectedRequest.requestedById)] ||
                        selectedRequest.requestedById}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">
                      Reviewed By
                    </span>
                    <span className="font-semibold break-words text-foreground">
                      {selectedRequest.reviewedById
                        ? staffMap[Number(selectedRequest.reviewedById)] ||
                          selectedRequest.reviewedById
                        : "Pending Review"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">
                      Created At
                    </span>
                    <span className="text-foreground">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block font-medium">
                      Updated At
                    </span>
                    <span className="text-foreground">
                      {new Date(selectedRequest.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rejection Reason Box */}
                {selectedRequest.rejectionReason && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Rejection
                      Reason:
                    </span>
                    <p className="text-rose-900 dark:text-rose-200 break-words whitespace-pre-wrap">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Payload Data Container */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Request Payload Data
                  </h4>
                  <Card className="p-4 bg-background overflow-x-auto">
                    <PayloadRenderer data={selectedRequest.payload} />
                  </Card>
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  {selectedRequest.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setRejectingRequest(selectedRequest);
                          setRejectionReasonInput("");
                        }}
                      >
                        Reject Request
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setApprovingRequest(selectedRequest)}
                      >
                        Approve Request
                      </Button>
                    </div>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Approve Modal */}
        <Dialog
          open={!!approvingRequest}
          onOpenChange={() => setApprovingRequest(null)}
        >
          <DialogContent className="w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Approve Request?</DialogTitle>
              <DialogDescription className="break-words">
                Are you sure you want to approve request{" "}
                <strong className="text-foreground break-all">
                  {approvingRequest?.id}
                </strong>
                ? This action will execute the associated system override.
              </DialogDescription>
            </DialogHeader>
            {actionError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{actionError}</span>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setApprovingRequest(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmApprove}
                disabled={submitting}
              >
                {submitting ? "Approving..." : "Confirm Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Reject Modal */}
        <Dialog
          open={!!rejectingRequest}
          onOpenChange={() => setRejectingRequest(null)}
        >
          <DialogContent className="w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription className="break-words">
                Please provide an optional reason for rejecting request{" "}
                <strong className="text-foreground break-all">
                  {rejectingRequest?.id}
                </strong>
                .
              </DialogDescription>
            </DialogHeader>

            {actionError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{actionError}</span>
              </div>
            )}

            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Rejection Reason
              </label>
              <Textarea
                placeholder="e.g., Exceeds maximum allowed override threshold or policy guidelines."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectingRequest(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={submitting}
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}