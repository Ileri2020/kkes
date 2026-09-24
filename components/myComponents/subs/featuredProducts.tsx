"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, ShoppingCart, MessageCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import React, { useEffect, useState } from "react";
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

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  const [oralCare, setOralCare] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = useIsAdmin();
  const { addItem } = useCart();

  async function fetchData() {
    try {
      // 1. Fetch Admin Featured Products (Minimal payload)
      const featRes = await fetch("/api/dbhandler?model=featuredProduct&minimal=true&limit=15");
      const featData = await featRes.json();
      setProducts(featData.map((item: any) => ({
        ...item.product,
        categoryName: item.product.category?.name
      })));

      // If no featured products, fetch latest 10 products as fallback
      if (featData.length === 0) {
        const fallbackRes = await fetch("/api/dbhandler?model=product&minimal=true&limit=10");
        const fallbackData = await fallbackRes.json();
        setProducts(fallbackData.map((p: any) => ({
            ...p,
            categoryName: p.category?.name || "New Arrival"
        })));
      }

      // 2. Fetch Subset Sections via Server-side filtering
      // Fetch Brands (Server-side filtered)
      const brandsPromises = ["Emzor", "Vitabiotics", "Pfizer", "GSK", "Shalina", "Fidson"].map(brand => 
        fetch(`/api/dbhandler?model=product&brand=${brand}&minimal=true&limit=6`).then(res => res.json())
      );
      
      // Fetch Oral Care (Search by name on server)
      const oralCarePromise = fetch("/api/dbhandler?model=product&include=category&minimal=true&limit=10").then(res => res.json());

      const [brandResults, allProdData] = await Promise.all([
        Promise.all(brandsPromises),
        oralCarePromise
      ]);

      setBrandProducts(brandResults.flat().filter((p: any) => p.price > 0 && p.images && p.images.length > 0));
      
      // Still need some client-side filtering for complex logic if API isn't built for it, 
      // but now it's on a much smaller dataset (limit=50 default from API)
      const oral = allProdData.filter((p: any) => 
         (p.category?.name?.toLowerCase().includes("dental") || 
         p.category?.name?.toLowerCase().includes("oral") ||
         p.name.toLowerCase().includes("toothpaste")) &&
         p.price > 0 && p.images && p.images.length > 0
      ).slice(0, 15);
      setOralCare(oral);

    } catch (err) {
      console.error("Failed to fetch featured products", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  /** Standalone sub-component so each section gets its own stable autoplay ref */
  const ProductSection = ({ title, subtitle, items, href }: { title: string, subtitle: string, items: any[], href?: string }) => {
    const plugin = React.useRef(Autoplay({ delay: 3200, stopOnInteraction: false }));
    return (
    <div className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4">
        <div className="text-left">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Link href={href || "/store"} className="text-primary font-semibold flex items-center gap-1 hover:underline">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Continuous autoplay — no hover pause */}
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[plugin.current]}
        className="w-full relative px-4"
      >
        <CarouselContent className="-ml-4">
          {items.map((product) => (
            <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5 pt-2 pb-2">
              <ProductCard
                className="w-full"
                variant="default"
                orientation="vertical"
                product={{ 
                  ...product, 
                  inStock: true, 
                  originalPrice: Number(product.price) * 1.2, 
                  rating: 5,
                  categoryName: product.categoryName || product.category?.name || "Pharmacy"
                }}
                onAddToCart={() => handleAddToCart(product)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-sm" />
          <CarouselNext className="-right-4 bg-background/80 backdrop-blur-sm" />
        </div>
      </Carousel>
    </div>
    );
  };

  return (
    <section className="bg-muted/30 py-12 md:py-20">
      <div className="container mx-auto max-w-7xl">
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
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
        ) : (
          <>
            {/* 1. Admin Featured Section (Removed) */}

            {/* 2. Pharmacy Section – now in CommonMedications (below hero) */}

            {/* 3. Top Brands Section */}
            {brandProducts.length > 0 && (
               <ProductSection 
                title="Top Brands" 
                subtitle="Quality products from trusted global pharmaceutical leaders"
                items={brandProducts}
                href="/store"
               />
            )}

            {/* 4. Oral Care Section */}
            {oralCare.length > 0 && (
               <ProductSection 
                title="Dental & Oral Care" 
                subtitle="Maintain bright smiles with our expert dental selection"
                items={oralCare}
                href="/store?category=Dental%20Care"
               />
            )}

            {isAdmin && (
              <div className="flex justify-center mb-10">
                <Dialog onOpenChange={(open) => !open && fetchData()}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-accent hover:bg-accent/90">
                      <Plus className="h-4 w-4" />
                      Manage Home Sections
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Section Manager</DialogTitle>
                    </DialogHeader>
                    <FeaturedProductForm hideList={true} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
