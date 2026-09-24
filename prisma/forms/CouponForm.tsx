import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CouponForm() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'fixed',
    expiresAt: '',
    active: true,
  });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=coupon');
    setCoupons(res.data);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount: parseFloat(formData.discount),
    };
    if (editId) {
      await axios.put(`/api/dbhandler?model=coupon&id=${editId}`, data);
    } else {
      await axios.post('/api/dbhandler?model=coupon', data);
    }
    resetForm();
    fetchCoupons();
  };

  const handleEdit = (item) => {
    setFormData({
      code: item.code,
      discount: item.discount.toString(),
      type: item.type || 'fixed',
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '',
      active: item.active ?? true,
    });
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=coupon&id=${id}`);
    fetchCoupons();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      type: 'fixed',
      expiresAt: '',
      active: true,
    });
    setEditId(null);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-md gap-4 p-6 border-2 border-primary/20 bg-card rounded-xl shadow-lg mx-auto'>
        <h2 className='font-black text-2xl text-center uppercase tracking-tight'>Coupon Master</h2>
        
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promo Code</label>
            <Input type="text" placeholder="e.g. HEALTH20" className="h-12 font-bold" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="coupon-type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                <select 
                    id="coupon-type"
                    title="Coupon type"
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                    <option value="fixed">Fixed (NGN)</option>
                    <option value="percentage">Percentage (%)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</label>
                <Input type="number" step="any" placeholder="0" className="h-12 font-bold" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} required />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry Date</label>
            <Input type="datetime-local" className="h-12 font-bold" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
        </div>

        <div className="flex items-center gap-2 py-2">
            <input 
                type="checkbox" 
                id="active" 
                checked={formData.active} 
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 accent-primary"
            />
            <label htmlFor="active" className="text-xs font-bold uppercase cursor-pointer">Active / Verifiable</label>
        </div>

        <Button type="submit" className="h-12 text-lg font-black shadow-lg shadow-primary/10">
            {editId ? 'UPDATE COUPON' : 'CREATE COUPON'}
        </Button>
        {editId && <Button variant="ghost" className="text-xs font-bold text-muted-foreground" onClick={resetForm}>CANCEL EDIT</Button>}

        <div className="space-y-4 pt-6 mt-6 border-t font-bold">
          <h3 className="text-xs font-black uppercase text-muted-foreground">Active Coupons</h3>
          {coupons.length > 0 ? (
            coupons.map((item , index) => (
              <div key={index} className="flex flex-col gap-3 p-4 bg-muted/30 border rounded-xl hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="outline" className="text-lg font-black tracking-widest font-mono border-primary/20 text-primary">
                            {item.code}
                        </Badge>
                        <p className="text-[10px] mt-1 text-muted-foreground uppercase">
                           {item.type === 'percentage' ? `${item.discount}% Reduction` : `₦${item.discount.toLocaleString()} Fixed Cut`}
                        </p>
                    </div>
                    {(!item.active || (item.expiresAt && new Date(item.expiresAt) < new Date())) && (
                        <Badge variant="destructive" className="text-[8px] font-black px-1 py-0 h-4">EXPIRED/INACTIVE</Badge>
                    )}
                </div>
                
                <div className='flex gap-2'>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className='flex-1 h-8 text-[10px] font-black border-2'>EDIT</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className='flex-1 h-8 text-[10px] font-black text-destructive hover:bg-destructive hover:text-white'>DELETE</Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-center text-muted-foreground italic">No coupons found.</p>
          )}
        </div>
      </form>
    </div>
  );
}

