import stocks from "@/data/stocks"
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from "react-redux";
import { cartActions } from "@/store/cart-slice";
import {RootState} from "@/store";

const Stocks = () => {
  const cartItems = useSelector((state : RootState)=>state.cart.itemsList)
  const dispatch = useDispatch();
  const cart = (name : string, id : number, price : number) => {
    dispatch(
      cartActions.addToCart({
        name,
        id,
        price,
      })
    )
    console.log(cartItems)
  }

  return (
    <div className='h-full max-w-[500px] md:max-w-[1000px] flex gap-5 flex-wrap mx-5 p-2 self-center justify-between overflow-clip'>
      {
        stocks.stocks.map((stock, index)=>{
          return(
            <div key={index} className="w-[100vw] md:w-[200px] h-[150px] md:h-[300px] mb-5 flex flex-row md:flex-col overflow-clip">
              <div className="h-full md:h-[60%] w-[30%] md:w-full mx-2 md:mx-0 flex justify-center items-center">
                <img src={stock.img.src} alt="" className="h-full rounded-sm"/>
              </div>
              
              <div className="flex flex-1 flex-col text-start md:text-center mx-2 md:mx-0 justify-between md:items-center">
                <div className="w-full md:text-center flex flex-col md:justify-center md:items-center">
                  <div className="font-semibold">{stock.name}</div>
                  <div className="font-semibold text-foreground/80">₦ {stock.price}</div>
                  <div className="text-foreground/80 text-sm">{stock.qty} pcs</div>
                  <div>{stock.availability}</div>
                </div>
                <div className="flex flex-row gap-1 w-full px-5">
                  <Button className="rounded-lg flex-1 w-full font-semibold text-background hover:bg-accent/10 hover:border-2 hover:border-accent hover:text-accent">view</Button>
                  <Button onClick={() => cart(stock.name, stock.id, stock.price)} variant={"outline"} className="rounded-lg flex-1 w-full font-semibold text-accent-secondary border-accent-secondary hover:bg-accent-secondary/60 hover:text-background border-2">cart</Button>
                </div>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

export default Stocks
