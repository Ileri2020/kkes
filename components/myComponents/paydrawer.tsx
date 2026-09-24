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
import { useCart } from "@/hooks/use-cart"

export function PayDrawer(props : {cart: any, disabled?: boolean}) {
  const { subtotal } = useCart();
  const [goal, setGoal] = React.useState(subtotal)

  React.useEffect(() => {
    setGoal(subtotal);
  }, [subtotal]);

  function onClick(adjustment: number) {
    setGoal(Math.max(0, goal + adjustment))
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" disabled={props.disabled}>Order</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Checkout Summary</DrawerTitle>
            <DrawerDescription>Review your total before proceeding.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(-1000)}
                disabled={goal <= 0}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-5xl font-bold tracking-tighter">
                  ₦ {goal.toLocaleString()}
                </div>
                <div className="text-[0.70rem] uppercase text-muted-foreground mt-2">
                  Total Amount
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(1000)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
          </div>
          <DrawerFooter>
            <Button>Pay Now</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
