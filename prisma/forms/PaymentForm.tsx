import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export default function PaymentForm() {
  const [payments, setPayments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cartId: '',
    method: '',
    amount: 0,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [carts, setCarts] = useState<any[]>([]); // carts to be mapped to the select input

  const fetchPayments = useCallback(async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=payment');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    }
  }, []);

  const fetchCarts = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=cart');
    setCarts(res.data);
    if (res.data.length > 0) {
      setFormData(prev => ({ ...prev, cartId: res.data[0].id }));
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchCarts();
  }, [fetchPayments, fetchCarts]);

  const resetForm = () => {
    setFormData({
      cartId: '',
      method: '',
      amount: 0,
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`/api/dbhandler?model=payment&id=${editId}`, formData);
      } else {
        await axios.post('/api/dbhandler?model=payment', formData);
      }
    } catch (error) {
      alert('Failed to save payment.');
    }
    resetForm();
    fetchPayments();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await axios.delete(`/api/dbhandler?model=payment&id=${id}`);
      fetchPayments();
    } catch (err) {
      alert('Failed to delete payment.');
    }
  };

  const handleEdit = (payment) => {
    setEditId(payment.id);
    setFormData({
      cartId: payment.cartId,
      method: payment.method,
      amount: payment.amount,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Payment Form</h2>
        <label className="sr-only" htmlFor="payment-cart">Cart ID</label>
        <select id="payment-cart" title="Select cart" value={formData.cartId} onChange={(e) => setFormData({ ...formData, cartId: e.target.value })}>
          {carts.length > 0 ? carts.map((cart, index) => (
            <option key={index} value={cart.id}>
              {cart.id}
            </option>
          )) : <option value="">No carts</option>}
        </select>
        <div>Payment Method</div>
        <Input placeholder="Payment method" value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} />
        <div>Amount</div>
        <Input placeholder="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: +e.target.value  })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
        <ul className='w-full'>
          {payments.length > 0 ? (
            payments.map((item, index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Cart ID: </span>
                  <span>{item.cartId}</span>
                </div>
                <p>Method: {item.method || <em>No method</em>}</p>
                <p>Amount: {item.amount || <em>No amount</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No available payments.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

