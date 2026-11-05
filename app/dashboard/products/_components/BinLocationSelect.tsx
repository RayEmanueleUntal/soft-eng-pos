"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  getBinLocations,
  type BinLocation,
} from "@/lib/bin-locations/bin-locations";
import { getErrorMessage } from "@/lib/utils";

interface BinLocationSelectProps {
  id?: string;
  value: string;
  selectedLabel?: string;
  onChange: (binId: string, label: string) => void;
  disabled?: boolean;
}

const formatBin = (bin: BinLocation) =>
  `Aisle ${bin.aisle_number} · Shelf ${bin.shelf_location}`;

export function BinLocationSelect({
  id,
  value,
  selectedLabel,
  onChange,
  disabled,
}: BinLocationSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      getBinLocations({
        search: query.trim() || undefined,
        limit: 20,
      })
        .then((res) => {
          if (requestSeq.current === seq) {
            setResults(res.data);
          }
        })
        .catch((err: unknown) => {
          if (requestSeq.current === seq) {
            setResults([]);
            setError(getErrorMessage(err, "Failed to load bin locations."));
          }
        })
        .finally(() => {
          if (requestSeq.current === seq) {
            setLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (bin: BinLocation) => {
    onChange(String(bin.id), formatBin(bin));
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("", "");
    setQuery("");
  };

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/40 px-2 py-1.5 text-xs">
          <span className="truncate font-mono">
            {selectedLabel || `Bin #${value}`}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      ) : null}

      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
      >
        <Input
          id={id}
          value={query}
          disabled={disabled}
          placeholder={value ? "Search for another bin..." : "Search aisle or shelf..."}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        {open && !disabled && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Searching bins...
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-xs text-destructive">{error}</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No bin locations found.
              </div>
            ) : (
              results.map((bin) => (
                <button
                  key={bin.id}
                  type="button"
                  onClick={() => handleSelect(bin)}
                  className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span className="font-mono text-xs">{formatBin(bin)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && !open ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Optional. Search by aisle or shelf location.
        </p>
      )}
    </div>
  );
}
