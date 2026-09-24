"use client";

import { toggleWishlist } from "@/action/wishlist";
import { fetchGlobalWishlist, clearWishlistCache } from "@/lib/wishlist-store"; // ✅ ADDED

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getProductPrice, isProductInStock, PRICE_MARKUPS, formatPrice } from "@/lib/stock-pricing";
import Link from "next/link";
import * as React from "react";
import { MessageCircle, ShoppingCart, Heart, Star, Edit3, Trash2, Eye, FileText, Link as LinkIcon } from "lucide-react";
import { InlinePriceFeedback } from "@/components/myComponents/subs/priceFeedback";
import { useAppContext } from "@/hooks/useAppContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ProductForm from "@/prisma/forms/ProductForm";
import axios from "axios";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  orientation?: "vertical" | "horizontal";
  onAddToCart?: (product: any) => void;
  onAddToWishlist?: (productId: string) => void;
  product: any;
  variant?: "compact" | "default";
  showDiscount?: boolean;
};

export function ProductCard({
  className,
  orientation = "vertical",
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  showDiscount = false,
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);

  React.useEffect(() => {
    if (product?.id) {
      // ✅ Fetch the user's whole wishlist array AT ONCE via singleton pattern
      fetchGlobalWishlist()
        .then((wishlist) => {
           setIsInWishlist(wishlist.includes(product.id));
        })
        .catch(() => { });
    }
  }, [product?.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      setIsAddingToCart(true);
      setTimeout(() => {
        onAddToCart(product);
        setIsAddingToCart(false);
      }, 600);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startState = isInWishlist;
    setIsInWishlist(!startState);
    try {
      await toggleWishlist(product.id);
      clearWishlistCache(); // clear cache so the new state reflects
      if (onAddToWishlist) {
        onAddToWishlist(product.id);
      }
    } catch (err) {
      setIsInWishlist(startState);
    }
  };

  const { user } = useAppContext();
  const isAffiliate = user?.isAffiliate || false;

  const handleCopyAffiliateLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check affiliate status from session data in user context
    if (!user?.isAffiliate || !user?.affiliate) {
      toast.error("You must be an affiliate to generate affiliate links");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_ORIGIN_URL || window.location.origin;
    const affiliateLink = `${baseUrl}/product/${product.id}?affiliate=${user.affiliate.affiliateId}`;
    try {
      await navigator.clipboard.writeText(affiliateLink);
      toast.success("Affiliate link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  /**
   * Safe Data Access
   */
  const currentPrice = getProductPrice(product, user?.role);
  const inStock = typeof product.inStock === 'boolean' ? product.inStock : isProductInStock(product);
  const categoryName = product?.category?.name || product?.categoryName || "Pharmacy";
  const image = product?.images?.[0] || "/placeholder.png";
  const regClass = product?.regulatoryClassification || "OTC";
  const isPrescription = regClass === "Prescription Medicine";
  const isControlled = regClass === "Controlled Medicine";

  // For wholesalers: show first bulk price if available
  const isWholesaler = user?.role === "wholesaler";
  const firstBulk = isWholesaler && product.bulkPrices?.length > 0 ? product.bulkPrices[0] : null;
  const markup = PRICE_MARKUPS[user?.role as keyof typeof PRICE_MARKUPS] || PRICE_MARKUPS.customer;
  const displayPrice = firstBulk ? firstBulk.price * markup : currentPrice;
  const displayLabel = firstBulk ? `/${firstBulk.name}` : "";

  const whatsappNumber = "2348000000000"; // Replace with real company number
  const speakToRepUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I'm interested in the controlled medicine: ${product.name}. Please guide me on how to proceed.`)}`;

  // Rating Logic
  const ratingValue = React.useMemo(() => {
    if (typeof product.rating === 'number' && product.rating > 0) return product.rating;
    if (Array.isArray(product.reviews) && product.reviews.length > 0) {
      const total = product.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
      return total / product.reviews.length;
    }
    // If no reviews data is available (e.g. minimal fetch), 
    // we don't assume 0 unless there's an explicit rating field
    return product.averageRating || 0; 
  }, [product]);

  const hasDiscount = showDiscount && (product.discount ?? 0) > 0;
  const discountPercent = hasDiscount ? product.discount : 0;
  const originalPrice = displayPrice;
  const discountedPrice = hasDiscount
    ? displayPrice * (1 - discountPercent / 100)
    : displayPrice;

  const renderStars = () => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={`star-${product.id}-${i}`}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          5.0
        </span>
      </div>
    );
  };

  const isAdmin = useIsAdmin();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false); // ✅ ADDED

  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await axios.delete(`/api/dbhandler?model=product&id=${product.id}`);
        toast.success("Product deleted successfully");
        window.location.reload(); // Refresh to show changes
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  return (
    <div className={cn("group relative", className)} {...props}>
      {/* ℹ️ Info / Description Action (Floating Right) */}
      <div className="absolute top-2 right-2 z-30 flex flex-col gap-2">
          <Sheet open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 text-primary rounded-full bg-background/90 backdrop-blur-sm shadow-md transition-all duration-300 hover:scale-110"
                onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   setIsInfoDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto z-[100]" onClick={(e) => e.stopPropagation()}>
              <SheetHeader>
                <SheetTitle className="text-xl">{product?.name || "Product Details"}</SheetTitle>
                <SheetDescription className="sr-only">Description for {product?.name}</SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 text-base text-foreground prose dark:prose-invert max-w-none">
                 {product?.description ? (
                     <div dangerouslySetInnerHTML={{ __html: product.description }} />
                 ) : (
                     <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                       <Eye className="h-12 w-12 mb-4 opacity-50" />
                       <p className="italic">No description available for this product.</p>
                     </div>
                 )}
              </div>

              {/* Price Feedback Form */}
              <div className="mt-8">
                <InlinePriceFeedback productId={product.id} productName={product.name} />
              </div>
            </SheetContent>
          </Sheet>
      </div>

      {/* Admin Actions (Floating Left) */}
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-2 z-30">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Product: {product.name}</DialogTitle>
              </DialogHeader>
              <ProductForm initialProduct={product} hideList={true} />
            </DialogContent>
          </Dialog>

          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full bg-destructive/80 backdrop-blur-sm shadow-sm"
            onClick={handleDeleteProduct}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Link href={`/products/${product.id}`}>
        <Card
          className={cn(
            `
              relative w-full overflow-clip rounded-lg py-0 transition-all
              duration-200 ease-in-out shadow-md m-1 flex
            `,
            // horizontal on mobile, switches to vertical at md+
            orientation === "horizontal" ? "flex-row md:flex-col" : "flex-col",
            isHovered && "ring-1 ring-primary/20"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image */}
          <div
            className={cn(
              "relative aspect-square overflow-hidden rounded-t-lg flex justify-center items-center bg-muted",
              // 40% on mobile (horizontal), full width on md+ (flips to vertical)
              orientation === "horizontal" ? "w-[40%] md:w-full" : "w-full"
            )}
          >
            <img
              alt={product?.name || "Product"}
              src={image}
              className={cn(
                "object-cover w-full h-full transition-transform duration-300 ease-in-out",
                isHovered ? "scale-105" : "scale-100"
              )}
            />

            {/* Category badge moved to bottom-left */}
            <Badge
              className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm z-10"
              variant="outline"
            >
              {categoryName}
            </Badge>

            {/* Regulatory Badge */}
            <div className="absolute bottom-2 right-12 z-10 flex flex-col gap-1 items-end">
              {isPrescription && (
                <Badge className="bg-destructive/90 text-[10px] px-1.5 py-0" variant="default">
                  <FileText className="h-3 w-3 mr-1" /> Rx Required
                </Badge>
              )}
              {isControlled && (
                <Badge className="bg-accent/90 text-[10px] px-1.5 py-0" variant="default">
                  Controlled
                </Badge>
              )}
            </div>

            {/* Discount badge */}
            {hasDiscount && (
              <Badge
                className="absolute top-12 right-2 bg-destructive text-destructive-foreground z-20"
              >
                {discountPercent}% OFF
              </Badge>
            )}

            {/* Wishlist */}
            <Button
              className={cn(
                `
                  absolute right-2 bottom-2 z-10 rounded-full bg-background/80
                  backdrop-blur-sm transition-opacity duration-300
                `
              )}
              onClick={handleAddToWishlist}
              size="icon"
              type="button"
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isInWishlist
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                )}
              />
            </Button>
          </div>

          <div className="w-full flex-1">
            <CardContent className="p-4 pt-2">
              <h3 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                {product?.name || "Product Name"}
              </h3>

              {variant === "default" && (
                <>
                  <div className="mt-1.5">{renderStars()}</div>

                  <div className="mt-2 flex items-center flex-wrap gap-1.5">
                    <span className="font-medium text-foreground">
                      ₦{formatPrice(discountedPrice)}{displayLabel && <span className="text-xs text-muted-foreground ml-0.5">{displayLabel}</span>}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₦{formatPrice(originalPrice)}
                      </span>
                    )}
                    {firstBulk && (
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 rounded-full">
                        Bulk Deal
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>

            {variant === "default" && (
              <CardFooter className="p-4 pt-0">
                {isAffiliate ? (
                  <div className="w-full flex gap-2">
                    <Button
                      className="flex-1 gap-2 transition-all"
                      disabled={isAddingToCart}
                      onClick={(e) => {
                        if (isControlled) {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(speakToRepUrl, "_blank");
                        } else {
                          handleAddToCart(e);
                        }
                      }}
                    >
                      {isControlled ? (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          Speak to Rep
                        </>
                      ) : (
                        <>
                          {isAddingToCart ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          ) : (
                            <ShoppingCart className="h-4 w-4" />
                          )}
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleCopyAffiliateLink}
                      title="Copy affiliate link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full gap-2 transition-all",
                      isAddingToCart && "opacity-70",
                      isControlled && "bg-accent hover:bg-accent/90"
                    )}
                    disabled={isAddingToCart}
                    onClick={(e) => {
                      if (isControlled) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(speakToRepUrl, "_blank");
                      } else {
                        handleAddToCart(e);
                      }
                    }}
                  >
                    {isControlled ? (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Speak to Rep
                      </>
                    ) : (
                      <>
                        {isAddingToCart ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        Add to Cart
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            )}

            {variant === "compact" && (
              <CardFooter className="p-4 pt-0">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      ₦{formatPrice(discountedPrice)}{displayLabel && <span className="text-xs text-muted-foreground ml-0.5">{displayLabel}</span>}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₦{formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="h-8 w-8 rounded-full"
                    disabled={isAddingToCart}
                    onClick={(e) => {
                      if (isControlled) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(speakToRepUrl, "_blank");
                      } else {
                        handleAddToCart(e);
                      }
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    {isControlled ? <MessageCircle className="h-4 w-4 text-accent" /> : <ShoppingCart className="h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            )}

            {!inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Badge className="px-3 py-1 text-sm" variant="destructive">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
