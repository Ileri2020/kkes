"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Landmark, Copy, Check, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/hooks/useAppContext";
import { useCart } from "@/hooks/use-cart";
import axios from "axios";

export const ManualTransfer = React.forwardRef<HTMLButtonElement, { tx_ref: string, amount: number, cartId: string, userId: string }>(({ tx_ref, amount, cartId, userId }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearCart } = useCart();
  const { setCheckoutData } = useAppContext();

  // Account details from environment variables
  const accountInfo = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Moniepoint MFB",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "8065933700",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "HealthClique Limited",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    toast.success("Account details copied!");
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    try {
      // In a real flow, you'd probably link a proof of payment?
      // For now, we'll mark it as 'manual_pending' or just 'paid' for simulation.
      await axios.post("/api/payment?action=confirm", { 
        tx_ref, 
        method: "manual_transfer",
        cartId 
      });

      toast.success("Transfer notification sent! We will verify and process your order.");
      
      // Clear cart and close
      clearCart();
      setCheckoutData(null);
      setIsOpen(false);
      
      // Maybe reload or redirect
      window.location.reload();
    } catch (err) {
       console.error("Manual confirm error:", err);
       toast.error("Failed to submit transfer notification.");
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button ref={ref} variant="outline" className="w-full h-12 rounded-xl font-bold border-2 hover:bg-muted/5 transition-all gap-2 truncate whitespace-nowrap overflow-hidden">
          <Landmark className="w-4 h-4 text-primary" />
          <span className="truncate">Bank Transfer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            Bank Transfer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/20 space-y-3">
             <div className="flex justify-between items-start">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Amount to Pay</p>
                <p className="text-xl font-black text-primary">₦{amount.toFixed(2)}</p>
             </div>
             <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">Provider:</span>
                <span>{accountInfo.bankName}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground">Account Number:</span>
                <div className="flex items-center gap-2">
                   <p className="font-black text-lg">{accountInfo.accountNumber}</p>
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => copyToClipboard(accountInfo.accountNumber)}>
                      {copiedAccount ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                   </Button>
                </div>
             </div>
             <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="text-right">{accountInfo.accountName}</span>
             </div>
          </div>

          <div className="space-y-2 px-1">
             <p className="text-xs font-bold text-muted-foreground italic leading-relaxed">
               Please include your Reference <strong className="text-foreground">{tx_ref}</strong> in the bank transfer note for faster verification.
             </p>
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl flex gap-3 items-start">
             <UploadCloud className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[11px] font-bold text-amber-600 leading-tight">
               After payment, click the button below to notify our system. Your order will be processed once verified by our team.
             </p>
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col gap-2">
           <Button className="w-full h-12 rounded-xl font-black text-lg shadow-xl shadow-primary/10" disabled={isSubmitting} onClick={handleConfirmTransfer}>
             {isSubmitting ? "Notifying..." : "I have made the transfer"}
           </Button>
           <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground" onClick={() => setIsOpen(false)}>
             Cancel & Choose Other Method
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ManualTransfer.displayName = "ManualTransfer";
