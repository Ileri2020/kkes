import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PostForm() {
  const [posts, setPosts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentUrl: '',
    authorId: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]); // Added to store users for the select input

  const fetchPosts = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=post');
    setPosts(res.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchUsers();
  }, [fetchPosts, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=post&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=post', formData);
    }
    resetForm();
    fetchPosts();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=post&id=${id}`);
    fetchPosts();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      contentUrl: '',
      authorId: '',
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Posts</h2>
        <label className="sr-only" htmlFor="post-author">Author</label>
        <select id="post-author" title="Select author" value={formData.authorId} onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}>
          <option value="">Select Author</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <Input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <Input type="text" placeholder="Content URL" value={formData.contentUrl} onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}
        <ul className='w-full'>
          {posts.length > 0 ? (
            posts.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Title : </span>
                  <span>{item.title}</span>
                </div>
                <p>Description : {item.description || <em>No description</em>}</p>
                <p>Content URL : {item.contentUrl || <em>No content URL</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No posts available.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

