import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "../ui/input"
import { useState } from "react"
import { useCart } from "@/hooks/use-cart"

export function BookDrawer(props : {cart: any, prescriptionUrl?: string | null}) {
  const { subtotal, itemCount, clearCart } = useCart();
  const [cartName, setCartName] = useState("");

  const productsIdQty = props.cart.map((item: any) => ({ _id: item.id, quantity: item.quantity }));

  const cartSale = {
    products : productsIdQty,
    totalSale : subtotal,
    totalQty : itemCount,
    status : "pending",
    paymentStatus : "unpaid",
    name: cartName,
    prescriptionUrl: props.prescriptionUrl
  }

  const saveCart = async () => {
    try {
      const response = await fetch("/api/data/sale", {
        method: "POST",
        body: JSON.stringify(cartSale),
      });
      
      if (response.ok) {
        alert("Cart successfully saved");
        clearCart();
      } else {
        throw new Error("Failed to save cart");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save cart. Please try again.");
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Book</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Book your order</DrawerTitle>
            <DrawerDescription>Your order will be saved till when you are ready to make a purchase.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input a name for this cart</label>
                <Input 
                  type="text" 
                  value={cartName}
                  onChange={(e) => setCartName(e.target.value)}
                  placeholder="e.g. Monthly Stock"
                />
              </div>
            </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button onClick={saveCart} disabled={!cartName}>Save Booking</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
