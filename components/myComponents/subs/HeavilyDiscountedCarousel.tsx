import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./productCard";
import { useAppContext } from "@/hooks/useAppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowRight, Settings2, Check, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HeavilyDiscountedForm from "@/prisma/forms/HeavilyDiscountedForm";

interface HeavilyDiscountedProduct {
  id: string;
  productId: string;
  creatorId: string;
  approved: boolean;
  product: any;
}

export function HeavilyDiscountedCarousel() {
  const { user } = useAppContext();
  const [items, setItems] = useState<HeavilyDiscountedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const isProfessional = user?.role === "professional" || isAdmin;

  const fetchItems = async () => {
    try {
      // Admins see all for approval. Professionals/others see approved.
      // Additionally, users see their own even if unapproved if we pass userId.
      const url = `/api/heavily-discounted?admin=${isAdmin}&userId=${isAdmin ? "" : user?.id || ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Fetch discounted error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user, isAdmin]);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await axios.put(`/api/heavily-discounted`, { id, approved });
      toast.success(approved ? "Product approved" : "Product disapproved");
      fetchItems();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this product from rapid sale?")) return;
    try {
      await axios.delete(`/api/heavily-discounted?id=${id}`);
      toast.success("Product removed");
      fetchItems();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Filter approved for display, unless user is admin or creator
  const displayItems = useMemo(() => {
    return items.filter(item => item.approved || isAdmin || item.creatorId === user?.id);
  }, [items, isAdmin, user]);

  const [row1, row2] = useMemo(() => {
    const r1: HeavilyDiscountedProduct[] = [];
    const r2: HeavilyDiscountedProduct[] = [];
    displayItems.forEach((item, i) => {
      if (i % 2 === 0) r1.push(item);
      else r2.push(item);
    });
    return [r1, r2];
  }, [displayItems]);

  const CarouselRow = ({ items, reverse = false }: { items: HeavilyDiscountedProduct[], reverse?: boolean }) => {
    if (items.length === 0) return null;
    const doubled = [...items, ...items, ...items]; // Triple for seamless marquee
    return (
      <div className="overflow-hidden w-full py-4 relative group/row">
        <div 
          className={cn(
            "flex gap-6 w-max",
            reverse ? "animate-marquee-reverse hover:[animation-play-state:paused]" : "animate-marquee hover:[animation-play-state:paused]"
          )}
        >
          {doubled.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="w-[280px] flex-shrink-0 relative group/card">
              <ProductCard 
                product={item.product} 
                orientation="vertical" 
                className={cn(!item.approved && "opacity-60 grayscale-[0.5]")}
              />
              
              {!item.approved && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-lg">
                  Pending Approval
                </div>
              )}

              {/* Action Buttons Layer */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 opacity-0 group-hover/card:opacity-100 transition-opacity">
                {isAdmin && (
                  <Button 
                    size="icon" 
                    variant={item.approved ? "outline" : "default"} 
                    className={cn("h-8 w-8 rounded-full border-2", item.approved ? "bg-background text-red-500 hover:bg-red-50" : "bg-green-600 text-white hover:bg-green-700")}
                    onClick={(e) => { e.preventDefault(); handleApprove(item.id, !item.approved); }}
                  >
                    {item.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                )}
                {(isAdmin || item.creatorId === user?.id) && (
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => { e.preventDefault(); handleDelete(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="py-20 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <div className="flex gap-6 overflow-hidden">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-[280px] rounded-2xl shrink-0" />)}
      </div>
    </div>
  );

  if (displayItems.length === 0 && !isProfessional) return null;

  return (
    <section className="py-20 bg-accent/5 overflow-hidden border-y border-accent/10">
      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent mb-2">Rapid Sale</h3>
            <h2 className="text-4xl font-black text-foreground">Flash Deals & Clearances</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Authentic medical supplies at clearance prices. Limited quantities available — move fast!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/store?discounted=true">
              <Button variant="ghost" className="gap-2 group text-accent font-bold h-12 px-6 rounded-full border border-accent/20 hover:bg-accent/10">
                View All Deals
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            {isProfessional && (
              <Dialog open={isManageOpen} onOpenChange={(open) => { setIsManageOpen(open); if(!open) fetchItems(); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-accent hover:bg-accent/90 rounded-full h-12 px-6 shadow-lg shadow-accent/20">
                    <Plus className="h-5 w-5" />
                    List for Rapid Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-accent" />
                      Rapid Sale Manager
                    </DialogTitle>
                  </DialogHeader>
                  <HeavilyDiscountedForm />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <CarouselRow items={row1} />
        <CarouselRow items={row2} reverse />
      </div>

      {displayItems.length === 0 && (
         <div className="container mx-auto text-center py-10 italic text-muted-foreground text-sm">
            No products in flash deal currently. Professionals can add products above.
         </div>
      )}
    </section>
  );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
