"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CategoryForm from "@/prisma/forms/CategoryForm";
import axios from "axios";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Fetch categories from backend
async function getCategories() {
  const res = await fetch(`/api/dbhandler?model=category`);
  if (!res.ok) return [];
  const categories = await res.json();
  return categories.map((cat: any) => {
    // Collect up to 3 images from related products
    const productImages = cat.products?.flatMap((p: any) => p.images).slice(0, 3) || [];
    const images = productImages.length > 0 ? productImages : [cat.image || "/logo.png"];
    
    return {
      id: cat.id,
      images: images,
      name: cat.name,
      description: cat.description || "",
      productCount: cat._count?.products || 0,
    };
  });
}

const CategoryCard = ({ category, isAdmin, onRefresh }: { category: any, isAdmin: boolean, onRefresh: () => void }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (category.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % category.images.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [category.images]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await axios.delete(`/api/dbhandler?model=category&id=${id}`);
        toast.success("Category deleted");
        onRefresh();
      } catch (err) {
        toast.error("Failed to delete category");
      }
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg h-full">
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 z-30">
          <Dialog onOpenChange={(open) => !open && onRefresh()}>
            <DialogTrigger asChild>
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm" onClick={(e) => e.stopPropagation()}>
                <Edit3 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Category: {category.name}</DialogTitle>
              </DialogHeader>
              <CategoryForm initialCategory={category} hideList={true} />
            </DialogContent>
          </Dialog>
          <Button
            size="icon"
            variant="destructive"
            className="h-7 w-7 rounded-full bg-destructive/80 backdrop-blur-sm shadow-sm"
            onClick={(e) => handleDelete(e, category.id, category.name)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Link
        href={`/store?category=${encodeURIComponent(category.name)}`}
        className="flex flex-col h-full"
      >
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          {category.images.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              alt={category.name}
              className={`absolute inset-0 object-contain p-4 transition-opacity duration-1000 w-full h-full ${
                idx === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="p-4 text-center mt-auto">
          <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">
            {category.name}
          </div>
          <div className="text-[10px] text-muted-foreground font-medium mt-1">
            {category.productCount} Products
          </div>
        </div>
      </Link>
    </div>
  );
};

import { useAppContext } from "@/hooks/useAppContext";

const FeaturedCategories = () => {
  const { user } = useAppContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const autoplay1 = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const autoplay2 = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  const fetchCategories = async () => {
    setLoading(true);
    const cats = await getCategories();
    // Filter out categories with 0 products if not admin/staff
    const activeCats = isAdmin ? cats : cats.filter((c: any) => c.productCount > 0);
    setCategories(activeCats);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Limit to 20 for carousel
  const carouselCategories = categories.slice(0, 20);
  const midPoint = Math.ceil(carouselCategories.length / 2);
  const topRow = carouselCategories.slice(0, midPoint);
  const bottomRow = carouselCategories.slice(midPoint);

  return (
    <section className="py-12 md:py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-left">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Shop All Categories</h2>
                <p className="text-muted-foreground mt-2">Discover our extensive range of health and wellness collections</p>
            </div>
            {isAdmin && (
                <Dialog onOpenChange={(open) => !open && fetchCategories()}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <CategoryForm />
                  </DialogContent>
                </Dialog>
            )}
        </div>

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="aspect-square w-full rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-2/3 mx-auto" />
                            <Skeleton className="h-4 w-1/3 mx-auto" />
                        </div>
                    </div>
                ))}
             </div>
        ) : showAll ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
               {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} isAdmin={isAdmin} onRefresh={fetchCategories} />
               ))}
            </div>
        ) : (
            <>
            <div className="space-y-6">
            {/* Top Row Carousel */}
            <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[autoplay1.current]}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                {topRow.map((category) => (
                    <CarouselItem key={category.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                    <CategoryCard category={category} isAdmin={isAdmin} onRefresh={fetchCategories} />
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>

            {/* Bottom Row Carousel */}
            <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[autoplay2.current]}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                {bottomRow.map((category) => (
                    <CarouselItem key={category.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                    <CategoryCard category={category} isAdmin={isAdmin} onRefresh={fetchCategories} />
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
            </div>
            
            {categories.length > 20 && (
                <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={() => setShowAll(true)}>
                        See All Categories
                    </Button>
                </div>
            )}
            </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
