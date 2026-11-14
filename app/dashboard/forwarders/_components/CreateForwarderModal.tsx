"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreateForwarderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (createdCompanyName: string) => void;
}

export function CreateForwarderModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateForwarderModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [trackingContactInfo, setTrackingContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!companyName.trim() || !trackingContactInfo.trim()) {
        setError("Company Name and Contact Info are required.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const trimmedCompany = companyName.trim();

        await apiClient.post("/forwarders", {
          company_name: trimmedCompany,
          tracking_contact_info: trackingContactInfo.trim(),
        });

        // Reset form and close
        setCompanyName("");
        setTrackingContactInfo("");
        onOpenChange(false);
        onSuccess(trimmedCompany);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border shadow-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            Add New Forwarder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 rounded text-xs font-mono bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="company_name" className="text-xs font-medium">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company_name"
              placeholder="e.g. LBC Express, DHL Logistics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_info" className="text-xs font-medium">
              Tracking Contact Info <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact_info"
              placeholder="e.g. Phone, Email, or Dispatch Portal URL"
              value={trackingContactInfo}
              onChange={(e) => setTrackingContactInfo(e.target.value)}
              className="h-9 text-sm font-mono"
              required
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 text-xs bg-[#0060B2] hover:bg-[#004888] text-white"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Forwarder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}