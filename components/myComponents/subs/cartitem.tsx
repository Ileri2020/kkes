"use client"
import { Button } from "@/components/ui/button"
import { Minus, Plus, X } from "lucide-react"
import { useAppContext } from "@/hooks/useAppContext"
import { PRICE_MARKUPS } from "@/lib/stock-pricing"
import { useCart } from "@/hooks/use-cart"

const Cartitem = (props:{name: string, price: number, qty: number, totalPrice: number, id: string, img: string, bulkPriceId?: string, bulkName?: string}) => {
    const { user } = useAppContext();
    const { updateQuantity, removeItem } = useCart();
    const role = user?.role || "customer";
    const markup = PRICE_MARKUPS[role as keyof typeof PRICE_MARKUPS] || 1.3;
    
    // props.price is the base cost
    const dynamicPrice = props.price * markup;

    const subFromCart = () => {
      updateQuantity(props.id, props.qty - 1, props.bulkPriceId);
    }

    const removeFromCart = () => {
      removeItem(props.id, props.bulkPriceId);
    }

    const addToCart = () => {
      updateQuantity(props.id, props.qty + 1, props.bulkPriceId);
    }

  return (
    <div className="h-36 flex flex-row w-full max-w-4xl /px-1 gap-2 bg-secondary rounded-sm mb-2">
      <div className="w-36 h-36 overflow-clip flex justify-center items-center"><img src={props.img} className="h-full" alt="" /></div>
      <div className="flex flex-col h-full w-full flex-1">
        <div className="flex flex-1 flex-row justify-between">
          <div className="h-full flex flex-col justify-between">
              <div className="text-2xl md:text-3xl font-semibold text-accent text-nowrap whitespace-nowrap /font-dance">
                {props.name}
                {props.bulkName && <span className="text-xs ml-2 text-primary font-black uppercase">({props.bulkName})</span>}
              </div>
              <div>
                <div className="">Price: <span className="text-xl font-semibold text-foreground/80">₦ {dynamicPrice.toLocaleString()}</span></div>
                <div>Qty : <span className="text-xl">{props.qty}</span></div>
              </div>
              <div className="w-[130px] flex md:hidden flex-row justify-between mt-2 pb-2">
                <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={addToCart}><Plus className="h-4 w-4" /></Button>
                <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={subFromCart}><Minus className="h-4 w-4" /></Button>
                <Button size="icon" variant={"outline"} className="text-accent bg-transparent text-3xl font-bold w-10 h-10 rounded-full" onClick={removeFromCart}><X className="h-4 w-4" /></Button></div>
          </div>
          <div className="h-full flex flex-col p-2 gap-1 justify-end relative">
            <div className="text-xl font-semibold text-center absolute top-2 right-3 whitespace-nowrap bg-secondary">₦ {(dynamicPrice * props.qty).toLocaleString()}</div>
            <div className="w-[130px] hidden md:flex flex-row justify-between mt-2">
              <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={addToCart}><Plus className="h-4 w-4" /></Button>
              <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={subFromCart}><Minus className="h-4 w-4" /></Button>
              <Button size="icon" variant={"outline"} className="text-accent bg-transparent text-3xl font-bold w-10 h-10 rounded-full" onClick={removeFromCart}><X className="h-4 w-4" /></Button></div>
          </div>
        </div>
        <div>

        </div>
      </div>
    </div>
  )
}

export default Cartitem
