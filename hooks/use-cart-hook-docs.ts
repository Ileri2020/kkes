// This code defines a **React context-based shopping cart system** that manages cart state, persists it to `localStorage`, and provides utility functions for interacting with the cart. It's designed to be used in a **Next.js app with React Server Components**, particularly using the `"use client"` directive.

// Let’s break it down step by step.

// ---

// ## 🧩 1. **"use client" Directive**
// ```ts
// "use client";
// ```
// - This tells **Next.js** that this component runs on the **client side**, not the server.
// - Required because this component uses browser APIs like `localStorage` and React hooks like `useState`, `useEffect`.

// ---

// ## 📦 2. **Imports & Types**
// ```ts
// import * as React from "react";
// import type { CartItem } from "~/ui/components/cart";
// ```
// - Imports React and a custom type `CartItem` which likely represents a product in the cart (e.g., with `id`, `price`, etc.).

// ---

// ## 🔤 3. **Type Definition: `CartContextType`**
// ```ts
// export interface CartContextType {
//   addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
//   clearCart: () => void;
//   itemCount: number;
//   items: CartItem[];
//   removeItem: (id: string) => void;
//   subtotal: number;
//   updateQuantity: (id: string, quantity: number) => void;
// }
// ```
// - Defines the **shape of the cart context** — what data and methods will be available throughout your app.
// - Includes:
//   - Adding/removing items
//   - Updating quantities
//   - Derived values like total item count and subtotal

// ---

// ## 🧠 4. **Create the Context**
// ```ts
// const CartContext = React.createContext<CartContextType | undefined>(undefined);
// ```
// - Creates a React context object to share cart functionality across components.
// - Starts with an initial value of `undefined` to enforce usage inside the provider.

// ---

// ## 💾 5. **Local Storage Helpers**
// ```ts
// const STORAGE_KEY = "cart";
// const DEBOUNCE_MS = 500;

// const loadCartFromStorage = (): CartItem[] => {
//   if (typeof window === "undefined") return [];
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) return [];
//     const parsed = JSON.parse(raw) as unknown;
//     if (Array.isArray(parsed)) {
//       return parsed as CartItem[];
//     }
//   } catch (err) {
//     console.error("Failed to load cart:", err);
//   }
//   return [];
// };
// ```
// - Loads saved cart data from `localStorage`.
// - Only runs in the browser (`window` check).
// - Handles errors gracefully and returns empty array if something goes wrong.

// ---

// ## 🏗️ 6. **CartProvider Component**
// ```ts
// export function CartProvider({ children }: React.PropsWithChildren) {
// ```
// - A **React Provider component** that wraps parts of your app to give them access to the cart.

// ### State Management
// ```ts
// const [items, setItems] = React.useState<CartItem[]>(loadCartFromStorage);
// ```
// - Holds the current list of cart items, initialized from local storage.

// ### Debounced Save to Local Storage
// ```ts
// const saveTimeout = React.useRef<null | ReturnType<typeof setTimeout>>(null);

// React.useEffect(() => {
//   if (saveTimeout.current) clearTimeout(saveTimeout.current);
//   saveTimeout.current = setTimeout(() => {
//     try {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
//     } catch (err) {
//       console.error("Failed to save cart:", err);
//     }
//   }, DEBOUNCE_MS);

//   return () => {
//     if (saveTimeout.current) clearTimeout(saveTimeout.current);
//   };
// }, [items]);
// ```
// - Saves cart state to `localStorage` after a short delay (`DEBOUNCE_MS`) to avoid saving too frequently.
// - Uses a ref to track timeout so we can cancel it if changes happen quickly.

// ---

// ## 🛠️ 7. **Cart Actions**

