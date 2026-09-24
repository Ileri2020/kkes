// @ts-nocheck
'use server'

import { signIn } from "@/auth";
import { FcGoogle } from "react-icons/fc";

/* ================= GOOGLE ================= */

export const GoogleSignIn = async () => {
  const googleSignInAction = async () => {
    "use server";
    await signIn("google");
  };

  return (
    <div className="m-2">
      <form action={googleSignInAction}>
        <button
          type="submit"
          className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
        >
          <FcGoogle className="h-4 w-4" />
          <span className="text-sm">Google</span>
        </button>
      </form>
    </div>
  );
};

export const googleSignIn = async () => {
  "use server";
  await signIn("google");
};

/* ================= FACEBOOK ================= */

export const facebookSignIn = async () => {
  "use server";
  await signIn("facebook");
};