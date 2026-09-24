import { v2 as cloudinaryV2 } from "cloudinary";

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function handleUpload(file: string) {
  const res = await cloudinaryV2.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}