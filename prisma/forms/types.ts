// types.ts

export interface BaseModel {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface Comment extends BaseModel {
    ministryId: string;
    contentId: string;
    userId: string;
    isArchived: boolean;
    reply: boolean;
  }
  
  export interface Like extends BaseModel {
    ministryId: string;
    contentId: string;
    userId: string;
  }
  
  export interface Video extends BaseModel {
    ministryId: string;
    title: string;
    description?: string;
    videoUrl: string;
  }
  
  export interface Audio extends BaseModel {
    ministryId: string;
    title: string;
    description?: string;
    audioUrl: string;
    duration?: string;
  }
  
  export interface Book extends BaseModel {
    ministryId: string;
    title: string;
    author?: string;
    coverUrl?: string;
    fileUrl: string;
    downloads: number;
  }
  
  export interface Billboard extends BaseModel {
    ministryId: string;
    departmentId: string;
    userId: string;
    label: string;
    content: string;
    imageUrl: string;
    categories: unknown[]; // adjust if needed
  }