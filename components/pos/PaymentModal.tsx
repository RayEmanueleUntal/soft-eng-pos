"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CashPaymentForm from "./CashPaymentForm";
import GCashPaymentForm from "./GCashPaymentForm";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
}

export default function PaymentModal({ isOpen, onClose, cartTotal }: PaymentModalProps) {
  // Save payment info to send to API
  const [paymentDetails, setPaymentDetails] = useState<any>({});

  const handlePaymentUpdate = (details: any) => {
    setPaymentDetails(details);
  };

  const handleCompleteSale = () => {
  // Check collected payment data in console
  console.log("need pa details hehe:", paymentDetails);

  // TODO: connect to API
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Checkout</DialogTitle>
        </DialogHeader>

        {/* Cart Total Summary */}
        <div className="bg-gray-900 text-white p-6 rounded-lg text-center my-4">
          <p className="text-sm text-gray-300 uppercase tracking-wide">Total Amount Due</p>
          <p className="text-4xl font-bold mt-1">₱{cartTotal.toFixed(2)}</p>
        </div>

        {/* Payment Methods */}
        <Tabs defaultValue="cash" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="gcash">GCash</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cash">
            <CashPaymentForm amountDue={cartTotal} onPaymentChange={handlePaymentUpdate} />
          </TabsContent>
          
          <TabsContent value="gcash">
            <GCashPaymentForm onPaymentChange={handlePaymentUpdate} />
          </TabsContent>
          
          <TabsContent value="credit">
            {/*place the CreditPaymentForm here */}
            <div className="p-4 text-center text-sm text-gray-500">
              Wholesale Credit module here :)
            </div>
          </TabsContent>
        </Tabs>

        {/* Submit Action */}
        <div className="flex justify-end gap-3 mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCompleteSale} size="lg">Complete Sale</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}