"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/hooks/useAppContext";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TermsAgreementsProps {
  onAllAcceptedChange?: (allAccepted: boolean) => void;
}

export function TermsAgreements({ onAllAcceptedChange }: TermsAgreementsProps) {
  const { user, setUser } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Fallback to explicit states if user is not fully loaded, though user object should have them after Prisma push
  const terms = user?.acceptedTerms ?? false;
  const privacy = user?.acceptedPrivacy ?? false;
  const returns = user?.acceptedReturns ?? false;

  const allAccepted = terms && privacy && returns;

  useEffect(() => {
    if (onAllAcceptedChange) {
      onAllAcceptedChange(allAccepted);
    }
  }, [allAccepted, onAllAcceptedChange]);

  const handleToggle = async (field: "acceptedTerms" | "acceptedPrivacy" | "acceptedReturns", currentValue: boolean) => {
    if (!user || user.id === "nil") return;
    
    setLoading(true);
    const newValue = !currentValue;
    
    try {
      const res = await axios.put(`/api/dbhandler?model=user&id=${user.id}`, {
        [field]: newValue,
      });
      // Update local user context
      setUser({ ...user, ...res.data });
      toast.success("Agreement updated successfully");
    } catch (error) {
      console.error("Failed to update agreement", error);
      toast.error("Failed to update agreement settings");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === "nil") return null;

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border relative">
      {loading && (
         <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
             <Loader2 className="w-5 h-5 animate-spin text-primary" />
         </div>
      )}
      <div className="text-xs text-muted-foreground pb-2 border-b mb-2">
        <span className="font-bold text-primary block mb-1">Please review our policies:</span>
        By continuing, you acknowledge our operations format. Check the boxes below to agree. Read full details here:{" "}
        <Link href="/terms" className="text-primary font-bold hover:underline">Terms & Conditions</Link>,{" "}
        <Link href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
      </div>

      <div className="flex items-start gap-3">
        <Checkbox 
          id="terms" 
          checked={terms} 
          onCheckedChange={() => handleToggle("acceptedTerms", terms)} 
        />
        <label htmlFor="terms" className="text-[11px] leading-tight cursor-pointer">
          <span className="font-bold block text-foreground">I agree to the Terms & Conditions</span>
          I understand the service nature and acknowledge that Healthclique facilitates access but does not replace professional medical diagnosis.
        </label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox 
          id="privacy" 
          checked={privacy} 
          onCheckedChange={() => handleToggle("acceptedPrivacy", privacy)} 
        />
        <label htmlFor="privacy" className="text-[11px] leading-tight cursor-pointer">
          <span className="font-bold block text-foreground">I agree to the Privacy Policy</span>
          I consent to the collection, processing, and careful handling of my personal and health-related data as dictated by NDPA guidelines.
        </label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox 
          id="returns" 
          checked={returns} 
          onCheckedChange={() => handleToggle("acceptedReturns", returns)} 
        />
        <label htmlFor="returns" className="text-[11px] leading-tight cursor-pointer">
          <span className="font-bold block text-foreground">I agree to the Returns Policy</span>
          I understand that due to the sensitive nature of pharmaceutical products, medicines are generally non-returnable once dispensed.
        </label>
      </div>
    </div>
  );
}
