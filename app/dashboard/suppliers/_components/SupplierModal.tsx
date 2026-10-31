"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Supplier, SupplierFormData } from "@/lib/suppliers/suppliers";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  initialData?: Supplier | null;
  isLoading?: boolean;
}

export function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: SupplierModalProps) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    leadTimeDays: 7,
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.companyName || initialData.name || "",
        contactPerson:
          initialData.contactPerson || initialData.contact_person || "",
        email: initialData.email || "",
        phone: initialData.phone || initialData.contact_number || "",
        address: initialData.address || initialData.location || "",
        leadTimeDays:
          initialData.leadTimeDays ?? initialData.lead_time_days ?? 7,
        status:
          initialData.status || (initialData.is_active ? "ACTIVE" : "INACTIVE"),
      });
    } else {
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        leadTimeDays: 7,
        status: "ACTIVE",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.leadTimeDays < 0) {
      newErrors.leadTimeDays = "Lead time cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update procurement contacts and lead times."
              : "Register procurement details and lead times for hardware suppliers."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g. Manila Industrial Fasteners"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="e.g. Jane Smith"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+63 912 345 6789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="e.g. Building 4, Metro Industrial Park"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="leadTimeDays">Delivery Lead Time (Days)</Label>
            <Input
              id="leadTimeDays"
              type="number"
              min="0"
              value={formData.leadTimeDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  leadTimeDays: parseInt(e.target.value) || 0,
                })
              }
            />
            {errors.leadTimeDays && (
              <p className="text-xs text-destructive">{errors.leadTimeDays}</p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#6366f1] hover:bg-[#4f46e5]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Save Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
