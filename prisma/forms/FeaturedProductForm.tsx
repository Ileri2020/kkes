import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
}

interface FeaturedProduct {
  id: string;
  productId: string;
  product: Product;
}

const MAX_FEATURED_PRODUCTS = 16;
const ITEMS_PER_PAGE = 10;

interface FeaturedProductFormProps {
  hideList?: boolean;
}

export default function FeaturedProductForm({ hideList = false }: FeaturedProductFormProps) {
  const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentListPage, setCurrentListPage] = useState(1);

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
  });

  const [editId, setEditId] = useState<string | null>(null);

  const fetchFeaturedProduct = useCallback(async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=featuredProduct");
      setFeaturedProduct(res.data);
    } catch (err) {
      console.error("Failed to fetch featured products", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=product");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchFeaturedProduct(), fetchProducts()]);
  }, [fetchFeaturedProduct, fetchProducts]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const featuredIds = useMemo(
    () => new Set(featuredProduct.map((f) => f.productId)),
    [featuredProduct]
  );

  // ✅ Filtering and Pagination for Selection List
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const totalPagesSelection = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedSelection = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // ✅ Pagination for Current Featured List (Bottom List)
  const totalPagesList = Math.ceil(featuredProduct.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentListPage - 1) * ITEMS_PER_PAGE;
    return featuredProduct.slice(start, start + ITEMS_PER_PAGE);
  }, [featuredProduct, currentListPage]);

  const isLimitReached =
    featuredProduct.length >= MAX_FEATURED_PRODUCTS && !editId;

  const handleFeatureClick = async (item: Product) => {
    if (featuredIds.has(item.id)) return;

    if (featuredProduct.length >= MAX_FEATURED_PRODUCTS) {
      toast.warning(`You can only feature up to ${MAX_FEATURED_PRODUCTS} products.`);
      return;
    }

    try {
      await axios.post("/api/dbhandler?model=featuredProduct", {
        productId: item.id,
      });

      toast.success(`${item.name} featured successfully`);
      await refreshAll();
    } catch (err) {
      console.error("Failed to feature product:", err);
      toast.error("Failed to feature product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editId || !formData.productId) return;

    try {
      await axios.put(
        `/api/dbhandler?model=featuredProduct&id=${editId}`,
        { productId: formData.productId }
      );

      toast.success("Featured product updated");
      resetForm();
      fetchFeaturedProduct();
    } catch (err) {
      console.error("Failed to update featured product:", err);
      toast.error("Failed to update featured product");
    }
  };

  const handleEdit = (item: FeaturedProduct) => {
    setFormData({
      productId: item.productId,
      productName: item.product?.name || "",
    });
    setEditId(item.id);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this product from featured list?")) return;
    try {
      await axios.delete(`/api/dbhandler?model=featuredProduct&id=${id}`);
      toast.success("Feature removed");
      fetchFeaturedProduct();
    } catch (err) {
      console.error("Failed to delete featured product", err);
      toast.error("Failed to remove feature");
    }
  };

  const resetForm = () => {
    setFormData({ productId: "", productName: "" });
    setEditId(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-4 bg-card rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-primary">Featured Products Manager</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-md gap-4 p-4 border-2 border-primary/20 rounded-xl bg-secondary/5"
      >
        <div className="w-full space-y-2">
          <Label htmlFor="fp-search" className="font-bold flex justify-between">
            Search to Add
            <span className="text-xs font-normal text-muted-foreground">{featuredProduct.length}/{MAX_FEATURED_PRODUCTS} occupied</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fp-search"
              placeholder="Filter available products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="w-full">
          <ul className="space-y-2 max-h-80 overflow-y-auto mb-4 border rounded-lg p-2 bg-background">
            {paginatedSelection.map((item) => {
              const isFeatured = featuredIds.has(item.id);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 bg-secondary/20 rounded-lg p-3 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block truncate italic">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">₦{item.price ?? 0}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-[10px] font-bold px-3 transition-all active:scale-95"
                    onClick={() => handleFeatureClick(item)}
                    disabled={isFeatured || isLimitReached}
                    variant={isFeatured ? "outline" : "default"}
                  >
                    {isFeatured ? "Active" : isLimitReached ? "Full" : "Feature+"}
                  </Button>
                </li>
              );
            })}
            {filteredProducts.length === 0 && (
              <li>
                <p className="text-xs text-muted-foreground text-center py-10 italic">No products matched your search.</p>
              </li>
            )}
          </ul>

          {/* Pagination for selection */}
          {totalPagesSelection > 1 && (
            <div className="flex items-center justify-center gap-4 py-2 border-t mt-2">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold">{currentPage} / {totalPagesSelection}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPagesSelection, p+1))} disabled={currentPage === totalPagesSelection}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {editId && (
          <div className="space-y-3 pt-4 border-t-2 border-dashed border-primary/20">
            <Label className="text-xs font-bold uppercase tracking-wider text-primary">Editing Slot</Label>
            <Input value={formData.productName} disabled className="bg-muted text-xs h-8" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1 h-8 text-xs">Confirm Change</Button>
              <Button type="button" size="sm" onClick={resetForm} variant="outline" className="flex-1 h-8 text-xs border-primary text-primary">Cancel</Button>
            </div>
          </div>
        )}
      </form>

      {!hideList && (
        <div className="mt-10 pt-6 border-t">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            Currently Featured
            <span className="text-xs bg-primary/10 text-primary px-2 rounded-full font-bold">{featuredProduct.length}</span>
          </h3>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedList.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 bg-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm leading-tight line-clamp-2 pr-4">
                    {(currentListPage-1)*ITEMS_PER_PAGE + index + 1}. {item.product?.name ?? "NULL"}
                  </span>
                  <span className="text-xs font-bold text-primary shrink-0">₦{item.product?.price ?? 0}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(item)} className="flex-1 h-8 text-[10px] font-bold border-primary/30 text-primary hover:bg-primary/5">
                    Move
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    variant="outline"
                    className="flex-1 h-8 text-[10px] font-bold border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
            {featuredProduct.length === 0 && (
              <li className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                 <p className="text-muted-foreground italic">No products are currently featured on the home page.</p>
              </li>
            )}
          </ul>

          {/* List Pagination */}
          {totalPagesList > 1 && (
            <div className="flex items-center justify-center gap-6 mt-8">
               <Button variant="outline" size="sm" className="gap-2" onClick={() => setCurrentListPage(p => Math.max(1, p-1))} disabled={currentListPage === 1}>
                 <ChevronLeft className="h-4 w-4" /> Prev
               </Button>
               <span className="font-bold text-sm">Page {currentListPage} of {totalPagesList}</span>
               <Button variant="outline" size="sm" className="gap-2" onClick={() => setCurrentListPage(p => Math.min(totalPagesList, p+1))} disabled={currentListPage === totalPagesList}>
                 Next <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
