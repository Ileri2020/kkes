"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useAppContext } from "@/hooks/useAppContext";
// import {cloudUpload, uploadCloudinary} from '@/server/config/cloudinary'
import { CiCamera, CiCirclePlus } from 'react-icons/ci'
import { BiPlus } from 'react-icons/bi'


















export const ProfileImg = () => {
  const { selectedVideo, setSelectedVideo, useMock, user, setUser } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    type: 'image',
    userId: user.id,
    title: 'profile image',
    for: 'post',
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus , setUploadStatus] = useState("");

  const [file, setFile] = useState<File | null>(null);


  const form = useRef<HTMLFormElement>(null);

//   const fetchUsers = async () => {
//     const res = await axios('/api/dbhandler?model=users');
//     setUsers(res.data);
//   };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const pformData = new FormData();
    pformData.append("file", file);
    pformData.append("description", formData.description)
    pformData.append("type", formData.type)
    pformData.append("userId", user.id)
    pformData.append("title", formData.title)
    pformData.append("profileImage", "true")
    pformData.append('for', formData.for)
    
    try {
      const response = await axios.post(`/api/file/image`, pformData);
      if (response.status === 200) {
        const data = response.data;
        // do something with the data
        console.log(data)
        setUser({...user, avatarUrl : data.url});
      } else {
        alert("wrong input or connection error")
      }
    } catch (error) {
      // handle error
      console.error(error);
    }
    resetForm();
    // fetchUsers();
  };

  // const handleDelete = async (id) => {
  //   await axios.delete(`/api/dbhandler?model=users&id=${id}`);
  //   fetchUsers();
  // };

  const resetForm = () => {
    setPreview(null)
    setFormData({
    description: '',
    type: 'image',
    userId: user.id,
    title: 'profile image',
    for: 'post',
  });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 3 * 1024){
      alert("file size greater than 300kb file may not upload")
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }
  

  useEffect(() => {
    // if (file) {
    //     setPreview(URL.createObjectURL(file))
    // }
  }, [preview,]);

  

  return (
    <div className='absolute inline z-10 translate-x-[140px] translate-y-[140px]'>
      <Drawer>
        <DrawerTrigger asChild className='w-12 h-12 flex items-center rounded-full font-bold text-accent text-2xl border-2 border-accent p-2 hover:text-primary hover:bg-accent/40 place-self-end self-end z-10'>
            <CiCamera />
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>Edit your profile image (300kb max)</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl"> 
            
            {preview && (
              <div style={{ marginTop: '1rem' }}>
                <img src={preview} alt="Selected preview" style={{ maxHeight: '300px' }} />
              </div>
            )}
            <div>{user.id}</div>
            <Input
              type="file"
              name='image'
              id='image'
              placeholder="Avatar URL"
              // value={formData.avatarUrl || ''}
              // onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              onChange={handleImageChange}
            />
            
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              {/* <Button>Submit</Button> */}
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">Upload &rarr;</Button>
            </DrawerFooter>
          </form>
          {/* <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter> */}
        </DrawerContent>
      </Drawer>
    </div>
  )
}











export const PostButton = () => {
  const { user } = useAppContext();
  const isAdmin = user.role === "admin";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    type: "image" as "image" | "video" | "audio" | "document",
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));

    const fileType = selected.type.split("/")[0];
    let detectedType: "image" | "video" | "audio" | "document" = "document";
    if (fileType === "image") detectedType = "image";
    if (fileType === "video") detectedType = "video";
    if (fileType === "audio") detectedType = "audio";
    setFormData((prev) => ({ ...prev, type: detectedType }));
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setUploading(false);
    setFormData({
      title: "",
      description: "",
      category: "General",
      type: "image",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only admins can publish blog posts");
      return;
    }

    if (!file) {
      alert("Select a file first");
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("type", formData.type);
      data.append("authorId", user.id);

      await axios.post("/api/dbhandler?model=post", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        "Failed to create post. Please try again.";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="z-10 w-full">
      <Drawer>
        <DrawerTrigger asChild className="w-full h-10 border-2 border-accent flex items-center rounded-full font-bold text-accent text-2xl hover:text-accent hover:bg-accent/40 z-10">
          <BiPlus />
        </DrawerTrigger>
        <DrawerContent className="flex flex-col justify-center items-center py-10 max-w-5xl mx-auto">
          <DrawerHeader>
            <DrawerTitle className="w-full text-center">
              Create a new clinical insight
            </DrawerTitle>
            <DrawerDescription>
              Upload evidence-based content for the HealthClique blog.
            </DrawerDescription>
          </DrawerHeader>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl w-full"
          >
            {preview && (
              <div style={{ marginTop: "1rem" }}>
                {formData.type === "image" && (
                  <img
                    src={preview}
                    alt="Selected preview"
                    style={{ maxHeight: "300px" }}
                  />
                )}
                {formData.type === "video" && (
                  <video
                    src={preview}
                    controls
                    style={{ maxHeight: "300px" }}
                  />
                )}
                {formData.type === "audio" && (
                  <audio src={preview} controls />
                )}
                {formData.type === "document" && (
                  <p>Selected document: {file?.name}</p>
                )}
              </div>
            )}

            <div className="text-xs font-bold text-muted-foreground">
              Publishing as: {user.name || user.email}
            </div>

            <Input type="file" onChange={handleFileChange} />

            <Input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <Textarea
              placeholder="Clinical summary, key insights, or case details"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Category
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Pharmaceutical">
                      Pharmaceutical
                    </SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="News">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Content Type
                </div>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value as typeof prev.type,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              <DrawerClose className="flex-1" asChild>
                <Button className="flex-1" variant="outline" type="button">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 before:ani-shadow w-full"
                disabled={uploading}
              >
                {uploading ? "Publishing..." : "Publish →"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}





