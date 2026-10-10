// components/inventory/bin/AddBinModal.tsx
"use client";

import { useState } from "react";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createBinLocation, CreateBinPayload, BinLocation } from "@/lib/bin-locations";

interface AddBinModalProps {
  onSuccess: (newBin: BinLocation) => void;
}

export function AddBinModal({ onSuccess }: AddBinModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [aisleNumber, setAisleNumber] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aisleNumber.trim() || !shelfLocation.trim()) {
      setErrorMsg("Aisle number and shelf location are required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateBinPayload = {
        aisle_number: aisleNumber.trim(),
        shelf_location: shelfLocation.trim(),
      };

      const createdBin = await createBinLocation(payload);
      
      setAisleNumber("");
      setShelfLocation("");
      setOpen(false);
      onSuccess(createdBin);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setErrorMsg("Conflict: A bin location with this aisle and shelf already exists.");
      } else if (status === 403) {
        setErrorMsg("Forbidden: ADMIN, MANAGER, or SECRETARY role required.");
      } else {
        setErrorMsg(err?.response?.data?.message || "Failed to create bin location.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>ADD BIN LOCATION</span>
        <span className="ml-1 text-[10px] font-mono opacity-90 bg-white/20 px-1 rounded-sm border border-white/20">
          [F2]
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] border-[#CBD5E1] rounded-sm p-5 bg-white shadow-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A] tracking-tight">
              Create Bin Location
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {errorMsg && (
              <div className="p-2.5 bg-[#FFDAD6] border border-[#BA1A1A] text-[#93000A] text-xs font-medium rounded-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="aisle_number" className="text-xs font-medium text-[#414751]">
                Aisle Number / Code <span className="text-[#BA1A1A]">*</span>
              </Label>
              <Input
                id="aisle_number"
                placeholder="e.g. Aisle-01"
                value={aisleNumber}
                onChange={(e) => setAisleNumber(e.target.value)}
                className="h-8 text-xs font-mono border-[#CBD5E1] focus-visible:ring-1 focus-visible:ring-[#0060B2] rounded-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shelf_location" className="text-xs font-medium text-[#414751]">
                Shelf Location Identifier <span className="text-[#BA1A1A]">*</span>
              </Label>
              <Input
                id="shelf_location"
                placeholder="e.g. Shelf-B"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className="h-8 text-xs font-mono border-[#CBD5E1] focus-visible:ring-1 focus-visible:ring-[#0060B2] rounded-sm"
                required
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-8 text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-8 text-xs bg-[#0060B2] hover:bg-[#004888] text-white font-semibold rounded-sm px-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Bin Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}