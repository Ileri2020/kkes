"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/stock-pricing";
import axios from "axios";
import { Loader2, RefreshCcw, ShoppingCart, Plus, Search, ArrowLeftRight, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import MonnifyPaymentButton from "@/components/payment/monnify";
// Check if Flutterwave hook exists
// import FlutterWaveButtonHook from "../../payment/flutterwavehook";
import { useAppContext } from "@/hooks/useAppContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { getStoredAffiliateReferral } from "@/lib/affiliate-tracking";
import { toast } from "sonner";

interface CartDetailsProps {
    cartId: string;
    onPaymentSuccess?: () => void;
}

interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        images: string[];
    } | null;
    customName?: string;
    customPrice?: number;
    isSpecial?: boolean;
}

interface CartData {
    id: string;
    userId: string;
    name?: string;
    total: number;
    deliveryFee?: number;
    status: string;
    prescriptionUrl?: string;
    pharmacistSummary?: string;
    createdAt: string;
    products: CartItem[];
    payment?: {
        method: string;
        amount: number;
        tx_ref?: string;
    } | null;
}

const normalizeState = (state?: string | null): string | null => {
    if (!state) return null;
    return state.replace(/state/i, "").replace(/[-\s]/g, "_").trim();
};

interface Address {
    id: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
}

