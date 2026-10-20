"use client";

import React, { useEffect, useState } from "react";
import {
  ApprovalRequestResponseDto,
  ApprovalStatus,
  getApprovalRequests,
  approveApprovalRequest,
  rejectApprovalRequest,
} from "@/lib/approval/approval-api";
import { PayloadRenderer } from "@/components/admin/approval-requests/PayloadRenderer";
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
  User,
} from "lucide-react";

export default function ApprovalRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequestResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
    } catch (error) {
      console.error("Failed to load approval requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Status Badge Styling Helper
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> APPROVED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 shrink-0">
            <XCircle className="w-3.5 h-3.5 shrink-0" /> REJECTED
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" /> PENDING
          </Badge>
        );
    }
  };

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      req.id.toString().toLowerCase().includes(query) ||
      req.type.toLowerCase().includes(query) ||
      req.requestedById.toString().toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // Action Handlers
  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    setSubmitting(true);
    try {
      await approveApprovalRequest(approvingRequest.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === approvingRequest.id
            ? { ...r, status: "APPROVED", reviewedById: "ADMIN-CURRENT" }
            : r,
        ),
      );
      setApprovingRequest(null);
      setIsDetailsOpen(false);
    } catch (err) {
      alert("Failed to approve request. Please check API connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setSubmitting(true);
    try {
      await rejectApprovalRequest(rejectingRequest.id, {
        rejectionReason: rejectionReasonInput,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingRequest.id
            ? {
                ...r,
                status: "REJECTED",
                reviewedById: "ADMIN-CURRENT",
                rejectionReason: rejectionReasonInput || "Rejected by Manager",
              }
            : r,
        ),
      );
      setRejectingRequest(null);
      setRejectionReasonInput("");
      setIsDetailsOpen(false);
    } catch (err) {
      alert("Failed to reject request. Please check API connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-primary shrink-0" /> Admin
            Approval Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, or reject store manager overrides and staff
            exception requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
          disabled={loading}
          className="gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Total Requests
            </p>
            <p className="text-2xl font-bold">{requests.length}</p>
          </div>
          <FileCheck className="w-8 h-8 text-muted-foreground/30 shrink-0" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-amber-500/30 bg-amber-500/5">
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {requests.filter((r) => r.status === "PENDING").length}
            </p>
          </div>
          <Clock className="w-8 h-8 text-amber-500/40 shrink-0" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-emerald-500/30 bg-emerald-500/5">
          <div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Approved
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {requests.filter((r) => r.status === "APPROVED").length}
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40 shrink-0" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-rose-500/30 bg-rose-500/5">
          <div>
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
              Rejected
            </p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {requests.filter((r) => r.status === "REJECTED").length}
            </p>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/40 shrink-0" />
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, type, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              Status:
            </span>
            <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs overflow-x-auto w-full sm:w-auto">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md transition-all font-medium whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table with Horizontal Scroll Protection */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Request ID</TableHead>
                <TableHead className="w-[180px]">Type</TableHead>
                <TableHead className="w-[150px]">Requested By</TableHead>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading approval requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No approval requests found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/50">
                    {/* ID Cell */}
                    <TableCell
                      className="font-mono font-medium max-w-[120px] truncate"
                      title={String(req.id)}
                    >
                      {req.id}
                    </TableCell>

                    {/* Type Cell */}
                    <TableCell className="max-w-[180px]">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs break-all text-left whitespace-normal"
                      >
                        {req.type}
                      </Badge>
                    </TableCell>

                    {/* Requested By Cell */}
                    <TableCell className="max-w-[150px]">
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span
                          className="truncate"
                          title={String(req.requestedById)}
                        >
                          {req.requestedById}
                        </span>
                      </div>
                    </TableCell>

                    {/* Date Cell */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleString()}
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell>{getStatusBadge(req.status)}</TableCell>

                    {/* Actions Cell */}
                    <TableCell className="text-right whitespace-nowrap space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2"
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Button>

                      {req.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setApprovingRequest(req)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2.5"
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionReasonInput("");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
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

              {/* Clean Metadata Grid - Prevents Overlaps */}
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
                    {selectedRequest.requestedById}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">
                    Reviewed By
                  </span>
                  <span className="font-semibold break-words text-foreground">
                    {selectedRequest.reviewedById || "Pending Review"}
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
  );
}
