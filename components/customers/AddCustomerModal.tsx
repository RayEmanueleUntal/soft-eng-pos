"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createCustomer,
  updateCustomer,
} from "@/lib/customers/customer-api";
import {
  Customer,
  CustomerPayload,
  CustomerType,
} from "@/lib/customers/types";
import { getErrorMessage } from "@/lib/utils";
import { useState } from "react";

interface AddCustomerModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  customer?: Customer | null; // Optional: works for editing too!
}

export function AddCustomerModal({
  isOpen,
  onClose,
  mode,
  onSuccess,
  customer,
}: AddCustomerModalProps) {
  // 1. Local state (Name, Contact, Type, Wholesale fields)
  // 2. Inline validation (Name required, wholesale needs company & limit)
  // 3. API submit (POST /customers if new, PATCH /customers/:id if editing)
  // 4. Returns:
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

      const payload: CustomerPayload = {
        name: name.trim(),
        contact_number: contactNumber.trim(),
        type,
        ...(type === "WHOLESALE"
          ? {
              company_name: companyName.trim(),
              credit_limit: Number(creditLimit),
            }
          : {}),
      };

      const savedCustomer =
        mode === "add"
          ? await createCustomer(payload)
          : customer
            ? await updateCustomer(customer.id, payload)
            : null;

      if (savedCustomer) {
        onSuccess(savedCustomer);
      }
    } catch (error) {
      console.error("Failed to save customer:", error);

      setFormError(
        getErrorMessage(error, "Failed to save customer. Please try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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




        {/* All inputs: Name, Contact, Type (Retail vs Wholesale), Company, Credit */}
        <div className="grid gap-3 py-4">
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
          </>
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}
      </div>
        
        
        
        
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
