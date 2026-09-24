import { prisma } from "@/lib/prisma";



const modelMap = {
  //ministries: prisma.ministry,
  cart: prisma.cart,
  cartItem: prisma.cartItem,
  category: prisma.category,
  coupon: prisma.coupon,
  featuredProduct: prisma.featuredProduct,
  notification: prisma.notification,
  payment: prisma.payment,
  post: prisma.post,
  product: prisma.product,
  refund: prisma.refund,
  review: prisma.review,
  shippingAddress: prisma.shippingAddress,
  stock: prisma.stock,
  user: prisma.user,
};

async function dbHandler({
  model = null,
  id = null,
  body = null,
  method,
  profileImage = false,
}: {
  model: any;
  id?: string | null;
  body?: any;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  profileImage?: boolean;
}) {
  console.log("In dbhandler function");

  const prismaModel = modelMap[model];

  if (!prismaModel) {
    return { status: 400, data: { message: 'Invalid model' } };
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const item = await prismaModel.findUnique({ where: { id } });
          if (!item) {
            return { status: 404, data: { error: 'Document not found' } };
          }
          return { status: 200, data: item };
        } else {
          const items = await prismaModel.findMany();
          return { status: 200, data: items };
        }
      case 'POST':
        const data = body;
        const newItem = await prismaModel.create({ data });
        if (profileImage && model === 'posts') {
          try {
            console.log("about to change user profile image")
            await prisma.user.update({
              where: { id: body.userId },
              data: { avatarUrl: body.url },
            });
          } catch (error) {
            console.error('Database error:', error);
            return { status: 500, data: { error: 'Failed to update user profile image' } };
          }
        }
        return { status: 200, data: newItem };
      case 'PUT':
        const { _id, ...updatedata } = body;
        const updatedItem = await prismaModel.update({
          where: { id : _id },
          data: updatedata,
        });
        return { status: 200, data: updatedItem };
      case 'DELETE':
        await prismaModel.delete({ where: { id } });
        return { status: 200, data: { success: true } };
      default:
        return { status: 405, data: { error: 'Method not allowed' } };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { status: 500, data: { error: 'Failed to perform operation' } };
  }
}

export default dbHandler;

// const result = await dbHandler({
//   model: 'posts',
//   method: 'POST',
//   body: {
//     // your post data
//   },
//   profileImage: true,
// });














// 
// const prisma = new PrismaClient();

// const modelMap = {
//   ministries: prisma.ministry,
//   departments: prisma.department,
//   books: prisma.book,
//   users: prisma.user,
//   comments: prisma.comment,
//   likes: prisma.like,
//   billboards: prisma.billboard,
//   posts: prisma.post,
// };

// async function dbHandler({
//   model = null,
//   id = null,
//   body = null,
//   method,
// }: {
//   model: any;
//   id?: string;
//   body?: any;
//   method: 'GET' | 'POST' | 'PUT' | 'DELETE';
// }) {

//     console.log("In dbhandler function")
//   const prismaModel = modelMap[model];

//   if (!prismaModel) {
//     return { status: 400, data: { message: 'Invalid model' } };
//   }

//   try {
//     switch (method) {
//       case 'GET':
//         if (id) {
//           const item = await prismaModel.findUnique({ where: { id } });
//           if (!item) {
//             return { status: 404, data: { error: 'Document not found' } };
//           }
//           return { status: 200, data: item };
//         } else {
//           const items = await prismaModel.findMany();
//           return { status: 200, data: items };
//         }
//       case 'POST':
//         const data = body;
//         const newItem = await prismaModel.create({ data, });
//         return { status: 200, data: newItem };
//       case 'PUT':
//         const { id: _, ...updatedata } = body;
//         const updatedItem = await prismaModel.update({
//           where: { id },
//           data: updatedata,
//         });
//         return { status: 200, data: updatedItem };
//       case 'DELETE':
//         await prismaModel.delete({ where: { id } });
//         return { status: 200, data: { success: true } };
//       default:
//         return { status: 405, data: { error: 'Method not allowed' } };
//     }
//   } catch (error) {
//     console.error('Database error:', error);
//     return { status: 500, data: { error: 'Failed to perform operation' } };
//   }
// }



// export default dbHandler



// // const result = await dbHandler({
// //   model: 'users',
// //   method: 'GET',
// // });

// // console.log(result);