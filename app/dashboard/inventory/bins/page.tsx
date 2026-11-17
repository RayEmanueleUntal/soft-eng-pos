// Bin location list for warehouse aisle/shelf coordinates in the POS inventory module.
// Supports paginated browse, exact aisle/shelf search, create bin, and a details modal.
// Grey pagination bar renders only when there is more than one page.
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  Info,
  Layers,
  AlertCircle,
  CheckCircle2,
  ToothbrushSparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddBinModal } from "@/app/dashboard/inventory/bins/_components/AddBinModal";
import { canCreateBin } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { BinDetailsModal } from "@/app/dashboard/inventory/bins/_components/BinDetailsModal";
import {
  getBinLocations,
  searchBinLocationExact,
  BinLocation,
  BinLocationMeta,
} from "@/lib/bin-locations/bin-locations";
import { PageHeader } from "@/components/ui/pageheader";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/table-pagination";

export default function BinLocationsPage() {
  const role = useCurrentRole();
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [meta, setMeta] = useState<BinLocationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Viewing Bin Details
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Exact search state for GET /bin-location/search
  const [searchAisle, setSearchAisle] = useState("");
  const [searchShelf, setSearchShelf] = useState("");
  const [isExactSearching, setIsExactSearching] = useState(false);

  // Fetch paginated list
  const fetchBins = useCallback(
    async (currentPage: number, search?: string) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await getBinLocations({
          page: currentPage,
          limit: 15,
          search: search?.trim() || undefined,
        });

        const sortedData = [...res.data].sort((a, b) => a.id - b.id);

        setBins(sortedData);
        setMeta(res.meta);
      } catch (err: any) {
        console.error("Error fetching bin locations:", err);
        setErrorMsg(
          err?.response?.data?.message || "Failed to load bin locations.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchBins(page, searchQuery);
  }, [fetchBins, page]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBins(1, searchQuery);
  };

  const handleExactLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAisle.trim() || !searchShelf.trim()) {
      setErrorMsg(
        "Both Aisle Number and Shelf Location are required for exact lookup.",
      );
      return;
    }

    setIsExactSearching(true);
    setErrorMsg(null);

    try {
      const bin = await searchBinLocationExact({
        aisle_number: searchAisle.trim(),
        shelf_location: searchShelf.trim(),
      });
      setBins([bin]);
      setMeta({ total: 1, page: 1, limit: 15, totalPages: 1 });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setErrorMsg(
          `Bin location with aisle "${searchAisle}" and shelf "${searchShelf}" does not exist.`,
        );
        setBins([]);
      } else {
        setErrorMsg("Failed to lookup bin location.");
      }
    } finally {
      setIsExactSearching(false);
    }
  };

  const handleClearExactSearch = () => {
    setSearchAisle("");
    setSearchShelf("");
    setSearchQuery("");
    setPage(1);
    fetchBins(1);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="shrink-0 mt-4 mb-4 flex justify-between items-center">
        <PageHeader
          header="Bin Locations"
          subheader="Store aisles, physical shelf identifiers, and digital coordinates."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <div className="space-y-4">
        <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by aisle or shelf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
          </div>

          {canCreateBin(role) && (
          <AddBinModal
            onSuccess={(newBin) => {
              setSuccessMsg(
                `Bin Location BIN-${newBin.aisle_number}-${newBin.shelf_location} successfully created.`,
              );
              setPage(1);
              fetchBins(1);
            }}
          />
        )}
        </div>
      </div>
        {/* Success Banner */}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-sm flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccessMsg(null)}
              className="h-5 text-[10px] text-emerald-800 hover:bg-black/5 px-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Exception Error Banner */}
        {errorMsg && (
          <div className="p-2.5 bg-[#FFDAD6] border border-[#BA1A1A] text-[#93000A] text-xs font-medium rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMsg(null)}
              className="h-5 text-[10px] text-[#93000A] hover:bg-black/5 px-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/*info subheading */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-heading font-semibold text-foreground">
            Bin Location List
          </h2>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Total records: {meta.total}
          </span>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1] text-[11px] font-mono uppercase font-semibold text-[#475569] h-8">
                  <th className="px-3 py-1 w-20">ID</th>
                  <th className="px-3 py-1">Aisle Number</th>
                  <th className="px-3 py-1">Shelf Location</th>
                  <th className="px-3 py-1">Barcode Tag</th>
                  <th className="px-3 py-1 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-['Inter'] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#565E74]">
                      <div className="flex items-center justify-center gap-2 font-mono">
                        <Loader2 className="h-4 w-4 animate-spin text-[#0060B2]" />
                        <span>Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : bins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-[#565E74] font-mono text-xs"
                    >
                      No bin locations found.
                    </td>
                  </tr>
                ) : (
                  bins.map((bin) => (
                    <tr
                      key={bin.id}
                      className="h-8 hover:bg-[#EFF4FF] transition-colors border-b border-[#E2E8F0]"
                    >
                      <td className="px-3 py-1 font-mono font-medium text-[#727783]">
                        #{bin.id}
                      </td>
                      <td className="px-3 py-1 font-mono font-bold text-[#0F172A]">
                        {bin.aisle_number}
                      </td>
                      <td className="px-3 py-1 font-mono text-[#0060B2] font-semibold">
                        {bin.shelf_location}
                      </td>
                      <td className="px-3 py-1">
                        <span className="font-mono text-[11px] border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] px-1.5 py-0.5 rounded-xs">
                          BIN-{bin.aisle_number.toUpperCase()}-
                          {bin.shelf_location.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBin(bin);
                            setDetailsOpen(true);
                          }}
                          className="h-6 px-2 text-[11px] font-medium text-[#0060B2] hover:bg-[#C8DCFF] rounded-xs flex items-center gap-1 ml-auto"
                        >
                          <Info className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-3 py-2">
            <TablePagination
              className="w-full px-0"
              page={page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={meta.limit || 15}
              itemLabel="bins"
              loading={loading}
              onPageChange={setPage}
            />
          </div>
        </div>

        <BinDetailsModal
          bin={selectedBin}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>        
    </div>   
  );
}