export function CartDetails({ cartId, onPaymentSuccess }: CartDetailsProps) {
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAppContext();
    const { clearCart, addItem } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");

    // Replacement State
    const [replacingItem, setReplacingItem] = useState<CartItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [potentialReplacements, setPotentialReplacements] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await axios.get(`/api/dbhandler?model=product`);
                    const data = Array.isArray(res.data) ? res.data : [];
                    setPotentialReplacements(data.filter((p: any) => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice(0, 5));
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setPotentialReplacements([]);
        }
    }, [searchQuery]);

    const handleSwapItem = async (newProduct: any) => {
        if (!cart || !replacingItem) return;

        const oldPrice = (replacingItem.product?.price || 0) * replacingItem.quantity;
        const newPrice = (newProduct.price || 0) * replacingItem.quantity;
        const diff = oldPrice - newPrice;

        try {
            // 1. Delete old CartItem
            await axios.delete(`/api/dbhandler?model=cartItem&id=${replacingItem.id}`);
            
            // 2. Add new CartItem
            await axios.post(`/api/dbhandler?model=cartItem`, {
                cartId: cart.id,
                productId: newProduct.id,
                quantity: replacingItem.quantity
            });

            // 3. Update User Wallet if surplus (diff > 0) AND order is already paid/confirmed
            if (diff > 0 && isLocked) {
                const userRes = await axios.get(`/api/dbhandler?model=user&id=${cart.userId}`);
                const userData = userRes.data;
                const newBalance = (userData.walletBalance || 0) + diff;
                await axios.put(`/api/dbhandler?model=user&id=${cart.userId}`, {
                    walletBalance: newBalance
                });
                toast.success(`₦${formatPrice(diff)} refunded to user's wallet`);
            }

            // 4. Update cart total if NOT locked (so price change reflects in what they see to pay)
            if (!isLocked) {
                const newTotal = cart.total - diff;
                await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, {
                    total: newTotal
                });
            }

            // 5. Send message to user
            const messageContent = `[HEALTHCLIQUE PHARMACY] Your order (ID: ${cart.id.slice(-6)}) has been updated by a pharmacist. Replaced "${replacingItem.product?.name}" with "${newProduct.name}". ${diff > 0 && isLocked ? `A surplus of ₦${formatPrice(diff)} has been credited to your Health Wallet.` : diff < 0 ? `Please note the balance difference of ₦${formatPrice(Math.abs(diff))} added to your total.` : `Total price adjusted.`}`;
            
            await axios.post(`/api/dbhandler?model=message`, {
                content: messageContent,
                senderId: user.id,
                receiverId: cart.userId
            });

            toast.success("Product replaced and user notified");
            setReplacingItem(null);
            setSearchQuery("");
            
            const freshCart = await axios.get(`/api/dbhandler?model=cart&id=${cart.id}`);
            setCart(Array.isArray(freshCart.data) ? freshCart.data[0] : freshCart.data);

        } catch (err) {
            console.error("Swap failed", err);
            toast.error("Failed to swap product");
        }
    };

    const handleWalletPayment = async () => {
        if (!cart || !user) return;
        if ((user.walletBalance || 0) < totalAmount) {
            toast.error("Insufficient wallet balance. Please top up your Health Wallet.");
            return;
        }

        try {
           // 1. Deduct from wallet
           const newBalance = user.walletBalance - totalAmount;
           await axios.put(`/api/dbhandler?model=user&id=${user.id}`, { walletBalance: newBalance });

           // 2. Mark cart as paid
           await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, {
               status: "paid",
               total: totalAmount,
               deliveryFee: deliveryFee
           });

           // 3. Check for affiliate referral and credit commission
           const affiliateReferral = getStoredAffiliateReferral();
           if (affiliateReferral) {
               try {
                   const commissionResponse = await axios.post('/api/affiliate/commission', {
                       affiliateId: affiliateReferral.affiliateId,
                       amount: totalAmount,
                       orderId: cart.id,
                   });
                   if (commissionResponse.data.success) {
                       toast.success(`Affiliate commission credited: ₦${commissionResponse.data.commission.toFixed(2)}`);
                   }
               } catch (commissionError) {
                   console.error('Failed to credit affiliate commission:', commissionError);
                   // Don't show error toast to user as payment was successful
               }
           }

           // 4. Update local state
           setCart(prev => prev ? ({ ...prev, status: "paid" }) : null);
           toast.success("Order paid successfully via Health Wallet!");

           if (onPaymentSuccess) onPaymentSuccess();
        } catch (err) {
           console.error("Wallet payment failed", err);
           toast.error("Payment failed. Please try again.");
        }
    };

    useEffect(() => {
        if (user?.addresses?.length && !selectedAddressId) {
            setSelectedAddressId(user.addresses[0].id);
        }
    }, [user?.addresses]);

    useEffect(() => {
        const fetchCartDetails = async () => {
            if (!cartId) return;
            setLoading(true);
            setError(null);
            try {
                // Fetching via dbhandler
                const res = await axios.get(`/api/dbhandler?model=cart&id=${cartId}`);
                if (res.data) {
                    // Usually an array if fetching all, but id fetch might return an array of 1 or object
                    const data = Array.isArray(res.data) ? res.data.find((c: any) => c.id === cartId) : res.data;
                    setCart(data);
                    setEditedName(data?.name || "");
                } else {
                    setError("Cart not found.");
                }
            } catch (err) {
                console.error("Failed to fetch cart details:", err);
                setError("Failed to load cart details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCartDetails();
    }, [cartId]);

    const handleSaveName = async () => {
        if (!cart) return;
        try {
            await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, { name: editedName });
            setCart({ ...cart, name: editedName });
            setIsEditingName(false);
            toast.success("Cart name updated");
        } catch (err) {
            console.error("Failed to update name", err);
            toast.error("Failed to update cart name");
        }
    }

    const calculateDeliveryFee = (address?: Address | null): number => {
        return 3000; // Flat fee for HealthClique for now
    };

    const selectedAddress = user?.addresses?.find((a: Address) => a.id === selectedAddressId);
    
    // Safety check, handles DB nested products correctly if the structure is raw or transformed
    const validProducts = Array.isArray(cart?.products) ? cart.products : [];
    
    const subtotal = validProducts.reduce((acc, item) => {
        const price = item.customPrice || item?.product?.price || (item as any)?.price || 0;
        return acc + (price * (item?.quantity || 1));
    }, 0);

    const isLocked = cart?.status === "paid" || cart?.status === "completed" || cart?.status === "unconfirmed" || !!cart?.payment;

    const deliveryFee = isLocked
        ? (cart?.deliveryFee ?? 0)
        : validProducts.length > 0 ? calculateDeliveryFee(selectedAddress) : 0;

    const totalAmount = isLocked
        ? (cart?.total || 0)
        : subtotal + deliveryFee;

    const handleMakeCurrent = () => {
        if (!cart) return;
        if (confirm("This will replace your current active cart with the items from this order. Continue?")) {
            clearCart();
            validProducts.forEach(item => {
                const product: any = (item as any).product || item;
                addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    category: product.category || "General"
                }, item.quantity);
            });
            toast.success("Cart updated successfully!");
        }
    };

    const handleAddToCurrent = () => {
        if (!cart) return;
        validProducts.forEach(item => {
            const product = (item as any).product || item;
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images,
                category: product.category || "General"
            }, item.quantity);
        });
        toast.success("Items added to your active cart!");
    };

    const markAsPaid = async () => {
        try {
            await axios.put(`/api/dbhandler?model=cart&id=${cart?.id}`, {
                status: "unconfirmed",
                total: totalAmount,
                deliveryFee: deliveryFee
            });
            setCart(prev => prev ? ({ ...prev, status: "unconfirmed" }) : null);
            toast.success("Payment marked as pending verification.");
            if (onPaymentSuccess) onPaymentSuccess();
        } catch (err) {
            toast.error("Failed to update cart status");
        }
    }

    if (loading) {
        return (
            <Card className="w-full h-full min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (error || !cart) {
        return (
            <Card className="w-full">
                <CardContent className="py-10 text-center text-muted-foreground">
                    {error || "Cart not found"}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full overflow-hidden flex flex-col border-none shadow-none lg:border lg:shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b mb-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             {isEditingName ? (
                                 <div className="flex items-center gap-2">
                                     <input 
                                         className="h-8 rounded border px-2 text-sm max-w-[150px]"
                                         value={editedName}
                                         onChange={(e) => setEditedName(e.target.value)}
                                         placeholder="Name this cart..."
                                     />
                                     <Button size="sm" onClick={handleSaveName}>Save</Button>
                                     <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>Cancel</Button>
                                 </div>
                             ) : (
                                 <CardTitle className="text-xl font-semibold flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                                     {cart?.name || (isLocked ? "Order Details" : "Review & Pay")}
                                     <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 font-normal ml-2">(Edit Name)</span>
                                 </CardTitle>
                             )}
                        </div>
                        <Badge variant={cart?.status === 'paid' ? "default" : cart?.status === 'unconfirmed' ? "outline" : "secondary"}>
                            {cart?.status || "Pending"}
                        </Badge>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleAddToCurrent}>
                            <Plus className="mr-2 h-3 w-3" /> Add to Cart
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleMakeCurrent}>
                            <RefreshCcw className="mr-2 h-3 w-3" /> Make Current
                        </Button>
                    </div>

                    {/* Prescription Image View */}
                    {cart?.prescriptionUrl && (
                        <div className="mt-2 space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Prescription Snapshot</label>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border shadow-sm group">
                                <img src={cart.prescriptionUrl} alt="Prescription" className="w-full h-full object-contain bg-background" />
                                <a 
                                    href={cart.prescriptionUrl} 
                                    target="_blank" 
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                                >
                                    View Full Image
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Pharmacist Summary Row */}
                    {(cart?.pharmacistSummary || (user?.role === "admin" || user?.role === "staff")) && (
                        <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Pharmacist's Medical Summary
                                </label>
                                {(user?.role === "admin" || user?.role === "staff") && (
                                    <Badge variant="outline" className="text-[8px] h-4">Admin Access</Badge>
                                )}
                            </div>
                            
                            {(user?.role === "admin" || user?.role === "staff") ? (
                                <div className="space-y-2">
                                    <textarea 
                                        className="w-full min-h-[80px] text-xs p-2 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Enter dosage instructions, precautions, and medical notes..."
                                        value={cart?.pharmacistSummary || ""}
                                        onChange={(e) => setCart(prev => prev ? ({ ...prev, pharmacistSummary: e.target.value }) : null)}
                                    />
                                    <Button 
                                        size="sm" 
                                        className="h-7 text-[10px] font-bold w-full"
                                        onClick={async () => {
                                            try {
                                                await axios.put(`/api/dbhandler?model=cart&id=${cart?.id}`, { pharmacistSummary: cart?.pharmacistSummary });
                                                toast.success("Summary updated successfully");
                                            } catch (err) {
                                                toast.error("Failed to save summary");
                                            }
                                        }}
                                    >
                                        Save Summary
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                                    "{cart?.pharmacistSummary}"
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-0 px-1">
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
                        <AnimatePresence>
                            {validProducts.map((item: any) => {
                                const isSpecial = item.isSpecial;
                                const product: any = (item as any).product || item;
                                const imageUrl = isSpecial ? "/placeholder.jpg" : (product.images?.[0] || "/placeholder.jpg");
                                const displayName = isSpecial ? (item.customName || item.name) : (product?.name ?? "Unnamed product");
                                const currentPrice = isSpecial ? (item.customPrice || 0) : (product?.price || 0);

                                return (
                                    <motion.div
                                        key={item.id}
                                        className={cn(
                                            "flex flex-col rounded-lg border bg-card p-3 shadow-sm",
                                            isSpecial && "border-primary/20 bg-primary/5"
                                        )}
                                    >
                                        <div className="flex gap-4">
                                            <img
                                                src={imageUrl}
                                                alt={displayName}
                                                className="h-20 w-20 rounded-xl object-cover bg-muted border"
                                            />
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="space-y-1">
                                                        <Link href={isSpecial ? "#" : `/store/${product?.id}`} className="text-sm font-bold line-clamp-2 hover:underline decoration-primary">
                                                            {displayName}
                                                            {item.bulkName && <span className="text-xs ml-2 text-primary font-black uppercase">({item.bulkName})</span>}
                                                        </Link>
                                                        {isSpecial && (
                                                            <Badge variant="secondary" className="text-[8px] h-4 bg-primary/20 text-primary border-none">
                                                                Special Order / Scarce
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {(user?.role === "admin" || user?.role === "staff") && !isSpecial && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                            onClick={() => setReplacingItem(item)}
                                                        >
                                                            <ArrowLeftRight className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex justify-between items-center">
                                                    <div className="flex items-center text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                                                        Qty: {item.quantity}
                                                    </div>
                                                     <div className="text-right">
                                                        <span className="text-sm font-black text-primary">
                                                            {currentPrice > 0 ? `₦${formatPrice(currentPrice * item.quantity)}` : "Price Awaiting"}
                                                        </span>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Special Pricing */}
                                        {isSpecial && (user?.role === "admin" || user?.role === "staff") && (
                                            <div className="mt-3 pt-3 border-t border-primary/10 flex items-center gap-3">
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">₦</span>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Set Price" 
                                                        className="h-8 pl-6 text-xs font-bold rounded-lg border-primary/20 focus-visible:ring-primary"
                                                        value={item.customPrice || ""}
                                                        onChange={(e) => {
                                                            const newPrice = parseFloat(e.target.value);
                                                            setCart((prev: any) => {
                                                                if (!prev) return null;
                                                                const updatedProducts = prev.products.map((p: any) => 
                                                                    p.id === item.id ? { ...p, customPrice: newPrice } : p
                                                                );
                                                                return { ...prev, products: updatedProducts };
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 rounded-lg px-4 text-[10px] font-black"
                                                    disabled={!item.customPrice}
                                                    onClick={async () => {
                                                        try {
                                                            await axios.put(`/api/dbhandler?model=cartItem&id=${item.id}`, {
                                                                customPrice: item.customPrice
                                                            });
                                                            
                                                             // Notify User
                                                            const message = `[PRICE UPDATE] Pharmacist has set the price for your request "${displayName}" to ₦${formatPrice(item.customPrice)}. Your total order has been updated.`;
                                                            await axios.post(`/api/dbhandler?model=message`, {
                                                                content: message,
                                                                senderId: user.id,
                                                                receiverId: cart.userId
                                                            });

                                                            toast.success("Price set and user notified!");
                                                            
                                                            // Refresh cart to update total
                                                            const freshCart = await axios.get(`/api/dbhandler?model=cart&id=${cart.id}`);
                                                            setCart(Array.isArray(freshCart.data) ? freshCart.data[0] : freshCart.data);
                                                        } catch (err) {
                                                            toast.error("Failed to update special price");
                                                        }
                                                    }}
                                                >
                                                    Set Price
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Replacement Dialog */}
                    <Dialog open={!!replacingItem} onOpenChange={(open) => !open && setReplacingItem(null)}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Replace Product</DialogTitle>
                                <CardDescription>
                                    Swapping: {replacingItem?.product?.name}
                                </CardDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search replacement..." 
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    {isSearching && <div className="text-center py-2"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                                    {potentialReplacements.map(p => (
                                        <div 
                                            key={p.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => handleSwapItem(p)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={p.images?.[0]} className="w-10 h-10 rounded object-cover" />
                                                 <div>
                                                    <p className="text-xs font-bold">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">₦{formatPrice(p.price)}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost">Select</Button>
                                        </div>
                                    ))}
                                    {searchQuery.length > 2 && potentialReplacements.length === 0 && !isSearching && (
                                        <p className="text-center text-xs text-muted-foreground py-2">No products found</p>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="bg-muted/10 p-6 space-y-3 border-t mt-auto">
                        {!isLocked && user?.id !== 'nil' && (
                            <div className="space-y-1 mb-4 p-3 bg-background border rounded-lg">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    Delivery Address
                                </label>
                                {user?.addresses && user?.addresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={selectedAddressId ?? ""}
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                        >
                                            {user.addresses.map((address: Address) => (
                                                <option key={address.id} value={address.id}>
                                                    {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-destructive">No addresses found in profile.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>₦{formatPrice(subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                Delivery Fee
                                {!isLocked && <span className="text-xs text-muted-foreground">({selectedAddress?.state || "Standard"})</span>}
                            </span>
                            <span>₦{formatPrice(deliveryFee)}</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>₦{formatPrice(totalAmount)}</span>
                        </div>

                        {!isLocked && user && selectedAddressId && (
                             <div className="space-y-2 w-full mt-4">
                                 <Button 
                                     className="w-full h-12 rounded-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/20" 
                                     onClick={handleWalletPayment}
                                 >
                                     <Shield className="mr-2 h-4 w-4" />
                                     Pay with Health Wallet
                                 </Button>

                                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                     <Button className="w-full h-12 rounded-xl font-bold border-2" variant="outline" onClick={markAsPaid}>
                                         Pay via Flutterwave/Card
                                     </Button>

                                     <MonnifyPaymentButton
                                         reference={cart?.id ? `HC_${cart.id}` : `HC_${Date.now()}`}
                                         amount={totalAmount}
                                         currency="NGN"
                                         email={user?.email || ''}
                                         phoneNumber={user?.phone || ''}
                                         name={user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Guest'}
                                         onSuccess={async (response) => {
                                             toast.success('Monnify payment completed. Updating order status...');
                                             if (!cart) return;
                                             try {
                                                 await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, {
                                                     status: 'paid',
                                                     total: totalAmount,
                                                     deliveryFee,
                                                     payment: {
                                                         method: 'monnify',
                                                         amount: totalAmount,
                                                         tx_ref: response?.reference || response?.transactionReference || '',
                                                     },
                                                 });
                                                 setCart({ ...cart, status: 'paid' });

                                                 // Check for affiliate referral and credit commission
                                                 const affiliateReferral = getStoredAffiliateReferral();
                                                 if (affiliateReferral) {
                                                     try {
                                                         const commissionResponse = await axios.post('/api/affiliate/commission', {
                                                             affiliateId: affiliateReferral.affiliateId,
                                                             amount: totalAmount,
                                                             orderId: cart.id,
                                                             cartId: cart.id,
                                                         });
                                                         if (commissionResponse.data.success) {
                                                             toast.success(`Affiliate commission credited: ₦${commissionResponse.data.commission.toFixed(2)}`);
                                                         }
                                                     } catch (commissionError) {
                                                         console.error('Failed to credit affiliate commission:', commissionError);
                                                         // Don't show error toast to user as payment was successful
                                                     }
                                                 }

                                                 onPaymentSuccess?.();
                                             } catch (error) {
                                                 console.error('Failed to mark cart paid after Monnify success', error);
                                                 toast.error('Could not finalize order status after Monnify payment');
                                             }
                                         }}
                                         onFailure={(error) => {
                                             console.error('Monnify error', error);
                                         }}
                                     />
                                 </div>
                             </div>
                        )}
                        {!isLocked && user && !selectedAddressId && (
                             <p className="text-sm text-destructive mt-2 text-center font-bold">Please add an address in your account settings.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
