"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { Forwarder } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteForwarderModalProps {
  forwarder: Forwarder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteForwarderModal({
  forwarder,
  open,
  onOpenChange,
  onSuccess,
}: DeleteForwarderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!forwarder) return;
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/forwarders/${forwarder.id}`, {
        headers: {
          "Idempotency-Key": uuidv4(),
        },
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
      <DialogContent className="sm:max-w-[400px] border-border shadow-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-destructive">
            Delete Forwarder
          </DialogTitle>
          <DialogDescription className="text-xs pt-2">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {forwarder?.company_name}
            </span>
            ? This action will soft-delete the record or deactivate courier assignment.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2.5 rounded text-xs font-mono bg-destructive/10 text-destructive border border-destructive/20 mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="h-9 text-xs"
          >
            {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}