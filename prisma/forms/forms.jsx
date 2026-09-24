import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// lib/api.js
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export const fetchData = async (model) => {
  const res = await axios.get(`/api/dbhandler?model=${model}`);
  return res.data;
};

export const postData = async (model, data) => {
  const res = await axios.post(`/api/dbhandler?model=${model}`, data);
  return res.data;
};

export const updateData = async (model, id, data) => {
  const res = await axios.put(`/api/dbhandler?model=${model}&id=${id}`, data);
  return res.data;
};

export const deleteData = async (model, id) => {
  const res = await axios.delete(`/api/dbhandler?model=${model}&id=${id}`);
  return res.data;
};














// components/CrudForm.jsx

// import { fetchData, postData, updateData, deleteData } from '../lib/api';

const fieldHandlers = {
  String: (value, onChange) => (
    <Input type="text" value={value || ''} onChange={onChange} />
  ),
  Int: (value, onChange) => (
    <Input type="number" value={value || 0} onChange={onChange} />
  ),
  Boolean: (value, onChange) => (
    <Input type="checkbox" checked={value || false} onChange={onChange} />
  ),
  DateTime: (value) => (
    <span>{new Date(value).toLocaleString()}</span>
  ),
  Array: (value, onChange) => (
    <Input
      type="text"
      placeholder="Comma-separated values"
      value={(value || []).join(',')}
      onChange={onChange}
    />
  ),
  default: (value, onChange) => (
    <input type="text" value={value || ''} onChange={onChange} />
  ),
};

export default function CrudForm({ model }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchData(model);
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, [model]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setFormData({});
    setEditId(null);
  };

  const handleChange = (field, value, isCheckbox = false) => {
    const newValue = isCheckbox ? value.target.checked : value.target.value;

    if (field.endsWith('Id') && !field.startsWith('id')) {
      // Handle foreign key references like departmentId, ministryId
      setFormData((prev) => ({ ...prev, [field]: newValue }));
    } else if (Array.isArray(formData[field])) {
      // Handle array fields like admins[]
      setFormData((prev) => ({
        ...prev,
        [field]: newValue.split(',').map((v) => v.trim()),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: newValue }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await postData(model, formData);
      resetForm();
      loadItems();
    } catch (err) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateData(model, editId, formData);
      resetForm();
      loadItems();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteData(model, id);
      loadItems();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleEditClick = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  if (loading) return <p>Loading...</p>;
  if (!items.length)
    return <p>No records found for {model}. Try creating one.</p>;

  const sampleItem = items[0];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      

      <form onSubmit={editId ? handleUpdate : handleCreate} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2>Manage {model.charAt(0).toUpperCase() + model.slice(1)}</h2>
        {Object.keys(sampleItem).map((key) => {
          if (key === 'id' || key === '_id') return null;
          if (key === 'createdAt' || key === 'updatedAt') return null;

          const value = formData[key] !== undefined ? formData[key] : sampleItem[key];
          const type = Array.isArray(value) ? 'Array' : typeof value;

          const handler =
            fieldHandlers[type] ||
            fieldHandlers[value?.constructor?.name] ||
            fieldHandlers.default;

          return (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block' }}>
                {key}
                <br />
                {handler(
                  value,
                  (e) => handleChange(key, e),
                  type === 'Boolean'
                )}
              </label>
            </div>
          );
        })}
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
      </form>

      <hr />

      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '1rem' }}>
            <strong>{item.name || item.title || item.email || item.label || item.id}</strong>
            <br />
            <Button onClick={() => handleEditClick(item)}>Edit</Button>
            <Button onClick={() => handleDelete(item.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}





// //usage sample
// // pages/ministries.js
// import CrudForm from '../components/CrudForm';

// export default function MinistriesPage() {
//   return <CrudForm model="ministries" />;
// }

// // pages/departments.js
// import CrudForm from '../components/CrudForm';

// export default function DepartmentsPage() {
//   return <CrudForm model="departments" />;
// }