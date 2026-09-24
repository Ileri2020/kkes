//  @ts-nocheck
"use server";

// import connectDB from "@/lib/db";
// import { User } from "@/models/User";
import { redirect } from "next/navigation";
import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const login = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      email,
      password,
    });
  } catch (error) {
    const someError = error as CredentialsSignin;
    console.error("Login failed:", someError.cause);
    return;
  }
  return { success: true };
};

const register = async (formData: FormData) => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || password.length < 8) {
    throw new Error("Please fill all fields");
  }

  // await connectDB();

  // existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
    // select: { password: true, role: true },
  });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hash(password, Number(process.env.SALT_ROUNDS ?? 12));

  // await User.create({ firstName, lastName, email, password: hashedPassword });
  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "STUDENT",
    },
  });
  console.log(`User created successfully 🥂`);
  redirect("/login");
};

// const fetchAllUsers = async () => {
//   await connectDB();
//   const users = await User.find({});
//   return users;
// };

export { register, login };
