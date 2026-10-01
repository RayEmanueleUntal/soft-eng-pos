// Bin assignment modal for the Inventory Management module of the POS system.
// Lets staff move an inventory item to a different digital storage bin, picked from GET /bin-location.
// Sends PATCH /inventory/{id}/bin and reports success to the parent table.
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BinLocation,
  BinLocationsResponse,
  InventoryItem,
} from "@/lib/inventory/types";
import { apiClient } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/inventory/api-error";

interface BinAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  item: InventoryItem;
}

interface BinSearchResult {
  query: string;
  bins: BinLocation[];
  total: number;
  failed: boolean;
}

const BIN_PAGE_SIZE = 20;

// Builds a readable label for the bin an item is currently in.
function getCurrentBinLabel(item: InventoryItem): string {
  if (!item.binId) {
    return "Not assigned";
  }

  const location =
    item.bin_aisle_number || item.bin_shelf_location
      ? ` (${item.bin_aisle_number ?? "-"} - ${item.bin_shelf_location ?? "-"})`
      : "";

  return `Bin #${item.binId}${location}`;
}

// Builds a readable label for a bin from the bin-location endpoint.
function getBinLabel(bin: BinLocation): string {
  return `${bin.aisle_number} - ${bin.shelf_location} (Bin #${bin.id})`;
}

interface BinFormProps {
  item: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}

// Form body; it unmounts when the dialog closes, so its state resets on every open.
function BinForm({ item, onClose, onSaved }: BinFormProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [result, setResult] = React.useState<BinSearchResult | null>(null);
  const [selectedBin, setSelectedBin] = React.useState<BinLocation | null>(null);
  const [manualBinId, setManualBinId] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;

    apiClient
      .get<BinLocationsResponse>("/bin-location", {
        params: { search: debouncedSearch || undefined, limit: BIN_PAGE_SIZE },
      })
      .then((response) => {
        if (!cancelled) {
          setResult({
            query: debouncedSearch,
            bins: response.data.data,
            total: response.data.meta.total,
            failed: false,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load bin locations:", err);
        if (!cancelled) {
          setResult({ query: debouncedSearch, bins: [], total: 0, failed: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const binsLoading = result === null || result.query !== debouncedSearch;
  const pickerFailed = result?.failed === true;
  const bins = !binsLoading && result ? result.bins : [];

  const trimmedManual = manualBinId.trim();
  const manualId = Number(trimmedManual);
  const manualIsValid = /^\d+$/.test(trimmedManual) && manualId > 0;

  const newBinId = pickerFailed
    ? manualIsValid
      ? manualId
      : null
    : (selectedBin?.id ?? null);

  const newBinLabel = pickerFailed
    ? newBinId
      ? `Bin #${newBinId}`
      : "-"
    : selectedBin
      ? getBinLabel(selectedBin)
      : "-";

  // Checks the chosen bin and returns an error message, or null if valid.
  const getValidationError = (): string | null => {
    if (pickerFailed) {
      if (!trimmedManual) {
        return "Please enter a Bin ID.";
      }

      if (!manualIsValid) {
        return "Bin ID must be a positive whole number.";
      }
    } else if (!selectedBin) {
      return "Select a bin to assign.";
    }

    if (newBinId === item.binId) {
      return "This item is already assigned to that bin.";
    }

    return null;
  };

  const validationError = getValidationError();
  const showValidationError =
    validationError !== null && (pickerFailed ? trimmedManual !== "" : false);

  // Sends the PATCH request that assigns the chosen bin to the item.
  const handleSave = async () => {
    setError("");

    if (validationError || newBinId === null) {
      setError(validationError ?? "Select a bin to assign.");
      return;
    }

    try {
      setIsSaving(true);

      await apiClient.patch(`/inventory/${item.id}/bin`, {
        binId: newBinId,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to assign bin:", err);
      setError(
        getApiErrorMessage(err, "Failed to assign the bin. Please try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4 py-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Current bin</dt>
          <dd className="font-mono font-medium">{getCurrentBinLabel(item)}</dd>

          <dt className="text-muted-foreground">New bin</dt>
          <dd className="font-mono font-medium">{newBinLabel}</dd>
        </dl>

        {pickerFailed ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Could not load the bin list. Enter a Bin ID manually instead.
            </p>

            <label htmlFor="binId" className="text-sm font-medium">
              New Bin ID
            </label>

            <Input
              id="binId"
              type="number"
              min="1"
              step="1"
              placeholder="Enter Bin ID"
              value={manualBinId}
              onChange={(e) => {
                setManualBinId(e.target.value);
                setError("");
              }}
              disabled={isSaving}
              aria-invalid={showValidationError}
              className="rounded-[2px] font-mono"
            />

            {showValidationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="binSearch" className="text-sm font-medium">
              New bin
            </label>

            <Input
              id="binSearch"
              placeholder="Search by aisle or shelf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isSaving}
              className="rounded-[2px]"
            />

            {binsLoading ? (
              <p className="text-xs text-muted-foreground">Loading bins...</p>
            ) : bins.length === 0 ? (
              <p className="text-xs text-muted-foreground">No bins found.</p>
            ) : (
              <ul className="max-h-44 divide-y overflow-y-auto rounded-[2px] border border-border">
                {bins.map((bin) => {
                  const isCurrent = bin.id === item.binId;
                  const isSelected = bin.id === selectedBin?.id;

                  return (
                    <li key={bin.id}>
                      <button
                        type="button"
                        disabled={isCurrent || isSaving}
                        onClick={() => {
                          setSelectedBin(bin);
                          setError("");
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSelected
                            ? "bg-primary/10 font-medium"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="font-mono">
                          {bin.aisle_number} - {bin.shelf_location}
                        </span>
                        <span className="text-muted-foreground">
                          {isCurrent ? "Current" : `Bin #${bin.id}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!binsLoading && result && result.total > bins.length && (
              <p className="text-xs text-muted-foreground">
                Showing {bins.length} of {result.total} bins. Refine the search
                to see others.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving || validationError !== null}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}

// Renders the bin assignment dialog for one inventory item.
export function BinAssignmentModal({
  isOpen,
  onClose,
  onSaved,
  item,
}: BinAssignmentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0">
        <DialogHeader>
          <DialogTitle>Assign Bin Location for {item.name}</DialogTitle>
        </DialogHeader>

        <BinForm item={item} onClose={onClose} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
