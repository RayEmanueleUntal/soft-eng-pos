// components/inventory/bin/BinDetailsModal.tsx
"use client";

import { MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BinLocation } from "@/lib/bin-locations";

interface BinDetailsModalProps {
  bin: BinLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BinDetailsModal({ bin, open, onOpenChange }: BinDetailsModalProps) {
  if (!bin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-[#CBD5E1] rounded-sm p-5 bg-white shadow-md">
        <DialogHeader className="border-b border-[#E2E8F0] pb-3">
          <DialogTitle className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0060B2]" />
            Bin Location Metadata
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs font-['Inter']">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#727783] font-medium">Database ID:</span>
              <span className="font-mono font-bold text-[#0F172A] bg-white px-2 py-0.5 border border-[#CBD5E1] rounded-sm">
                #{bin.id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#727783] font-medium">Aisle Number:</span>
              <span className="font-mono font-bold text-[#0060B2]">
                {bin.aisle_number}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#727783] font-medium">Shelf Location:</span>
              <span className="font-mono font-bold text-[#0F172A]">
                {bin.shelf_location}
              </span>
            </div>
          </div>

          <div className="border border-[#CBD5E1] rounded-sm p-3 bg-[#EFF4FF] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#004888] text-[11px] font-mono uppercase">
              <Layers className="h-3.5 w-3.5" /> System Mapping Tag
            </div>
            <p className="font-mono text-xs text-[#0B1C30] font-bold bg-white p-2 border border-[#C1C6D3] rounded-sm tracking-wider">
              BIN-{bin.aisle_number.toUpperCase()}-{bin.shelf_location.toUpperCase()}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-[#E2E8F0]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-sm w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}