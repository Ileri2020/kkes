
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ShippingAddressForm() {
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]); // Added to store users for the select input

  const fetchShippingAddresses = async () => {
    const res = await axios.get('/api/dbhandler?model=shippingAddress');
    setShippingAddresses(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  };

  useEffect(() => {
    fetchShippingAddresses();
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=shippingAddress&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=shippingAddress', formData);
    }
    resetForm();
    fetchShippingAddresses();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=shippingAddress&id=${id}`);
    fetchShippingAddresses();
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Shipping Addresses</h2>
        <label className="sr-only" htmlFor="shipping-address-user">User</label>
        <select id="shipping-address-user" title="Select user" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })}>
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <Input type="text" placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <Input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        <Input type="text" placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
        <Input type="text" placeholder="Zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
        <Input type="text" placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
        <Input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}
        <ul className='w-full'>
          {shippingAddresses.length > 0 ? (
            shippingAddresses.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Address : </span>
                  <span>{item.address}</span>
                </div>
                <p>City : {item.city || <em>No city</em>}</p>
                <p>State : {item.state || <em>No state</em>}</p>
                <p>Zip : {item.zip || <em>No zip</em>}</p>
                <p>Country : {item.country || <em>No country</em>}</p>
                <p>Phone : {item.phone || <em>No phone</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No shipping addresses available.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

