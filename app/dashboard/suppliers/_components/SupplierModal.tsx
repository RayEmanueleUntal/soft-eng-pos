"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/components/shared/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Supplier, SupplierFormData } from "@/lib/suppliers/suppliers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={isEditing ? "Edit Supplier" : "Add New Supplier"}
      description={
        isEditing
          ? "Update procurement contacts and lead times."
          : "Register procurement details and lead times for hardware suppliers."
      }
      size="md"
    >

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="companyName">
              Company Name <span className="text-destructive">*</span>{" "}
            </Label>
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
              <Label htmlFor="leadTimeDays">Delivery Lead Time (Days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                min="0"
                placeholder="0"
                value={formData.leadTimeDays === 0 ? "" : formData.leadTimeDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    leadTimeDays:
                      e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  })
                }
              />
              {errors.leadTimeDays && (
                <p className="text-xs text-destructive">
                  {errors.leadTimeDays}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || "ACTIVE"}
                onValueChange={(val) => {
                  if (val) setFormData({ ...formData, status: val });
                }}
              >
                <SelectTrigger id="status" className="w-full h-9">
                  <SelectValue placeholder="Select status">
                    {formData.status === "INACTIVE" ? "Inactive" : "Active"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
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

          <div className="mt-4 flex justify-end gap-2">
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
              className="bg-[#0060B2] hover:bg-[#004888]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Save Supplier"}
            </Button>
          </div>
        </form>
    </FormModal>
  );
}