// ### `addItem`
// ```ts
// const addItem = React.useCallback(
//   (newItem: Omit<CartItem, "quantity">, qty = 1) => {
//     if (qty <= 0) return;
//     setItems((prev) => {
//       const existing = prev.find((i) => i.id === newItem.id);
//       if (existing) {
//         return prev.map((i) =>
//           i.id === newItem.id ? { ...i, quantity: i.quantity + qty } : i,
//         );
//       }
//       return [...prev, { ...newItem, quantity: qty }];
//     });
//   },
//   [],
// );
// ```
// - Adds an item to the cart.
// - If item already exists, increases its quantity.
// - Uses `Omit<CartItem, "quantity">` because quantity is passed separately.

// ---

// ### `removeItem`
// ```ts
// const removeItem = React.useCallback((id: string) => {
//   setItems((prev) => prev.filter((i) => i.id !== id));
// }, []);
// ```
// - Removes an item from the cart by ID.

// ---

// ### `updateQuantity`
// ```ts
// const updateQuantity = React.useCallback((id: string, qty: number) => {
//   setItems((prev) =>
//     prev.flatMap((i) => {
//       if (i.id !== id) return i;
//       if (qty <= 0) return []; // treat zero/negative as remove
//       if (qty === i.quantity) return i;
//       return { ...i, quantity: qty };
//     }),
//   );
// }, []);
// ```
// - Updates the quantity of a specific item.
// - If quantity ≤ 0, removes the item.
// - Uses `flatMap` cleverly to optionally remove the item.

// ---

// ### `clearCart`
// ```ts
// const clearCart = React.useCallback(() => setItems([]), []);
// ```
// - Clears all items from the cart.

// ---

// ## 📊 8. **Derived Values**

// ### `itemCount`
// ```ts
// const itemCount = React.useMemo(
//   () => items.reduce((t, i) => t + i.quantity, 0),
//   [items],
// );
// ```
// - Total number of items in the cart (sum of all quantities).

// ---

// ### `subtotal`
// ```ts
// const subtotal = React.useMemo(
//   () => items.reduce((t, i) => t + i.price * i.quantity, 0),
//   [items],
// );
// ```
// - Total cost of all items in the cart.

// ---

// ## 📤 9. **Provide the Context Value**
// ```ts
// const value = React.useMemo<CartContextType>(
//   () => ({
//     addItem,
//     clearCart,
//     itemCount,
//     items,
//     removeItem,
//     subtotal,
//     updateQuantity,
//   }),
//   [
//     items,
//     addItem,
//     removeItem,
//     updateQuantity,
//     clearCart,
//     itemCount,
//     subtotal,
//   ],
// );

// return <CartContext value={value}>{children}</CartContext>;
// ```
// - Packages up all the actions and derived values into a single object.
// - Provides that object to any child component via `useCart()`.

// ---

// ## 🎣 10. **Custom Hook: `useCart`**
// ```ts
// export function useCart(): CartContextType {
//   const ctx = React.use(CartContext);
//   if (!ctx) throw new Error("useCart must be used within a CartProvider");
//   return ctx;
// }
// ```
// - A convenience hook to easily access the cart context.
// - Throws an error if used outside of a `CartProvider`.

// ---

// ## ✅ Summary

// This code creates a **fully functional, persistent shopping cart system**:

// | Feature                        | Description |
// |-------------------------------|-------------|
// | **State management**          | Manages cart items using `useState`. |
// | **Persistence**               | Stores cart in `localStorage` with debounced updates. |
// | **Add/Remove/Update Items**   | Supports adding, removing, and updating item quantities. |
// | **Derived Data**              | Calculates total item count and subtotal automatically. |
// | **React Context API**         | Makes cart accessible anywhere in the app using `useCart()`. |

// ---

// ## 🧪 How to Use

// ### 1. Wrap your app (or part of it) with the provider:
// ```tsx
// <CartProvider>
//   <YourApp />
// </CartProvider>
// ```

// ### 2. Use the hook in any component:
// ```tsx
// function CartSummary() {
//   const { itemCount, subtotal } = useCart();
//   return (
//     <div>
//       {itemCount} items, ${subtotal.toFixed(2)}
//     </div>
//   );
// }
// ```

// ---

// Let me know if you'd like help testing or extending this cart logic!