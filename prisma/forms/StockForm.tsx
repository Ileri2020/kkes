"use client";

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StockTable from './stockdatatable';
import { Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function StockForm() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState<any>([]);
  const [stockQueue, setStockQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStocks();
    fetchProducts();
  }, []);

  const fetchStocks = async () => {
    try {
      const res = await axios.get('/api/stock');
      setStocks(res.data);
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const addToQueue = (product: any) => {
    if (stockQueue.find(item => item.productId === product.id)) {
      toast.warning("Product already in stocking queue");
      return;
    }

    setStockQueue([...stockQueue, {
      productId: product.id,
      name: product.name,
      addedQuantity: 1,
      costPerProduct: 0,
      pricePerProduct: product.price || 0
    }]);
    toast.success(`${product.name} added to queue`);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = [...stockQueue];
    newQueue.splice(index, 1);
    setStockQueue(newQueue);
  };

  const updateQueueItem = (index: number, field: string, value: any) => {
    const newQueue = [...stockQueue];
    newQueue[index][field] = value;
    setStockQueue(newQueue);
  };

  // ✅ Search and Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (stockQueue.length === 0) {
      toast.error("Stocking queue is empty");
      return;
    }

    // Validation
    for (const item of stockQueue) {
      if (item.addedQuantity <= 0) {
        toast.error(`Invalid quantity for ${item.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const promises = stockQueue.map(item => 
        axios.post('/api/stock', {
          productId: item.productId,
          addedQuantity: item.addedQuantity,
          costPerProduct: item.costPerProduct,
          pricePerProduct: item.pricePerProduct
        })
      );

      await Promise.all(promises);
      toast.success(`Successfully stocked ${stockQueue.length} products`);
      setStockQueue([]);
      fetchStocks();
    } catch (err) {
      console.error("Batch stocking failed:", err);
      toast.error("Failed to stock some products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6 p-4 max-w-6xl mx-auto'>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Product Selection (4 cols) */}
        <div className='lg:col-span-5 border rounded-2xl p-6 bg-card shadow-lg hover:shadow-xl transition-shadow'>
          <h2 className='font-bold text-2xl mb-6 text-primary flex items-center gap-2 border-b pb-4'>
            Quick Select
            <span className='text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full'>{filteredProducts.length} items</span>
          </h2>

          {/* Search Input */}
          <div className='relative mb-6'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Input 
              placeholder='Search products to stock...' 
              className='pl-10 h-11 bg-secondary/10 border-primary/10 transition-all focus:border-primary'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className='space-y-3 mb-6'>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl hover:bg-secondary/40 transition-all group border border-transparent hover:border-primary/20">
                  <div className='flex-1 min-w-0'>
                    <p className='font-bold text-sm truncate uppercase tracking-tight'>{item.name}</p>
                    <p className='text-[10px] text-muted-foreground font-semibold'>₦{item.price}</p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => addToQueue(item)}
                    className='h-8 px-4 rounded-full font-bold active:scale-95 transition-transform'
                  >
                    SELECT ＋
                  </Button>
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground text-center bg-muted/5 border-2 border-dashed rounded-2xl'>
                <p className='text-sm italic'>No matches for "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t pt-6'>
              <Button 
                variant='outline' 
                size='sm' 
                className='h-9 gap-2'
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' /> Prev
              </Button>
              <span className='text-xs font-bold text-muted-foreground'>
                {currentPage} of {totalPages}
              </span>
              <Button 
                variant='outline' 
                size='sm' 
                className='h-9 gap-2'
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Stocking Queue (7 cols) */}
        <div className='lg:col-span-7 border rounded-2xl p-6 bg-card shadow-lg flex flex-col'>
          <h2 className='font-bold text-2xl mb-6 text-primary flex justify-between items-center border-b pb-4'>
            Stocking Queue
            <span className='text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full'>{stockQueue.length} Selected</span>
          </h2>

          <form onSubmit={handleBatchSubmit} className='flex-1 flex flex-col'>
            <div className='flex-1 overflow-y-auto max-h-[600px] space-y-4 pr-1 mb-8'>
              {stockQueue.length > 0 ? (
                stockQueue.map((item, index) => (
                  <div key={item.productId} className='p-6 border-2 border-secondary/40 rounded-2xl bg-secondary/5 relative group transition-all hover:bg-secondary/10 hover:border-primary/20'>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className='absolute -top-3 -right-3 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive shadow-lg transition-all active:scale-90'
                      onClick={() => removeFromQueue(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                    
                    <h3 className='font-bold text-primary text-sm mb-4 leading-tight'>{index + 1}. {item.name}</h3>
                    
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor={`qty-${index}`} className='text-[10px] uppercase font-bold text-muted-foreground tracking-widest'>Quantity</Label>
                        <Input 
                          id={`qty-${index}`}
                          type="number" 
                          min="1"
                          value={item.addedQuantity}
                          className='h-10 text-center font-bold'
                          onChange={(e) => updateQueueItem(index, 'addedQuantity', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className='space-y-2'>
                        <Label htmlFor={`cost-${index}`} className='text-[10px] uppercase font-bold text-muted-foreground tracking-widest'>Cost (₦)</Label>
                        <Input 
                          id={`cost-${index}`}
                          type="number" 
                          value={item.costPerProduct}
                          className='h-10 text-center'
                          onChange={(e) => updateQueueItem(index, 'costPerProduct', Number(e.target.value))}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor={`price-${index}`} className='text-[10px] uppercase font-bold text-muted-foreground tracking-widest'>Selling (₦)</Label>
                        <Input 
                          id={`price-${index}`}
                          type="number" 
                          value={item.pricePerProduct}
                          className='h-10 text-center text-primary font-bold bg-primary/5 border-primary/20'
                          onChange={(e) => updateQueueItem(index, 'pricePerProduct', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center py-24 text-muted-foreground text-center border-2 border-dashed rounded-3xl bg-muted/5'>
                  <div className='w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6'>
                    <Plus className='h-8 w-8 opacity-40' />
                  </div>
                  <h3 className='font-bold text-lg text-foreground'>Queue is Empty</h3>
                  <p className='text-sm max-w-xs'>Select products from the quick-pick on the left to start stocking your inventory.</p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className='w-full h-14 text-lg font-bold shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl' 
              disabled={loading || stockQueue.length === 0}
            >
              {loading ? "SAVING..." : `COMMIT BATCH STOCK (${stockQueue.length})`}
            </Button>
          </form>
        </div>
      </div>

      <div className='mt-16 bg-card border rounded-3xl p-8 shadow-sm'>
        <h2 className='font-bold text-3xl mb-8 tracking-tight'>Inventory History</h2>
        {stocks.length > 0 ? (
          <StockTable />
        ) : (
          <div className='text-muted-foreground bg-secondary/10 py-16 text-center rounded-2xl border-2 border-dashed'>
             <p className='font-medium'>No stock records found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}