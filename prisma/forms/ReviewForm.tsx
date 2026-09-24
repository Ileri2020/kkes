// components/LikeForm.tsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Like } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_URL = '/api/dbhandler';

export default function LikeForm() {
  const [likes, setLikes] = useState<Like[]>([]);
  const [formData, setFormData] = useState<Omit<Like, 'id' | 'createdAt' | 'updatedAt'>>({
    ministryId: '',
    contentId: '',
    userId: '',
  });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchLikes = async () => {
    const res = await axios.get(`${API_URL}?model=likes`);
    setLikes(res.data);
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}?model=likes&id=${editId}`, formData);
      } else {
        await axios.post(`${API_URL}?model=likes`, formData);
      }
      resetForm();
      fetchLikes();
    } catch (err) {
      alert('Failed to save like.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this like?')) return;
    await axios.delete(`${API_URL}?model=likes&id=${id}`);
    fetchLikes();
  };

  const handleEdit = (item: Like) => {
    setEditId(item.id);
    setFormData({
      ministryId: item.ministryId,
      contentId: item.contentId,
      userId: item.userId,
    });
  };

  const resetForm = () => {
    setFormData({ ministryId: '', contentId: '', userId: '' });
    setEditId(null);
  };

  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2>Manage Likes</h2>
        <Input placeholder="Ministry ID" value={formData.ministryId} onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })} />
        <Input placeholder="Content ID" value={formData.contentId} onChange={(e) => setFormData({ ...formData, contentId: e.target.value })} />
        <Input placeholder="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
      </form>

      <ul>
        {likes.map((item) => (
          <li key={item.id}>
            <strong>ID:</strong> {item.id} |
            <strong>Ministry:</strong> {item.ministryId} |
            <strong>User:</strong> {item.userId}
            <button onClick={() => handleEdit(item)}>Edit</button>
            <button onClick={() => handleDelete(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}