"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ShippingAddress = {
  id?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zip?: string;
  phone?: string;
};

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT",
];

const PRESET_COUNTRIES = ["Nigeria", "United Kingdom", "United States", "Canada", "Ghana"];

type Props = {
  userId: string;
  existing?: ShippingAddress;
  onSaved?: (address: ShippingAddress) => void;
};

export default function UserShippingAddressForm({ userId, existing, onSaved }: Props) {
  const [address, setAddress] = useState<ShippingAddress>({
    country: existing?.country || "Nigeria",
    state: existing?.state || "",
    city: existing?.city || "",
    address: existing?.address || "",
    zip: existing?.zip || "",
    phone: existing?.phone || "",
    id: existing?.id,
  });

  const isNigeria = address.country === "Nigeria";
  const isPreset = PRESET_COUNTRIES.includes(address.country);

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    const updated = { ...address, [field]: value };
    setAddress(updated);
    if (onSaved) onSaved(updated);
  };

  const handleCountryChange = (val: string) => {
    if (val === "Other") {
      handleChange("country", "");
    } else {
      const updated = { ...address, country: val, state: "" };
      setAddress(updated);
      if (onSaved) onSaved(updated);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Country */}
      <div className="space-y-1">
        <Label htmlFor="user-shipping-country" className="text-sm">Country</Label>
        <select
          id="user-shipping-country"
          title="Select country"
          value={isPreset ? address.country : "Other"}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full border border-input bg-background rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PRESET_COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="Other">Other (type below)</option>
        </select>

        {!isPreset && (
          <Input
            type="text"
            value={address.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="Enter your country"
            className="mt-2"
          />
        )}
      </div>

      {/* State — dropdown for Nigeria, text input for others */}
      <div className="space-y-1">
        <Label htmlFor="user-shipping-state" className="text-sm">State / Region</Label>
        {isNigeria ? (
          <select
            id="user-shipping-state"
            title="Select state or region"
            value={address.state}
            onChange={(e) => handleChange("state", e.target.value)}
            className="w-full border border-input bg-background rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select state</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <Input
            type="text"
            value={address.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="State / Region"
          />
        )}
      </div>

      {/* City */}
      <div className="space-y-1">
        <Label className="text-sm">City</Label>
        <Input
          type="text"
          value={address.city}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="City"
        />
      </div>

      {/* Street Address */}
      <div className="space-y-1">
        <Label className="text-sm">Street Address</Label>
        <Input
          type="text"
          value={address.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="e.g. 12 My Street, Off Main Ave"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <Label className="text-sm">Phone Number</Label>
        <Input
          type="text"
          value={address.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="e.g. 0810-000-0000"
        />
      </div>

      {/* ZIP */}
      <div className="space-y-1">
        <Label className="text-sm">ZIP / Postal Code <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          type="text"
          value={address.zip || ""}
          onChange={(e) => handleChange("zip", e.target.value)}
          placeholder="ZIP / Postal Code"
        />
      </div>

      {/* Geolocation auto-fill */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs mt-1"
        onClick={() => {
          if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const data = await res.json();
                if (data?.address) {
                  const a = data.address;
                  const countryName = a.country || "Nigeria";
                  const isNG = countryName.toLowerCase().includes("nigeria");

                  const rawState = a.state || a.region || a.province || "";
                  const resolvedState = isNG
                    ? (NIGERIA_STATES.find((n) => rawState.toLowerCase().includes(n.toLowerCase())) || rawState)
                    : rawState;

                  const newAddress: ShippingAddress = {
                    ...address,
                    country: isNG ? "Nigeria" : countryName,
                    state: resolvedState,
                    city: a.city || a.town || a.village || a.suburb || "",
                    address: `${a.road || a.neighbourhood || ""} ${a.house_number || ""}`.trim(),
                    zip: a.postcode || "",
                  };

                  setAddress(newAddress);
                  if (onSaved) onSaved(newAddress);
                }
              } catch {
                alert("Failed to retrieve address from location");
              }
            },
            () => alert("Unable to retrieve your location")
          );
        }}
      >
        📍 Use Current Location
      </Button>
    </div>
  );
}
