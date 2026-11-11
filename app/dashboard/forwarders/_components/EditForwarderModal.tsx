"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { Forwarder } from "./types";
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

interface EditForwarderModalProps {
  forwarder: Forwarder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditForwarderModal({
  forwarder,
  open,
  onOpenChange,
  onSuccess,
}: EditForwarderModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [trackingContactInfo, setTrackingContactInfo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (forwarder) {
      setCompanyName(forwarder.company_name);
      setTrackingContactInfo(forwarder.tracking_contact_info);
      setIsActive(forwarder.is_active);
      setError(null);
    }
  }, [forwarder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwarder) return;

    try {
      setLoading(true);
      setError(null);
      await apiClient.patch(`/forwarders/${forwarder.id}`, {
        company_name: companyName.trim(),
        tracking_contact_info: trackingContactInfo.trim(),
        is_active: isActive,
      });

      onOpenChange(false);
      onSuccess();
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
            Edit Forwarder Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 rounded text-xs font-mono bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit_company_name" className="text-xs font-medium">
              Company Name
            </Label>
            <Input
              id="edit_company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_contact_info" className="text-xs font-medium">
              Tracking Contact Info
            </Label>
            <Input
              id="edit_contact_info"
              value={trackingContactInfo}
              onChange={(e) => setTrackingContactInfo(e.target.value)}
              className="h-9 text-sm font-mono"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="edit_is_active" className="text-xs font-medium cursor-pointer">
              Active Status
            </Label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0060B2]"></div>
            </label>
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
              Update Forwarder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}