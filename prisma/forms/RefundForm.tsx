
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RefundForm() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cartId: '',
    amount: '',
    reason: '',
    status: 'pending',
  });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=refund');
    setRefunds(res.data);
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=refund&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=refund', formData);
    }
    resetForm();
    fetchRefunds();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=refund&id=${id}`);
    fetchRefunds();
  };

  const resetForm = () => {
    setFormData({
      cartId: '',
      amount: '',
      reason: '',
      status: 'pending',
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Refunds</h2>
        <Input type="text" placeholder="Cart ID" value={formData.cartId} onChange={(e) => setFormData({ ...formData, cartId: e.target.value })} />
        <Input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
        <Input type="text" placeholder="Reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
        <label className="sr-only" htmlFor="refund-status">Refund status</label>
        <select id="refund-status" title="Select refund status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}
        <ul className='w-full'>
          {refunds.length > 0 ? (
            refunds.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Cart ID : </span>
                  <span>{item.cartId}</span>
                </div>
                <p>Amount : {item.amount || <em>No amount</em>}</p>
                <p>Reason : {item.reason || <em>No reason</em>}</p>
                <p>Status : {item.status || <em>No status</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No refunds available.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

