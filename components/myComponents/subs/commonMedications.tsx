"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { ProductCard } from "./productCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FeaturedProductForm from "@/prisma/forms/FeaturedProductForm";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

/**
 * CommonMedications – shown just below the hero on the home page.
 * Admins see a "+ Feature / − Remove" toggle button on each card.
 */
const CommonMedications = () => {
  const [pharmacyProducts, setPharmacyProducts] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featuredMap, setFeaturedMap] = useState<Record<string, string>>({}); // productId → featuredProduct.id
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const { addItem } = useCart();
  const plugin = React.useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, featRes] = await Promise.all([
        fetch("/api/dbhandler?model=product&include=category&minimal=true&limit=50"),
        fetch("/api/dbhandler?model=featuredProduct&minimal=true&limit=50"),
      ]);
      const prodData = await prodRes.json();
      const featData = await featRes.json();

      // Common Medications — first 15 products with images and price > 0
      setPharmacyProducts(prodData.filter((p: any) => p.price > 0 && p.images && p.images.length > 0).slice(0, 15));

      // Build featuredIds and featuredMap for toggling
      const ids = new Set<string>();
      const map: Record<string, string> = {};
      if (Array.isArray(featData)) {
        featData.forEach((f: any) => {
          ids.add(f.productId);
          map[f.productId] = f.id;
        });
      }
      setFeaturedIds(ids);
      setFeaturedMap(map);
    } catch (err) {
      console.error("CommonMedications: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleFeatured = async (product: any) => {
    const isFeatured = featuredIds.has(product.id);
    try {
      if (isFeatured) {
        const featId = featuredMap[product.id];
        await axios.delete(`/api/dbhandler?model=featuredProduct&id=${featId}`);
        toast.success(`${product.name} removed from Deals carousel`);
      } else {
        await axios.post("/api/dbhandler?model=featuredProduct", {
          productId: product.id,
        }, { headers: { "Content-Type": "application/json" } });
        toast.success(`${product.name} added to Deals carousel`);
      }
      await fetchData();
    } catch (err) {
      toast.error("Failed to update featured list");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Products</h2>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (pharmacyProducts.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden relative">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Our Curated Selection</h3>
            <h2 className="text-4xl font-black text-foreground">Featured Products</h2>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-primary" />
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Dialog open={manageOpen} onOpenChange={(open) => { setManageOpen(open); if (!open) fetchData(); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full h-11 px-6 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Manage Deals Carousel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Manage Deals & New Arrivals</DialogTitle>
                  </DialogHeader>
                  <FeaturedProductForm hideList={false} />
                </DialogContent>
              </Dialog>
            )}

            <Link href="/store?featured=true">
              <Button variant="ghost" className="gap-2 group text-primary font-bold">
                Explore All Featured
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Carousel — continuous, no pause on hover */}
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[plugin.current]}
          className="w-full relative px-2 md:px-4"
        >
          <CarouselContent className="-ml-4">
            {pharmacyProducts.map((product) => {
              const isFeatured = featuredIds.has(product.id);
              return (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pt-2 pb-2"
                >
                  <div className="relative group/card">
                    <ProductCard
                      className="w-full"
                      variant="default"
                      orientation="vertical"
                      product={{
                        ...product,
                        inStock: true,
                        originalPrice: Number(product.price) * 1.2,
                        rating: 5,
                        categoryName: product.category?.name || "Pharmacy",
                      }}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                    {/* Admin inline toggle: always visible for admins */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant={isFeatured ? "destructive" : "default"}
                        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 text-xs gap-1 px-3 py-1 h-7 rounded-full shadow-lg whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFeatured(product);
                        }}
                      >
                        {isFeatured ? (
                          <><Minus className="h-3 w-3" /> Remove from Deals</>
                        ) : (
                          <><Plus className="h-3 w-3" /> Add to Deals</>
                        )}
                      </Button>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-sm" />
            <CarouselNext className="-right-4 bg-background/80 backdrop-blur-sm" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default CommonMedications;
