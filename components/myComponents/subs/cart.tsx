
import { cn } from "@/lib/utils";
import { CartClient } from "./cart-client";
import { useAppContext } from "@/hooks/useAppContext";

export interface CartItem {
  category?: string;
  id: string;
  images?: string[];
  img?: string;
  name: string;
  price: number;
  quantity: number;
  regulatoryClassification?: string;
  customName?: string;
  customPrice?: number;
  bulkPriceId?: string;
  bulkName?: string;
  isSpecial?: boolean;
}

interface CartProps {
  className?: string;
}

// const mockCart: CartItem[] = [
//   {
//     category: "Audio",
//     id: "1",
//     image:
//       "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
//     name: "Premium Wireless Headphones",
//     price: 199.99,
//     quantity: 1,
//   },
//   {
//     category: "Wearables",
//     id: "2",
//     image:
//       "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
//     name: "Smart Watch Series 5",
//     price: 299.99,
//     quantity: 2,
//   },
// ];

export function Cart({ className }: CartProps) { 
  const { user, setUser, cart, setCart } = useAppContext();
  return (
    <div className={cn("relative", className)}>
      {/* // TODO: Fetch cart from e.g. LocalStorage and/or database
      <CartClient className={cn("", className)} mockCart={mockCart} /> */}
      <CartClient className={cn("", className)} cart={cart} />
    </div>
  );
}
