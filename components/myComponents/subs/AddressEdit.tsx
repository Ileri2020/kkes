"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/hooks/useAppContext";
import axios from "axios";
import UserShippingAddressForm from "@/prisma/forms/userShippingAddressForm";
import { CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type ShippingAddress = {
  id?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zip?: string;
  phone?: string;
};

export const AddressEdit = ({ children, triggerClassName }: { children?: React.ReactNode, triggerClassName?: string }) => {
  const { user, setUser } = useAppContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);

  const [addressData, setAddressData] = useState<ShippingAddress>({
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Nigeria",
    phone: "",
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.addresses?.[0]) {
      setAddressData(user.addresses[0]);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || user.id === 'nil') return;

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let addressRes;
      if (addressData.id) {
        addressRes = await axios.put(
          `/api/dbhandler?model=shippingAddress&id=${addressData.id}`,
          { ...addressData, userId: user.id }
        );
      } else {
        addressRes = await axios.post(`/api/dbhandler?model=shippingAddress`, {
          ...addressData,
          userId: user.id,
        });
      }

      // Update context with the new address list
      // Note: We'll just update the first one since this is a simple "Address Only" edit
      const updatedAddresses = user.addresses ? [...user.addresses] : [];
      if (addressData.id) {
        const idx = updatedAddresses.findIndex(a => a.id === addressData.id);
        if (idx !== -1) updatedAddresses[idx] = addressRes.data;
      } else {
        updatedAddresses.push(addressRes.data);
      }

      setUser({
        ...user,
        addresses: updatedAddresses,
      });

      setSuccessMessage("Address saved!");
      setTimeout(() => {
        setSuccessMessage(null);
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error("Address update failed:", err.response?.data || err);
      setErrorMessage("Failed to save address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSave} className="space-y-4">
      {successMessage && (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <UserShippingAddressForm
        userId={user?.id || ""}
        existing={addressData}
        onSaved={(addr) => setAddressData(addr)}
      />

      <div className="pt-4 flex gap-3">
        {isDesktop ? (
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
        ) : (
          <DrawerClose asChild>
             <Button variant="outline" className="flex-1">Cancel</Button>
          </DrawerClose>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </form>
  );

  const trigger = children || (
    <Button variant="outline" size="sm" className={cn("gap-2", triggerClassName)}>
      <MapPin className="h-4 w-4" />
      {user?.addresses?.length ? "Change Address" : "Add Address"}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Shipping Address</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>Shipping Address</DrawerTitle>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  );
};
