import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NotificationForm() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    message: '',
  });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=notification');
    setNotifications(res.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [fetchNotifications, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=notification&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=notification', formData);
    }
    resetForm();
    fetchNotifications();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=notification&id=${id}`);
    fetchNotifications();
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      message: '',
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Notifications</h2>
        <label className="sr-only" htmlFor="notification-user">User</label>
        <select id="notification-user" title="Select user" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })}>
          {users.length > 0 ? (
            users.map((user, index) => (
              <option key={index} value={user.id}>
                {user.name}
              </option>
            ))
          ) : (
            <option value="">No users</option>
          )}
        </select>
        <Input placeholder="Message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
        <ul className='w-full'>
          {notifications.length > 0 ? (
            notifications.map((item, index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <p>Message: {item.message}</p>
                <p>User: {users.find((user) => user.id === item.userId)?.name}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No notifications.</p>
          )}
        </ul>
      </form>
    </div>
  );
}