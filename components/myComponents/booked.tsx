import * as React from "react"

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
import { useCart } from "@/hooks/use-cart"


export function Booked() {
  const { items, subtotal } = useCart()

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Booked</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Booked Orders</DrawerTitle>
            <DrawerDescription>click an order to view what it contains</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-center text-muted-foreground italic">List of saved orders from server would appear here.</p>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
