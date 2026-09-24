"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, roundUpToNearest5 } from "@/lib/stock-pricing";
import { Loader2, CheckCircle2, User, Mail, Phone, ShoppingCart, CreditCard, Send, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export function CartDetailsDialog({
    open,
    onOpenChange,
    cart,
    onConfirmPayment,
    loading = false
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: any;
    onConfirmPayment: () => void;
    loading?: boolean;
}) {
    const [emailMessage, setEmailMessage] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);

    if (!cart) return null;

    const subtotal = cart.products?.reduce((acc: number, item: any) => acc + ((item.customPrice || item.product?.price || 0) * item.quantity), 0) || 0;
    const subtotalRounded = roundUpToNearest5(subtotal);
    const deliveryFeeRounded = roundUpToNearest5(cart.deliveryFee || 0);
    const discountAmountRounded = roundUpToNearest5(cart.discountAmount || 0);

    const handleSendEmail = async () => {
        if (!emailMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setSendingEmail(true);
        try {
            const res = await fetch("/api/admin/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartId: cart.id,
                    message: emailMessage
                })
            });

            if (res.ok) {
                toast.success("Notification sent to customer");
                setEmailMessage("");
            } else {
                throw new Error("Failed to send");
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not send email notification");
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-black">Order Details</DialogTitle>
                        <Badge variant={cart.status === 'paid' ? "default" : "secondary"} className="uppercase font-black px-3">
                            {cart.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* CUSTOMER INFO */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" /> Customer Information
                        </h4>
                        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold min-w-[80px]">Name:</span>
                                <span>{cart.user?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="font-bold min-w-[80px]">Email:</span>
                                <span>{cart.user?.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="font-bold min-w-[80px]">Contact:</span>
                                <span>{cart.user?.contact || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT INFO */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-3 w-3" /> Payment Status
                        </h4>
                        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border">
                            {cart.payment ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold">Method:</span>
                                        <span className="capitalize">{cart.payment.method}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold">Reference:</span>
                                        <span className="text-xs font-mono">{cart.payment.tx_ref}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-primary font-black pt-1">
                                        <span>Amount Paid:</span>
                                        <span>₦{formatPrice(cart.payment.amount)}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-center py-2 text-muted-foreground italic">No payment record found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PRODUCTS LIST */}
                <div className="mt-8 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ShoppingCart className="h-3 w-3" /> Order Items
                    </h4>
                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 border-b grid grid-cols-12 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <div className="col-span-12">Product</div>
                        </div>
                        <div className="divide-y">
                            {cart.products?.map((item: any) => (
                                <div key={item.id} className="p-4 grid grid-cols-12 items-center hover:bg-muted/10 transition-colors">
                                    <div className="col-span-8">
                                        <p className="font-bold text-sm">{item.product?.name || item.customName}</p>
                                        <p className="text-xs text-muted-foreground font-black uppercase">
                                            {item.bulkName ? item.bulkName : `${item.quantity} Unit(s)`} @ ₦{formatPrice(item.customPrice || item.product?.price || 0)}
                                        </p>
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <p className="font-black text-primary">₦{formatPrice((item.customPrice || item.product?.price || 0) * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SUMMARY */}
                <div className="mt-6 flex flex-col items-end space-y-2 px-2">
                    <div className="flex justify-between w-full max-w-[200px] text-xs font-medium text-muted-foreground">
                        <span>Subtotal:</span>
                        <span>₦{formatPrice(subtotalRounded)}</span>
                    </div>
                    {discountAmountRounded > 0 && (
                        <div className="flex justify-between w-full max-w-[200px] text-xs font-medium text-green-600">
                            <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> Discount:</span>
                            <span>-₦{formatPrice(discountAmountRounded)}</span>
                        </div>
                    )}
                    <div className="flex justify-between w-full max-w-[200px] text-xs font-medium text-muted-foreground">
                        <span>Delivery:</span>
                        <span>₦{formatPrice(deliveryFeeRounded)}</span>
                    </div>
                    <div className="flex justify-between w-full max-w-[200px] text-lg font-black text-primary py-2 border-t border-dashed mt-2">
                        <span>Total:</span>
                        <span>₦{formatPrice(cart.total)}</span>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* ADMIN EMAIL TOOLS */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" /> Send Status Update Email
                    </h4>
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                        <Textarea 
                            placeholder="Type a message to the customer (e.g., 'We have received your payment and are processing it', 'Your order is out for delivery')..."
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            className="bg-background min-h-[100px] resize-none border-dashed"
                        />
                        <Button 
                            variant="secondary" 
                            className="w-full font-bold gap-2"
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                        >
                            {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send Manual Notification
                        </Button>
                    </div>
                </div>

                {/* ACTION FOOTER */}
                {(cart.status === "unconfirmed" || (cart.status === "pending" && !!cart.payment)) && (
                    <DialogFooter className="mt-8 border-t pt-6">
                        <Button 
                            className="w-full h-12 rounded-xl font-black bg-gradient-to-r from-emerald-600 to-green-600 hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-500/20 gap-2"
                            onClick={onConfirmPayment}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Confirm Payment & Process Order
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
