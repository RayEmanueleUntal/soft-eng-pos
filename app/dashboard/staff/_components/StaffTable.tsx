"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CheckIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaffRow } from "./StaffRow";
import { AddStaffModal } from "./AddStaffModal";
import { Staff, AssignedRole } from "@/lib/staff/types";
import { Label } from "@/components/ui/label";

const LIMIT = 10;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type RoleFilter = "ALL" | AssignedRole;

export function StaffTable() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);

  // Modal & Row Loading States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [fetchingUserId, setFetchingUserId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const formatRole = (role: AssignedRole | string) => {
    return String(role)
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Scoped Counts for Status Tabs
  const roleScopedStaff =
    roleFilter === "ALL"
      ? staffList
      : staffList.filter((s) => s.assigned_role === roleFilter);

  const activeCount = roleScopedStaff.filter((s) => s.is_active).length;
  const inactiveCount = roleScopedStaff.filter((s) => !s.is_active).length;

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: roleScopedStaff.length },
    { key: "ACTIVE", label: "Active", count: activeCount },
    { key: "INACTIVE", label: "Inactive", count: inactiveCount },
  ];

  // Fetch staff users from backend: GET /staff-users
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/staff-users", {
        params: {
          limit: 100,
        },
      });

      const items = response.data?.data;
      if (Array.isArray(items)) {
        const normalizedStaff: Staff[] = items.map(
          (item: {
            id: number;
            username: string;
            first_name: string;
            last_name: string;
            assigned_role: AssignedRole;
            is_active: boolean;
            password_hash?: string;
          }) => ({
            id: item.id,
            username: item.username,
            first_name: item.first_name,
            last_name: item.last_name,
            assigned_role: item.assigned_role,
            is_active: item.is_active,
            password_hash: item.password_hash || "",
          }),
        );

        setStaffList(normalizedStaff);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        "Failed to load staff records from server.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchStaff]);

  // Filter staff list based on search, active/inactive status, and role filter
  const filteredStaff = staffList.filter((member) => {
    const matchesSearch =
      `${member.first_name} ${member.last_name} ${member.username}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
          ? member.is_active
          : !member.is_active;

    const matchesRole =
      roleFilter === "ALL" ? true : member.assigned_role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const paginatedStaff = filteredStaff.slice((page - 1) * LIMIT, page * LIMIT);

  // Modal Handlers
  const handleAddStaff = () => {
    setEditStaff(null);
    setIsModalOpen(true);
  };

  // Fetch specific staff user details: GET /staff-users/{id}
  const handleEditStaff = async (staffMember: Staff) => {
    try {
      setFetchingUserId(staffMember.id);
      setError("");
      const response = await apiClient.get<Staff>(
        `/staff-users/${staffMember.id}`,
      );
      setEditStaff(response.data);
      setIsModalOpen(true);
    } catch (err: unknown) {
      // Fallback to currently loaded row member if detail endpoint errors
      const axiosErr = err as { response?: { data?: { message?: string } } };
      console.warn(
        "Could not fetch user details, using row state:",
        axiosErr.response?.data?.message || err,
      );
      setEditStaff(staffMember);
      setIsModalOpen(true);
    } finally {
      setFetchingUserId(null);
    }
  };

  // Toggle staff account status: PATCH /staff-users/{id}
  const handleToggleStatus = async (staffMember: Staff) => {
    try {
      setTogglingId(staffMember.id);
      setError("");
      await apiClient.patch(`/staff-users/${staffMember.id}`, {
        is_active: !staffMember.is_active,
      });

      const nextStatus = !staffMember.is_active ? "Active" : "Inactive";
      setSuccessMessage(
        `Staff member "${staffMember.first_name} ${staffMember.last_name}" set to ${nextStatus}.`,
      );
      await fetchStaff();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || "Failed to update account status.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Save handler: POST /staff-users (create) or PATCH /staff-users/{id} (update)
  const handleSaveStaff = async (staffData: {
    username: string;
    first_name: string;
    last_name: string;
    assigned_role: AssignedRole;
    is_active: boolean;
    password?: string;
    id?: number;
  }) => {
    setError("");

    if (editStaff) {
      // Backend Update: PATCH /staff-users/:id
      await apiClient.patch(`/staff-users/${editStaff.id}`, {
        username: staffData.username,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        assigned_role: staffData.assigned_role,
        is_active: staffData.is_active,
        ...(staffData.password ? { password: staffData.password } : {}),
      });

      setSuccessMessage(
        `Staff member "${staffData.first_name} ${staffData.last_name}" updated successfully.`,
      );
    } else {
      // Backend Create: POST /staff-users
      await apiClient.post("/staff-users", {
        username: staffData.username,
        password: staffData.password,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        assigned_role: staffData.assigned_role,
      });

      setSuccessMessage(
        `New staff member "${staffData.first_name} ${staffData.last_name}" created successfully.`,
      );
    }

    await fetchStaff();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Filter Tabs & Actions */}
      <div className="space-y-4">
        <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Role + Account Status Dropdowns */}
          <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
            {/* Role Dropdown */}
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select<RoleFilter>
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val ?? "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] !h-9">
                  <SelectValue placeholder="All Roles">
                    {roleFilter === "ALL" ? "All Roles" : formatRole(roleFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {Object.values(AssignedRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRole(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Status Dropdown */}
            <div className="flex flex-col gap-2">
              <Label>Account Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  if (val) setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[175px] !h-9">
                  <SelectValue placeholder="All Status">
                    {(() => {
                      const activeTab = filterTabs.find(
                        (t) => t.key === statusFilter,
                      );
                      if (!activeTab || activeTab.label === "All") {
                        return "All Status";
                      }
                      return activeTab.label;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {filterTabs.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label === "All" ? "All Status" : label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Big Blue Button */}
          <div className="lg:col-start-5 flex lg:justify-end">
            <Button
              onClick={handleAddStaff}
              className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" /> New Staff
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-red-50 border border-red-200 text-red-700 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-700 hover:text-red-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Staff Profile List
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: 
        </span>
      </div>

      {/* Table */}
      <div className="rounded-[4px] border border-border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70 hover:border-l-0 border-b border-border">
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">
                Employee Name
              </TableHead>
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">
                Role
              </TableHead>
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">
                Account Status
              </TableHead>
              <TableHead className="w-[100px] text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9 text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && staffList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-muted-foreground font-sans text-xs"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading staff records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-muted-foreground font-sans text-xs"
                >
                  {loading
                    ? "Refreshing..."
                    : "No staff members match the current filter."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((member) => (
                <StaffRow
                  key={member.id}
                  member={member}
                  onEdit={handleEditStaff}
                  onToggleStatus={handleToggleStatus}
                  isTogglingStatus={togglingId === member.id}
                  isFetchingDetails={fetchingUserId === member.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
        <span>
          {filteredStaff.length === 0
            ? "Showing 0 entries"
            : `Showing ${(page - 1) * LIMIT + 1}-${Math.min(
                page * LIMIT,
                filteredStaff.length,
              )} of ${filteredStaff.length} entries`}
        </span>

        {filteredStaff.length > LIMIT && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-[11px] rounded-[2px]"
            >
              Previous
            </Button>
            <span className="text-[11px] px-1">
              Page {page} of {Math.ceil(filteredStaff.length / LIMIT)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page * LIMIT >= filteredStaff.length}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-[11px] rounded-[2px]"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AddStaffModal
        key={editStaff ? `edit-${editStaff.id}` : "create"}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveStaff}
        editStaff={editStaff}
      />
    </div>
  );
}
