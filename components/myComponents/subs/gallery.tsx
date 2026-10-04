import gallery from "@/data/gallery"
import { Button } from "@/components/ui/button"
import { CiShoppingCart, CiShoppingBasket, CiShoppingTag, } from "react-icons/ci"

const Gallery = () => {
  return (
    <section className="w-full max-w-[1000px] overflow-clip">
      <div className="flex flex-col w-full gap-5">
        {gallery.stocks.map((stock, index)=>{
          if((index % 2) > 0){
            return (
              <div className="flex flex-row /bg-accent-secondary/5 w-full" key={index}>
                <div className="flex flex-col flex-1 /justify-between items-center text-center p-5">
                  <div className="flex flex-1 flex-col justify-center items-center">
                    <div className="text-lg font-semibold">{stock.name}</div>
                    <div>{stock.Description}</div>
                  </div>
                  <Button className="relative max-w-[220px] text-4xl //text-accent border-2 font-semibold rounded-md px-20 hover:bg-accent/10 hover:border-2 hover:border-accent hover:text-accent"><CiShoppingCart className=""/></Button>
                </div>
                <div className="w-[350px] h-[350px] contain-content flex justify-center items-center">
                  <img src={stock.img} alt="" className="h-full rounded-sm" />
                </div>
              </div>
            )
          }
          else{
            return (
              <div className="flex flex-row /bg-accent-secondary/5 w-full justify-between" key={index}>
                <div className="w-[350px] h-[350px] contain-content flex justify-center items-center">
                  <img src={stock.img} alt="" className="h-full rounded-sm" />
                </div>
                <div className="flex flex-col flex-1 /justify-between items-center text-center p-5">
                  <div className="flex flex-1 flex-col justify-center items-center">
                    <div className="text-lg font-semibold">{stock.name}</div>
                    <div className="text-2xl text-accent font-dance">{stock.Description}</div>
                  </div>
                  <Button className="relative max-w-[220px] text-4xl //text-accent border-2 font-semibold rounded-md px-20  hover:bg-accent/10 hover:border-2 hover:border-accent hover:text-accent"><CiShoppingCart className=""/></Button>
                </div>
              </div>
            )
          }
        })}
      </div>
    </section>
  )
}

export default Gallery
