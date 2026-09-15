"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { apiClient } from "@/lib/api";
import { Customer, CustomerType } from "@/lib/customers/types";

interface CustomerFormProps {
  mode: "add" | "edit";
  customer?: Customer;
  onSaved: () => void;
}

export function CustomerForm({ mode, customer, onSaved }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name ?? "");

  const [contactNumber, setContactNumber] = useState(
    customer?.contact_number ?? "",
  );

  const [type, setType] = useState<CustomerType>(customer?.type ?? "RETAIL");

  const [companyName, setCompanyName] = useState(
    customer?.wholesale?.company_name ?? "",
  );

  const [creditLimit, setCreditLimit] = useState(
    customer?.wholesale?.credit_limit?.toString() ?? "",
  );

  const [outstandingBalance, setOutstandingBalance] = useState(
    customer?.wholesale?.outstanding_balance?.toString() ?? "0",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    setFormError("");

    if (!name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (!contactNumber.trim()) {
      setFormError("Contact number is required.");
      return;
    }

    if (type === "WHOLESALE") {
      if (!companyName.trim()) {
        setFormError("Company name is required for wholesale customers.");
        return;
      }

      if (!creditLimit || Number(creditLimit) < 1) {
        setFormError(
          "A valid credit limit is required for wholesale customers.",
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        contact_number: contactNumber.trim(),
        type,
        ...(type === "WHOLESALE"
          ? {
              company_name: companyName.trim(),
              credit_limit: Number(creditLimit),
              outstanding_balance: Number(outstandingBalance) || 0,
            }
          : {}),
      };

      if (mode === "add") {
        await apiClient.post("/customers/", payload);
      } else {
        if (!customer) return;

        await apiClient.patch(`/customers/${customer.id}`, payload);
      }

      onSaved();
    } catch (error: any) {
      console.error("Failed to save customer:", error);

      setFormError(
        error?.response?.data?.message ||
          "Failed to save customer. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {mode === "add" ? "Add New Customer" : "Edit Customer"}
        </DialogTitle>

        <DialogDescription>
          {mode === "add"
            ? "Fill in the details below to register a retail or wholesale customer."
            : "Update the customer's profile information."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Customer Name</label>

          <Input
            placeholder="e.g. Juan Dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Contact Number</label>

          <Input
            placeholder="e.g. 09171234567"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Customer Type</label>

          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as CustomerType)}
            disabled={isSaving}
          >
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
          </select>
        </div>

        {type === "WHOLESALE" && (
          <>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Company Name</label>

              <Input
                placeholder="e.g. Dela Cruz Trading Enterprises"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Credit Limit (PHP)</label>

              <Input
                type="number"
                min="1"
                placeholder="50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Outstanding Balance (PHP)
              </label>

              <Input
                type="number"
                min="0"
                placeholder="0"
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>

      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-[#6366f1] hover:bg-[#4f46e5]"
        >
          {isSaving
            ? "Saving..."
            : mode === "add"
              ? "Save Customer"
              : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
