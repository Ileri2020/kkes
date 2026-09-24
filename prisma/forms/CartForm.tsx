import { useCallback, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function CartForm() {
  const [carts, setCarts] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    productId: '',
    quantity: 0,
    total: 0,
    pharmacistSummary: '',
  });
  const [editId, setEditId] = useState(null);

  // Pagination and Search State
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);

  const fetchCarts = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=cart');
    setCarts(res.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  }, []);

  const fetchProducts = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=product');
    setProducts(res.data);
  }, []);

  useEffect(() => {
    fetchCarts();
    fetchUsers();
    fetchProducts();
  }, [fetchCarts, fetchUsers, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFormData = {
      ...formData,
      quantity: +formData.quantity,
      total: +formData.total,
    };
    if (editId) {
      await axios.put(`/api/dbhandler?model=cart&id=${editId}`, newFormData);
    } else {
      await axios.post('/api/dbhandler?model=cart', newFormData);
    }
    resetForm();
    fetchCarts();
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id: any) => {
    if(!confirm("Remove this cart item?")) return;
    await axios.delete(`/api/dbhandler?model=cart&id=${id}`);
    fetchCarts();
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      productId: '',
      quantity: 0,
      total: 0,
      pharmacistSummary: '',
    });
    setEditId(null);
  };

  // ✅ Product Filtering & Pagination
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, productPage]);

  // ✅ Cart Filtering & Pagination
  const totalCartPages = Math.ceil(carts.length / ITEMS_PER_PAGE);
  const paginatedCarts = useMemo(() => {
    const start = (cartPage - 1) * ITEMS_PER_PAGE;
    return carts.slice(start, start + ITEMS_PER_PAGE);
  }, [carts, cartPage]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearch]);

  return (
    <div className='p-4'>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-lg gap-4 p-6 border-2 border-primary/20 rounded-2xl m-2 bg-card shadow-lg'>
        <h2 className='font-bold text-xl text-primary border-b pb-2'>Cart Administration</h2>
        
        <div className="space-y-2">
          <Label htmlFor="cart-user" className="text-xs font-bold uppercase text-muted-foreground">Select User</Label>
          <select 
            id="cart-user"
            title="Select user"
            value={formData.userId} 
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          >
            <option value="">-- Choose User --</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Select Product</Label>
          
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter products..." 
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto border rounded-md p-1 bg-muted/20">
            {paginatedProducts.map((p: any) => (
              <div 
                key={p.id} 
                onClick={() => setFormData({...formData, productId: p.id})}
                className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${formData.productId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                <span className="text-xs font-medium truncate">{p.name}</span>
                <span className="text-[10px] opacity-70">₦{p.price}</span>
              </div>
            ))}
            {paginatedProducts.length === 0 && <p className="text-[10px] text-center py-4 italic">No products matched.</p>}
          </div>

          {totalProductPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setProductPage(p => Math.max(1, p-1))} disabled={productPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold">{productPage} / {totalProductPages}</span>
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setProductPage(p => Math.min(totalProductPages, p+1))} disabled={productPage === totalProductPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Quantity</Label>
            <Input placeholder="Qty" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })}  type="number" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Unit Total (₦)</Label>
            <Input placeholder="Price" value={formData.total} onChange={(e) => setFormData({ ...formData, total: +e.target.value })}  type="number" />
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Pharmacist Summary (Dosage, Precautions)</Label>
          <textarea 
            placeholder="Enter medical notes..." 
            value={formData.pharmacistSummary} 
            onChange={(e) => setFormData({ ...formData, pharmacistSummary: e.target.value })}
            className="w-full min-h-[100px] text-sm p-3 rounded-xl border bg-muted/10 outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 font-bold">{editId ? 'Update Cart' : 'Add to Cart'}</Button>
          {editId && <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>}
        </div>

        <div className='w-full mt-8 pt-6 border-t'>
          <h3 className="font-bold mb-4 flex justify-between items-center">
            Active Carts 
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">{carts.length} records</span>
          </h3>
          <ul className='grid gap-2'>
            {paginatedCarts.map((item: any) => (
              <li key={item.id} className="flex flex-col gap-1 p-3 bg-secondary/10 border rounded-xl hover:bg-secondary/20 transition-all">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{users.find((u: any) => u.id === item.userId)?.name || "Unknown User"}</p>
                    <p className="text-[10px] text-primary font-bold">{products.find((p: any) => p.id === item.productId)?.name || "Product Deleted"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold">₦{item.total}</p>
                    <p className="text-[10px] text-muted-foreground">x{item.quantity}</p>
                  </div>
                </div>
                {item.pharmacistSummary && (
                  <p className="text-[10px] bg-primary/5 p-2 rounded-lg italic border border-primary/10 mt-1 line-clamp-2">
                    Note: {item.pharmacistSummary}
                  </p>
                )}
                <div className='flex gap-2 mt-2'>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className='flex-1 h-7 text-[10px]'>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className='flex-1 h-7 text-[10px] border-destructive text-destructive hover:bg-destructive hover:text-white'>Remove</Button>
                </div>
              </li>
            ))}
            {carts.length === 0 && <p className="text-center py-10 text-xs italic text-muted-foreground">No cart items found.</p>}
          </ul>

          {totalCartPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={() => setCartPage(p => Math.max(1, p-1))} disabled={cartPage === 1}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs font-bold">{cartPage} / {totalCartPages}</span>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={() => setCartPage(p => Math.min(totalCartPages, p+1))} disabled={cartPage === totalCartPages}>
                 Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
