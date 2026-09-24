"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, DollarSign, Gift, CheckCircle } from "lucide-react";

interface AffiliateDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AffiliateDialog({ trigger, onSuccess }: AffiliateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !accepted) {
      toast.error("Please fill in all fields and accept the terms");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Welcome to our affiliate program!");
        setOpen(false);
        setName("");
        setAccepted(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to join affiliate program");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Become an Affiliate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Join Our Affiliate Program
          </DialogTitle>
          <DialogDescription>
            Earn commissions by promoting our health products to your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Program Benefits:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Earn 5-15% commission on every sale</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-blue-600" />
                <span>Real-time tracking and reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span>Dedicated affiliate dashboard</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="affiliate-name">Affiliate Name</Label>
              <Input
                id="affiliate-name"
                placeholder="Choose a unique affiliate name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be your public affiliate identifier
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="accept-terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Accept Affiliate Terms
                </label>
                <p className="text-xs text-muted-foreground">
                  I agree to the affiliate program terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !accepted}
            className="gap-2"
          >
            {loading ? "Joining..." : "Join Program"}
            <Users className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}