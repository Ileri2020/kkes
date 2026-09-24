"use server"
import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcrypt';




export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  
  // Destructure and provide defaults
  const model = searchParams.get('model') || null;
  const id = searchParams.get('id') || null;
  const body = searchParams.get('body') || null;

  const { method } = req; 
  console.log("in db handler",model, id, method, body)


  const prismaModel = prisma.cart;

  
  if (id == null){
    try {
      const items = await prismaModel.findMany();
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch items' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }else{
    try {
        const item = await prismaModel.findUnique({
          where: { id },
        });

        if (!item) return new Response(
          JSON.stringify({ error: 'Document not found' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } }
        );

        return new Response(JSON.stringify(item), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch items' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } }
        );
      }
  }
}



export async function POST(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  // const formData = await req.formData
  // const file = formData.
  
  // Destructure and provide defaults
  // const id = searchParams.get('id') || null;
  // const body = searchParams.get('body') || null;

  // Parse JSON body
  let body: { userId?: string; cartItems?: Array<{ productId: string; quantity: number }> } | null = null;
  try {
    body = await req.json(); // This reads the JSON payload
  } catch (err) {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || typeof body.userId !== 'string' || !Array.isArray(body.cartItems)) {
    return new Response('Invalid request body', { status: 400 });
  }

  const { userId, cartItems } = body;

  const { method } = req; 
  console.log("in cart db handler", method, body)



  const prismaModel = prisma.cart

  
  try {
    const data = body;

    console.log("form body:", data)
    //const newItem = await prismaModel.create({
    //  data,
    //});
   const cart = await prisma.cart.create({
    data: {
      user: { connect: { id: userId } },
      status: 'pending',
      total: 0, // You might calculate this based on items
      products: {
        create: cartItems.map(item => ({
          quantity: item.quantity,
          product: { connect: { id: item.productId } },
        })),
      },
    },
    include: {
      products: true, // Include created cart items in response
    },
  });

    return new Response(JSON.stringify(cart), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to POST items' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

}




export async function PUT(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  
    // Destructure and provide defaults
    const model = searchParams.get('model') || null;
    const id = searchParams.get('id') || null;
    // const body = searchParams.get('body') || null;
  
    // Parse JSON body
    let body: { id?: string; [key: string]: any } | null = null;
    try {
      body = await req.json(); // This reads the JSON payload
    } catch (err) {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (!body || typeof body.id !== 'string') {
      return new Response('Invalid request body', { status: 400 });
    }

  const { method } = req; 
  console.log("in db handler",model, id, method, body)


  const prismaModel = prisma.cart;

    // ✏️ Update Object
  try {
    const { id: bodyId, ...updatedata } = body;
    console.log("id removed from :", updatedata)
    const updatedItem = await prismaModel.update({
      where: { id: bodyId },
      data: updatedata,
    });

    return new Response(JSON.stringify(updatedItem), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database update error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to UPDATE/PUT item' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

}




export async function DELETE(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  
  // Destructure and provide defaults
  const model = searchParams.get('model');
  const id = searchParams.get('id') || null;
  if (!model) {
    return new Response(JSON.stringify({ error: 'Invalid model' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
  }
  console.log("in db handler", model, id)


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

  const prismaModel = modelMap[model];

  if (!prismaModel) {
    console.log("in prisma model check function")
    return new Response(JSON.stringify({message : "invalid model"}), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

    // ❌ Delete Object
  try {
    await prismaModel.delete({
      where: { id },
    });
    return new Response(JSON.stringify({success : true}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to DELETE items' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
}































