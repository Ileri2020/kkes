import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Loader2 } from 'lucide-react';

export default function DeliveryFeeForm() {
    const [fees, setFees] = useState([]);
    const [formData, setFormData] = useState({
        state: '',
        price: '',
    });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchFees = useCallback(async () => {
        const res = await axios.get('/api/dbhandler?model=deliveryFee');
        setFees(res.data);
    }, []);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = {
            ...formData,
            price: parseFloat(formData.price),
        };
        try {
            if (editId) {
                await axios.put(`/api/dbhandler?model=deliveryFee&id=${editId}`, data);
            } else {
                await axios.post('/api/dbhandler?model=deliveryFee', data);
            }
            resetForm();
            fetchFees();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setFormData({
            state: item.state || '',
            price: item.price.toString(),
        });
        setEditId(item.id);
    };

    const handleDelete = async (id: string) => {
        await axios.delete(`/api/dbhandler?model=deliveryFee&id=${id}`);
        fetchFees();
    };

    const resetForm = () => {
        setFormData({ state: '', price: '' });
        setEditId(null);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-md gap-6 p-6 border-2 border-primary/20 bg-card rounded-xl shadow-lg mx-auto'>
                <div className="flex items-center justify-center gap-3">
                    <Truck className="w-6 h-6 text-primary" />
                    <h2 className='font-black text-2xl uppercase tracking-tight'>Logistics Fees</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State/Region</label>
                        <Input 
                            type="text" 
                            placeholder="e.g. Lagos, Abuja" 
                            className="h-12 font-bold" 
                            value={formData.state} 
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fee (NGN)</label>
                        <Input 
                            type="number" 
                            placeholder="100" 
                            className="h-12 font-bold" 
                            value={formData.price} 
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                            required 
                        />
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="h-12 text-lg font-black shadow-lg shadow-primary/10">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editId ? 'UPDATE FEE' : 'SAVE DELIVERY FEE')}
                </Button>
                {editId && <Button variant="ghost" className="text-xs font-bold" onClick={resetForm}>CANCEL EDIT</Button>}

                <div className="space-y-4 pt-6 mt-6 border-t font-bold">
                    <h3 className="text-xs font-black uppercase text-muted-foreground">Active Regions</h3>
                    {fees.length > 0 ? (
                        fees.map((item: any, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-primary/60" />
                                    <div>
                                        <p className="text-sm font-black uppercase">{item.state}</p>
                                        <p className="text-xs text-primary font-bold">₦{item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className='flex gap-2'>
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)} className='h-8 w-8'><Truck className="w-3 h-3" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className='h-8 w-8 text-destructive hover:bg-destructive hover:text-white'>×</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-muted-foreground italic">No regions configured.</p>
                    )}
                </div>
            </form>
        </div>
    );
}
