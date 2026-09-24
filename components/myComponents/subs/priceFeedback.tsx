"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/hooks/useAppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquareWarning } from "lucide-react";

export function PriceFeedback({ productId, productName }: { productId: string, productName: string }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAppContext();

  const handleSubmit = async () => {
    if (!feedback) {
      toast.error("Please select a feedback option");
      return;
    }
    
    if (!user || user.email === "nil") {
      toast.error("Please sign in to provide feedback");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/dbhandler?model=priceFeedback", {
        userId: user.id,
        productId,
        feedback,
        comment,
      });
      toast.success("Feedback submitted successfully. Thank you!");
      setOpen(false);
      setFeedback("");
      setComment("");
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 mt-6 bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white transition-all">
          <MessageSquareWarning className="h-4 w-4" />
          Give Price Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Price Feedback for {productName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            What do you think about the pricing of this product?
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {["Too Expensive", "Slightly Expensive", "Fair Pricing", "Too Cheap"].map((opt) => (
              <Button 
                key={opt}
                variant={feedback === opt ? "default" : "outline"}
                className={feedback === opt ? "bg-primary text-white" : ""}
                onClick={() => setFeedback(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium mb-1 block">Additional Comments (Optional)</label>
            <Textarea 
              placeholder="Tell us more about your pricing experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InlinePriceFeedback({ productId, productName }: { productId: string, productName: string }) {
  const [feedback, setFeedback] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAppContext();

  const handleSubmit = async () => {
    if (!feedback) {
      toast.error("Please select a feedback option");
      return;
    }
    
    if (!user || user.email === "nil") {
      toast.error("Please sign in to provide feedback");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/dbhandler?model=priceFeedback", {
        userId: user.id,
        productId,
        feedback,
        comment,
      });
      toast.success("Feedback submitted successfully. Thank you!");
      setFeedback("");
      setComment("");
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-6 mt-6 border-t">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-accent">
        <MessageSquareWarning className="h-4 w-4" />
        Pricing Feedback
      </h3>
      <p className="text-sm text-muted-foreground">
        What do you think about the pricing?
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {["High Price", "Low Price"].map((opt) => (
          <Button 
            key={opt}
            variant={feedback === opt ? "default" : "outline"}
            className={feedback === opt ? "bg-primary text-white" : ""}
            onClick={() => setFeedback(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <Textarea 
          placeholder="Expected price or additional comments..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}

