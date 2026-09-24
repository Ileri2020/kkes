"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useAppContext } from "@/hooks/useAppContext";

interface CreditFacilityDrawerProps {
  className?: string;
}

export const CreditFacilityDrawer: React.FC<CreditFacilityDrawerProps> = () => {
  const router = useRouter();
  const { subtotal } = useCart();
  const { user } = useAppContext();

  const role = (user?.role || "customer").toLowerCase();
  const isWholesaleRole =
    role === "wholesaler" || role === "professional" || role === "institution";
  const meetsHighOrder = subtotal >= 1_000_000;

  const isEligibleToRequest = isWholesaleRole || meetsHighOrder;

  const [agreed, setAgreed] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  const handleViewTerms = () => {
    router.push("/terms");
  };

  const handleApply = async () => {
    if (!agreed || !isEligibleToRequest) return;
    setApplying(true);

    try {
      // In a real implementation this would POST to an API endpoint
      // to create a credit facility application record.
      // For now we only provide UX and validation on the client.
      alert(
        "Your request for credit facility has been recorded. Our team will review your eligibility based on your sales history and contact you."
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Credit facility</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Apply for Credit Facility</DrawerTitle>
            <DrawerDescription>
              Available for eligible institutional, wholesale, and professional
              customers under strict terms and conditions.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-4 space-y-4 text-sm">
            <div className="rounded-2xl border bg-muted/40 p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Current order value</span>
                <span className="font-bold text-primary">
                  ₦ {subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Credit facility is typically considered for significant orders
                and qualifying wholesale or professional accounts.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Core credit conditions
              </div>
              <ul className="space-y-2 text-[13px] leading-snug">
                <li>
                  1. For orders below <strong>₦200,000</strong>, payment is{" "}
                  <strong>strictly Cash &amp; Carry</strong>.
                </li>
                <li>
                  2. You must have completed lifetime sales of at least{" "}
                  <strong>₦1,000,000</strong> before being accepted for credit
                  facility.
                </li>
                <li>
                  3. You must have had at least{" "}
                  <strong>5 transactions</strong> across a minimum of{" "}
                  <strong>3 separate order cycles</strong> within a{" "}
                  <strong>1‑month</strong> timeframe after registration.
                </li>
                <li>
                  4. For shipment to be completed, at least{" "}
                  <strong>50% of the order value</strong> must be paid upfront.
                </li>
                <li>
                  5. After receiving the products,{" "}
                  <strong>full payment</strong> must be completed as agreed.
                </li>
                <li>
                  6. Custom terms may be negotiated for{" "}
                  <strong>special wholesale</strong> arrangements.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={handleViewTerms}
              >
                View full Terms &amp; Conditions
              </Button>

              <div className="flex items-start gap-2 text-xs">
                <Checkbox
                  id="agree-terms-credit"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(Boolean(v))}
                  className="mt-0.5"
                />
                <label
                  htmlFor="agree-terms-credit"
                  className="leading-tight text-muted-foreground cursor-pointer"
                >
                  I have read and agree to the Terms &amp; Conditions of credit
                  sales and understand that approval is subject to verification
                  of my account history.
                </label>
              </div>

              {!isEligibleToRequest && (
                <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2">
                  Based on your current role and order value, you may not yet
                  qualify for credit facility. You can still proceed with normal
                  payment or continue building your purchase history.
                </p>
              )}
            </div>
          </div>

          <DrawerFooter>
            <Button
              type="button"
              disabled={!agreed || !isEligibleToRequest || applying}
              onClick={handleApply}
            >
              {applying ? "Submitting..." : "Apply for credit facility"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

