"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

const IngredientCard = ({ ingredient, count, images }: { ingredient: string, count: number, images: string[] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [images]);

  return (
    <Link
      href={`/store?search=${ingredient.toLowerCase()}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        {images.map((img: string, idx: number) => (
          <img
            key={idx}
            src={img}
            alt={ingredient}
            className={`absolute inset-0 object-contain p-4 transition-opacity duration-1000 w-full h-full ${
              idx === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 rounded text-[10px] font-bold text-white z-10">
          Active
        </div>
      </div>
      <div className="p-4 text-center mt-auto">
        <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">
          {ingredient}
        </div>
        <div className="text-[10px] text-muted-foreground font-medium mt-1">
          {count} Products
        </div>
      </div>
    </Link>
  );
};

const FeaturedIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const autoplay1 = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const autoplay2 = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/dbhandler?model=product');
        const products = res.data;
        
        // Extract common ingredients and their images
        const ingredientMap = new Map();
        
        products.forEach((p: any) => {
          p.activeIngredients?.forEach((ing: string) => {
            const normalized = ing.trim();
            if (normalized.length < 3) return;
            
            if (!ingredientMap.has(normalized)) {
              ingredientMap.set(normalized, {
                name: normalized,
                count: 0,
                images: []
              });
            }
            const data = ingredientMap.get(normalized);
            data.count++;
            if (p.images?.[0] && data.images.length < 3) {
              data.images.push(p.images[0]);
            }
          });
        });

        // Soft sort by count and slice top 24
        const sorted = Array.from(ingredientMap.values())
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 24);
          
        setIngredients(sorted);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-background border-t">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10 text-left">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ingredients.length === 0) return null;

  const midPoint = Math.ceil(ingredients.length / 2);
  const topRow = ingredients.slice(0, midPoint);
  const bottomRow = ingredients.slice(midPoint);

  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden border-t">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 text-left">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Shop by Ingredient</h2>
          <p className="text-muted-foreground mt-2">Find target relief solutions powered by premium active components</p>
        </div>

        <div className="space-y-6">
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[autoplay1.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {topRow.map((ing, idx) => (
                <CarouselItem key={idx} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                  <IngredientCard 
                    ingredient={ing.name} 
                    count={ing.count} 
                    images={ing.images.length > 0 ? ing.images : ["/logo.png"]} 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[autoplay2.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {bottomRow.map((ing, idx) => (
                <CarouselItem key={idx} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                  <IngredientCard 
                    ingredient={ing.name} 
                    count={ing.count} 
                    images={ing.images.length > 0 ? ing.images : ["/logo.png"]} 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default FeaturedIngredients;
