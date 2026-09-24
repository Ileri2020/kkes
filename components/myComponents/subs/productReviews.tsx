"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, UserCircle2 } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAppContext();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      // Instead of writing a custom review query, just fetch the product with reviews included
      // But the dbhandler doesn't easily paginate nested reviews. Let's just fetch full product for now.
      const res = await axios.get(`/api/dbhandler?model=product&id=${productId}`);
      if (res.data?.reviews) {
        setReviews(res.data.reviews);
      }
    } catch (error) {
      console.error("Failed to load reviews");
    }
  };

  const handleReviewSubmit = async () => {
    if (!rating) {
      toast.error("Please provide a star rating");
      return;
    }
    
    if (!user || user.email === "nil") {
      toast.error("Please sign in to leave a review");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/dbhandler?model=review", {
        userId: user.id,
        productId,
        rating,
        comment,
      });
      toast.success("Review submitted successfully");
      setRating(0);
      setHoverRating(0);
      setComment("");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Review Submission Form */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h4 className="font-bold text-lg mb-4">Write a Review</h4>
        
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-8 w-8 cursor-pointer transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground stroke-muted"
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <Textarea 
          placeholder="Share your thoughts about this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none mb-4"
        />

        <Button onClick={handleReviewSubmit} disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Posting..." : "Post Review"}
        </Button>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg border-b pb-2">Customer Feedback ({reviews.length})</h4>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-xl">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card">
                <div className="flex-shrink-0 mt-1">
                  {r.user?.avatarUrl ? (
                    <img src={r.user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col flex-1">
                   <div className="flex justify-between items-start">
                      <p className="font-bold text-sm">{r.user?.name || "Anonymous User"}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                   </div>
                   <div className="flex gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted stroke-muted"
                          }`}
                        />
                      ))}
                   </div>
                   <p className="text-sm mt-2 text-foreground/90">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
