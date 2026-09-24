import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Cartitem from './cartitem';
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { useRouter } from "next/router";
import { CiShoppingCart, } from "react-icons/ci"
import { useAppContext } from "@/hooks/useAppContext";
import { getProductPrice } from "@/lib/stock-pricing";
import { useCart } from "@/hooks/use-cart";

type stockCategory = {
  _id: string;
  name: string;
  description: string;
  img: string;
  price: number;
  cost: number;
  qty: number;
  __v: number;
};

export default function Similar(props: {similar : stockCategory[]}) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  const { user } = useAppContext()
  const { addItem } = useCart()
  // const navigate = useRouter()

  const cart = (name : string, id : string, price : number, image : any) => {
    addItem({
      name,
      id,
      price,
      img: image,
    }, 1);
  }
  
  const similar = props.similar.slice().sort(()=>Math.random()-0.5)

  React.useEffect(()=>{}, [similar])

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-[600px] lg:max-w-[850px] xl:max-w-[1000px] /max-h-[70vh] mx-auto mt-10"
      //onMouseEnter={plugin.current.stop}
      //onMouseLeave={plugin.current.reset}
      opts={{loop : true}}
      orientation="horizontal"
    >
      <CarouselContent className="">
      {similar.map((stock, index)=>{
          const stockId = stock._id || (stock as any).id;
          return(
            <CarouselItem key={index} className="basis-1/3 md:basis-1/5 lg:basis-1/7 flex flex-col overflow-clip justify-center items-center w-full ml-2 /bg-green-500">
              <Link href={`/products/${stockId}`}>
                <div className="h-[100px] w-full mx-2 md:mx-0 flex justify-center items-center">
                    <img src={stock.img || (stock as any).images?.[0] || "/placeholder.png"} alt="" className="h-full rounded-sm"/>
                </div>
              </Link>
              
              <div className="flex flex-1 flex-col text-center justify-center items-center w-full /bg-red-500">
                  {(() => {
                    const dynamicPrice = getProductPrice(stock as any, user?.role);
                    return (
                      <>
                        <Link href={`/products/${stockId}`}>
                          <div className="w-full text-center flex flex-col justify-center items-center">
                            <div className="font-semibold text-sm">{stock.name}</div>
                            <div className="font-semibold text-foreground/80 text-sm">₦ {dynamicPrice.toLocaleString()}</div>
                          </div>
                        </Link>
                        <div className="flex flex-row w-full max-w-[1000px] gap-1">
                          <Button onClick={() => cart(stock.name, stockId, stock.price, stock.img || (stock as any).images?.[0])} variant={"outline"} className="rounded-lg flex-1 w-full h-6 font-semibold text-accent-secondary border-accent-secondary hover:bg-accent-secondary/60 hover:text-background border-2"><CiShoppingCart /></Button>
                        </div>
                      </>
                    );
                  })()}
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
