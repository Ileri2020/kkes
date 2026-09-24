// UserForm.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UserForm() {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    avatarUrl: '',
    role: 'customer',
    verificationStatus: 'unverified',
  });
  const [editId, setEditId] = useState(null);

  const fetchUsers = async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=user&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=user', formData);
    }
    resetForm();
    fetchUsers();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=users&id=${id}`);
    fetchUsers();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      avatarUrl: '',
      role: 'customer',
      verificationStatus: 'unverified'
    });
    setEditId(null);
  };

  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
      <h2 className='font-semibold text-lg'>Manage Users</h2>
      <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Avatar URL"
          value={formData.avatarUrl || ''}
          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
        />
        <select
          id="user-role"
          title="Select role"
          className="w-full p-2 border rounded-md"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="customer">Customer</option>
          <option value="professional">Professional</option>
          <option value="wholesaler">Wholesaler</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>

        <select
          id="user-verification"
          title="Select verification status"
          className="w-full p-2 border rounded-md"
          value={formData.verificationStatus || 'unverified'}
          onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
        >
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}

        <ul className='w-full'>
        {users.length > 0 ? (
          users.map((item , index) => (
            <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
              <div className="flex flex-row gap-2">
                <span>{(index + 1)}. Name : </span>
                <span>{item.name}</span>
              </div>
              <p>Email : {item.email || <em>No email</em>}</p>
              <div className='flex flex-row gap-2 p-1 w-full'>
                <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
              </div>
            </li>
          ))
        ) : (
          <p>No ministries to user account.</p>
        )}
      </ul>
      </form>

    </div>
  );
}