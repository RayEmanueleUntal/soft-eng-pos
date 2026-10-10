// app/(dashboard)/inventory/bins/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddBinModal } from "@/components/inventory/bin/AddBinModal";
import { BinDetailsModal } from "@/components/inventory/bin/BinDetailsModal";
import {
  getBinLocations,
  searchBinLocationExact,
  BinLocation,
  BinLocationMeta,
} from "@/lib/bin-locations";

export default function BinLocationsPage() {
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [meta, setMeta] = useState<BinLocationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State for Viewing Bin Details
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Exact search state for GET /bin-location/search
  const [searchAisle, setSearchAisle] = useState("");
  const [searchShelf, setSearchShelf] = useState("");
  const [isExactSearching, setIsExactSearching] = useState(false);

  // Fetch paginated list
  const fetchBins = useCallback(async (currentPage: number, search?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBinLocations({
        page: currentPage,
        limit: 10,
        search: search?.trim() || undefined,
      });

      // OPTION 1: Sort by ID ascending (1, 2, 3, 4, 5, 6...)
      const sortedData = [...res.data].sort((a, b) => a.id - b.id);

      setBins(sortedData);
      setMeta(res.meta);
    } catch (err: any) {
      console.error("Error fetching bin locations:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to load bin locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBins(page, searchQuery);
  }, [fetchBins, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBins(1, searchQuery);
  };

  const handleExactLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAisle.trim() || !searchShelf.trim()) {
      setErrorMsg("Both Aisle Number and Shelf Location are required for exact lookup.");
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
      setMeta({ total: 1, page: 1, limit: 10, totalPages: 1 });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setErrorMsg(`Bin location with aisle "${searchAisle}" and shelf "${searchShelf}" does not exist.`);
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
    <div className="space-y-3 max-w-[1400px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-white border border-[#CBD5E1] rounded-sm gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0060B2]" />
            <h1 className="text-lg font-bold font-['Space_Grotesk'] text-[#0F172A] tracking-tight">
              Bin Locations
            </h1>
            <span className="text-[11px] font-mono font-semibold border border-[#CBD5E1] text-[#565E74] bg-[#F8FAFC] px-1.5 py-0.5 rounded-sm">
              {meta.total} TOTAL
            </span>
          </div>
          <p className="text-xs text-[#414751] mt-0.5 font-['Inter']">
            Store aisles, physical shelf identifiers, and digital coordinates.
          </p>
        </div>

        <AddBinModal
          onSuccess={() => {
            setPage(1);
            fetchBins(1);
          }}
        />
      </div>

      {/* Filter / Search Toolbars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Table Filter */}
        <form
          onSubmit={handleSearchSubmit}
          className="lg:col-span-6 bg-white border border-[#CBD5E1] p-2.5 rounded-sm flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#727783]" />
            <Input
              type="text"
              placeholder="Filter by aisle or shelf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs font-mono border-[#CBD5E1] rounded-sm focus-visible:ring-1 focus-visible:ring-[#0060B2]"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-8 text-xs font-medium border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-sm px-3"
          >
            Filter
          </Button>
        </form>

        {/* Exact Endpoint Search (GET /bin-location/search) */}
        <form
          onSubmit={handleExactLookup}
          className="lg:col-span-6 bg-[#EFF4FF] border border-[#C8DCFF] p-2.5 rounded-sm flex flex-wrap items-center gap-2"
        >
          <span className="text-xs font-semibold text-[#004888] font-['Space_Grotesk'] shrink-0 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Exact Lookup:
          </span>
          <Input
            placeholder="Aisle (Aisle-01)"
            value={searchAisle}
            onChange={(e) => setSearchAisle(e.target.value)}
            className="h-8 text-xs font-mono border-[#CBD5E1] bg-white rounded-sm w-28 grow"
          />
          <Input
            placeholder="Shelf (Shelf-B)"
            value={searchShelf}
            onChange={(e) => setSearchShelf(e.target.value)}
            className="h-8 text-xs font-mono border-[#CBD5E1] bg-white rounded-sm w-28 grow"
          />
          <Button
            type="submit"
            disabled={isExactSearching}
            className="h-8 text-xs bg-[#004888] hover:bg-[#001C3B] text-white rounded-sm px-3 font-semibold"
          >
            {isExactSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Lookup"}
          </Button>
          {(searchAisle || searchShelf || bins.length === 1) && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearExactSearch}
              className="h-8 text-xs text-[#565E74] hover:text-[#0F172A] px-2"
            >
              Reset
            </Button>
          )}
        </form>
      </div>

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
                  <td colSpan={5} className="py-10 text-center text-[#565E74] font-mono text-xs">
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
                        BIN-{bin.aisle_number.toUpperCase()}-{bin.shelf_location.toUpperCase()}
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

        {/* Footer Bar */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-3 py-2 flex items-center justify-between text-xs font-mono text-[#565E74]">
          <div>
            Page <span className="font-bold text-[#0F172A]">{meta.page}</span> of{" "}
            <span className="font-bold text-[#0F172A]">{meta.totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="h-7 text-xs border-[#CBD5E1] rounded-sm px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-7 text-xs border-[#CBD5E1] rounded-sm px-2"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <BinDetailsModal
        bin={selectedBin}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}