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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action will remove or deactivate{" "}
            <span className="font-semibold text-foreground">
              {forwarder?.company_name || "this forwarder"}
            </span>
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              await handleDelete();
            }}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Forwarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}