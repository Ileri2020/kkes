"use client";
import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/hooks/useAppContext";
import axios from "axios";
import UserShippingAddressForm from "@/prisma/forms/userShippingAddressForm";
import { CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ShippingAddress = {
  id?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zip?: string;
  phone?: string;
};

const EditUser = () => {
  const { user, setUser } = useAppContext();

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    contact: "",
    role: "customer",
    avatarUrl: "",
    professionalType: "",
    regNumber: "",
    licenseImage: "",
    facilityName: "",
    facilityAddress: "",
    facilityRegNumber: "",
  });

  const [addressData, setAddressData] = useState<ShippingAddress>({
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Nigeria",
    phone: "",
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        name: user.name || "",
        contact: user.contact || "",
        role: user.role || "customer",
        avatarUrl: user.avatarUrl || user.image || "",
        professionalType: user.professionalType || "",
        regNumber: user.regNumber || "",
        licenseImage: user.licenseImage || "",
        facilityName: user.facilityName || "",
        facilityAddress: user.facilityAddress || "",
        facilityRegNumber: user.facilityRegNumber || "",
      });

      if (user.addresses?.[0]) {
        setAddressData(user.addresses[0]);
      }

      setEditId(user.id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Update user profile
      const userRes = await axios.put(`/api/dbhandler?model=user&id=${editId}`, {
        ...formData,
        id: editId,
      });

      // Update or create shipping address
      let addressRes;
      if (addressData.id) {
        addressRes = await axios.put(
          `/api/dbhandler?model=shippingAddress&id=${addressData.id}`,
          { ...addressData, userId: user.id }
        );
      } else if (
        addressData.address ||
        addressData.city ||
        addressData.state ||
        addressData.country
      ) {
        addressRes = await axios.post(`/api/dbhandler?model=shippingAddress`, {
          ...addressData,
          userId: user.id,
        });
      }

      // Update context
      setUser({
        ...userRes.data,
        addresses: addressRes ? [addressRes.data] : user.addresses || [],
      });

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Update failed:", err.response?.data || err);
      setErrorMessage("Failed to update profile. Please try again.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="flex-1 gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-w-3xl mx-auto py-6">
        <DrawerHeader>
          <DrawerTitle className="text-center text-lg">
            Edit Profile — <span className="text-primary">HealthClique</span>
          </DrawerTitle>
        </DrawerHeader>

        {/* Feedback messages */}
        {successMessage && (
          <Alert className="mx-6 mb-4 border-green-500 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive" className="mx-6 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-4">
          {/* ── Personal Info ── */}
          <div className="rounded-lg border bg-secondary/30 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h3>

            <div className="space-y-1">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-contact">Phone / Contact</Label>
              <Input
                id="edit-contact"
                type="text"
                placeholder="e.g. 0810-000-0000"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          {/* ── Professional / Wholesaler Info ── */}
          {(formData.role === "professional" || formData.role === "wholesaler") && (
            <div className="rounded-lg border bg-primary/5 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                Business & Professional Verification
              </h3>

              {formData.role === "professional" && (
                <>
                  <div className="space-y-1">
                    <Label>Professional Type</Label>
                    <select 
                      className="w-full p-2 rounded-md border bg-background"
                      value={formData.professionalType}
                      onChange={(e) => setFormData({ ...formData, professionalType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Registration Number</Label>
                    <Input
                      placeholder="e.g. PH/123456"
                      value={formData.regNumber}
                      onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Practice License Image URL</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.licenseImage}
                      onChange={(e) => setFormData({ ...formData, licenseImage: e.target.value })}
                    />
                  </div>
                </>
              )}

              {formData.role === "wholesaler" && (
                <>
                  <div className="space-y-1">
                    <Label>Facility Name</Label>
                    <Input
                      placeholder="Hospital or Pharmacy Name"
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Facility Address</Label>
                    <Input
                      placeholder="Physical address"
                      value={formData.facilityAddress}
                      onChange={(e) => setFormData({ ...formData, facilityAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Facility Registration Number</Label>
                    <Input
                      placeholder="CAC or PCN Reg No"
                      value={formData.facilityRegNumber}
                      onChange={(e) => setFormData({ ...formData, facilityRegNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Shipping Address ── */}
          <div className="rounded-lg border bg-secondary/30 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Shipping Address
            </h3>
            <UserShippingAddressForm
              userId={user.id}
              existing={addressData}
              onSaved={(addr) => setAddressData(addr)}
            />
          </div>

          <DrawerFooter className="flex flex-row gap-3 px-0 pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DrawerClose>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes →"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default EditUser;
