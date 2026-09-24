
import { NextRequest, NextResponse } from 'next/server';
import multer from "multer";
import { handleUpload } from "../cloudinary";
import axios from 'axios';
import dbHandler from '../../dbhandler/function';



export async function POST(req , res) {
  const Formdata = await req.formData();

  console.log("about to upload image", Formdata)
  
  const file = Formdata.get("file")
  if (file.size > (300 * 1024) && Formdata.get("title") === 'profile image'){
    return NextResponse.json({"error" : "file greater 300kb"}, {status : 413})
  }
  const buffer = await file.arrayBuffer()
  const b64 = Buffer.from(buffer).toString("base64");
  // console.log("buffer b64", b64)
  const dataURI = "data:" + file.type + ";base64," + b64;
  const cldRes = await handleUpload(dataURI);

  // const postRes = await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/dbhandler?model=posts`,
  //   {
  //     description : Formdata.get("description"),
  //     type : Formdata.get("type"),
  //     userId : Formdata.get("userId"),
  //     title : Formdata.get("title"),
  //     url : cldRes.url,
  //   }
  // );

  const postRes = await dbHandler({
    model: 'posts',
    method: 'POST',
    profileImage : Formdata.get("profileImage")==="true",
    body: {
      description: Formdata.get("description"),
      type: Formdata.get("type"),
      userId: Formdata.get("userId"),
      title: Formdata.get("title"),
      for: Formdata.get("for"),
      url: cldRes.url,
      ministryId: "684f74ca135dd6d0efeab37d"
    },
  });
  

  console.log("Post Response", postRes)

  return NextResponse.json(postRes.data, { status: 200 });

  // cloudinary response {  work on cloudinary environment variable
  //   asset_id: 'a51be13d7609010625bdd7b5d8434bc6',
  //   public_id: 'v1xu59hejkllgvk7uvgv',
  //   version: 1750991876,
  //   version_id: '52d6e5a55fee379c994b83915e86a357',
  //   signature: '9dbc6e90d77375b186a14a3596a2fce8cf9ffa8a',
  //   width: 1080,
  //   height: 864,
  //   format: 'jpg',
  //   resource_type: 'image',
  //   created_at: '2025-06-27T02:37:56Z',
  //   tags: [],
  //   bytes: 89980,
  //   type: 'upload',
  //   etag: 'a00c074199d6dc33f71c45f16ca52870',
  //   placeholder: false,
  //   url: 'http://res.cloudinary.com/dc5khnuiu/image/upload/v1750991876/v1xu59hejkllgvk7uvgv.jpg',
  //   secure_url: 'https://res.cloudinary.com/dc5khnuiu/image/upload/v1750991876/v1xu59hejkllgvk7uvgv.jpg',
  //   asset_folder: '',
  //   display_name: 'v1xu59hejkllgvk7uvgv',
  //   api_key: '474889658884221'
  // }


  
  // try {
  //   await runMiddleware(req, res, myUploadMiddleware);
  //   const Formdata = await req.formData();
  //   console.log("about to upload image", Formdata, Formdata.image.arrayBuffer())
  //   const b64 = Buffer.from(Formdata.file.arrayBuffer()).toString("base64");
  //   let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  //   const cldRes = await handleUpload(dataURI);
  //   return NextResponse.json(cldRes);
  // } catch (error) {
  //   console.log(error);
  //   return NextResponse.json({ message: error.message });
  // }
  
};























// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };







// const storage = multer.memoryStorage();
// const upload = multer({ storage });
// const myUploadMiddleware = upload.single("file");

// function runMiddleware(req, res, fn) {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result) => {
//       if (result instanceof Error) {
//         return reject(result);
//       }
//       return resolve(result);
//     });
//   });
// }






// export default handler;
// ```

// This API route uses Multer to parse the file from the request body and then uploads it to Cloudinary using the `handleUpload` function. The `runMiddleware` function is used to run the Multer middleware and handle any errors that may occur.

// You can test this API route by sending a POST request with a file attached to the `sample_file` field. The response will contain the URL of the uploaded image.

// Note that you'll need to set the `CLOUD_NAME`, `API_KEY`, and `API_SECRET` environment variables to your Cloudinary credentials.
// [6/16, 11:36] Ileri_Oluwa: In a next API file route containing GET, POST,PUT,DELETE routes separately 

// How do I disable body parser for only POST and PUT  route
// [6/16, 11:37] Meta AI: To disable body parser for only specific routes (in this case, POST and PUT) in a Next.js API route file, you can use the `config` object with the `api` property set to `{ bodyParser: false }` for those specific routes. However, this configuration applies to the entire API route file.

// One way to achieve this is to separate the routes that require body parsing into different files. For example, you could have one file for GET and DELETE routes, and another file for POST and PUT routes that require `bodyParser: false`.

// If you want to keep all routes in the same file, you can manually parse the request body for POST and PUT requests using a library like `body-parser` or `multer` only when necessary.

// Here's an example of how you can structure your API route file:

// ```





















// import { NextRequest, NextResponse } from 'next/server';
// import multer from 'multer';

// // Initialize Multer
// const storage = multer.memoryStorage();
// const upload = multer({ storage });


// export async function POST(req) {
//   try {
//     // Use Multer middleware to parse the request body
//     const myUploadMiddleware = upload.single('sample_file');
//     await new Promise((resolve, reject) => {
//       myUploadMiddleware(req, {} as any, (result) => {
//         if (result instanceof Error) {
//           reject(result);
//         } else {
//           resolve(result);
//         }
//       });
//     });

//     // Handle file upload and return response
//     const file = req.file;
//     // Upload file to Cloudinary or handle it as needed
//     return NextResponse.json({ message: 'File uploaded successfully' });
//   } catch (error) {
//     return NextResponse.json({ message: 'Error uploading file' }, { status: 500 });
//   }
// }

// export async function PUT(req) {
//   // Similar implementation as POST
// }

// export async function DELETE(req) {
//   // Handle DELETE request
// }
// ```

// In this example, we're manually using the Multer middleware for the POST and PUT routes. Note that we're passing an empty object (`{}`) as the response object to the Multer middleware, as it's required but not used in this context.

// Keep in mind that you'll need to handle the request body parsing manually for the POST and PUT routes, while the GET and DELETE routes will still use the default body parsing behavior.