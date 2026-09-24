"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit3, Trash2 } from "lucide-react";

interface CategoriesFormProps {
  initialCategory?: any;
  hideList?: boolean;
}

export default function CategoriesForm({ initialCategory, hideList = false }: CategoriesFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: initialCategory?.id || "",
    name: initialCategory?.name || "",
    description: initialCategory?.description || "",
    image: initialCategory?.image || "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(initialCategory?.id || null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileKey, setFileKey] = useState("file-0"); // Unique key to reset input

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=category");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (!selected) return;

    // Maximum allowed size in KB
    const maxSizeKB = 300;
    const maxSizeBytes = maxSizeKB * 1024;

    if (selected.size > maxSizeBytes) {
      toast.warning(`Image must be smaller than ${maxSizeKB}KB.`);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);

      if (file) {
        data.append("file", file); // new upload
      } else if (editId && formData.image) {
        data.append("image", formData.image); // keep existing image
      }

      if (editId) data.append("id", editId);

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editId) {
        await axios.put(`/api/dbhandler?model=category&id=${editId}`, data, config);
      } else {
        await axios.post(`/api/dbhandler?model=category`, data, config);
      }

      setLoading(false);
      toast.success(editId ? "Category updated" : "Category created");
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
    });

    setFile(null);
    setPreview(null);
    setFileKey(`file-${Date.now()}`); // Reset input key
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this category?`)) return;
    try {
      await axios.delete(`/api/dbhandler?model=category&id=${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error("Failed to delete category");
      console.error("Failed to delete category:", err);
    }
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", description: "", image: "" });
    setFile(null);
    setPreview(null);
    setEditId(null);
    setFileKey(`file-${Date.now()}`); // Reset input key
  };

  return (
    <div className="flex flex-col items-center max-h-[72vh] overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-3 p-4 border-2 border-secondary-foreground rounded-md m-2"
      >
        <h2 className="font-semibold text-lg">Manage Product Categories</h2>

        <div className="w-full space-y-1">
          <Label htmlFor="cat-name">Category Name</Label>
          <Input
            id="cat-name"
            type="text"
            placeholder="Name of category"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="cat-desc">Description</Label>
          <Input
            id="cat-desc"
            type="text"
            placeholder="Short description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="cat-image">Category Image</Label>
          <Input
            id="cat-image"
            ref={fileInputRef}
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 rounded-md mt-2 border"
          />
        ) : formData.image ? (
          <img
            src={formData.image}
            alt="Category"
            className="w-20 h-20 rounded-md mt-2 border"
          />
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : editId ? "Update" : "Create"}
        </Button>

        {editId && (
          <Button
            type="button"
            variant="ghost"
            onClick={resetForm}
            className="text-sm underline"
          >
            Cancel Edit
          </Button>
        )}

        {!hideList && (
          <ul className="w-full mt-4">
            {categories.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col items-center gap-2 my-2 bg-secondary rounded-md w-full p-3"
              >
                <p className="font-medium">
                  {index + 1}. {item.name}
                </p>

                {item.image && (
                  <img
                    src={item.image}
                    className="w-16 h-16 rounded-md border"
                    alt="category"
                  />
                )}

                <div className="flex flex-row gap-2 w-full">
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}
