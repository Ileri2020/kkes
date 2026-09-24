import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";

interface Product {
  id: string;
  name: string;
  price?: number;
}

interface HeavilyDiscountedProduct {
  id: string;
  productId: string;
  creatorId: string;
  approved: boolean;
  product: Product;
}

const ITEMS_PER_PAGE = 8;

export default function HeavilyDiscountedForm() {
  const { user } = useAppContext();
  const [discountedItems, setDiscountedItems] = useState<HeavilyDiscountedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const fetchItems = useCallback(async () => {
    try {
      const url = `/api/heavily-discounted?admin=${isAdmin}&userId=${isAdmin ? "" : user?.id || ""}`;
      const res = await axios.get(url);
      setDiscountedItems(res.data);
    } catch (err) {
      console.error("Failed to fetch Heavily Discounted items", err);
    }
  }, [isAdmin, user]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=product&minimal=true");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [fetchItems, fetchProducts]);

  const activeIds = useMemo(
    () => new Set(discountedItems.map((f) => f.productId)),
    [discountedItems]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleAdd = async (item: Product) => {
    if (activeIds.has(item.id)) return;
    setLoading(true);
    try {
      await axios.post("/api/heavily-discounted", {
        productId: item.id,
        creatorId: user?.id,
      });
      toast.success(`${item.name} added for review`);
      fetchItems();
    } catch (err) {
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if(!confirm("Remove this product?")) return;
    try {
      await axios.delete(`/api/heavily-discounted?id=${id}`);
      toast.success("Removed successfully");
      fetchItems();
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="font-bold flex justify-between">Search to Add</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter available products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-10"
          />
        </div>
        
        <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 bg-background">
          {paginatedProducts.map((item) => {
            const isActive = activeIds.has(item.id);
            return (
              <li key={item.id} className="flex items-center justify-between gap-2 bg-secondary/20 rounded-lg p-2 hover:bg-secondary/40">
                <span className="font-bold text-xs truncate italic flex-1">{item.name}</span>
                <Button
                  size="sm"
                  variant={isActive ? "outline" : "default"}
                  className="h-7 text-[10px]"
                  onClick={() => handleAdd(item)}
                  disabled={isActive || loading}
                >
                  {isActive ? "Added" : "Add+"}
                </Button>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-2">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-bold">{currentPage} / {totalPages}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-bold text-sm mb-2">Your Submissions</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {discountedItems.filter(item => item.creatorId === user?.id || isAdmin).map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{item.product?.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Status: <span className={item.approved ? "text-green-600" : "text-amber-600"}>
                    {item.approved ? "Approved" : "Pending"}
                  </span>
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemove(item.id)}>
                <ChevronRight className="h-4 w-4 rotate-45" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
