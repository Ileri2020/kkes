'use server'
import { auth } from "./auth";

export const usersession = async () => {
    const session = await auth();
    // console.log("session from login component",session)
    if (session?.user) {
      return session;
    }
  }




//   session from login component {
//   user: {
//     name: 'Adepoju Ololade',
//     email: 'adepojuololade2020@gmail.com',
//     image: 'https://lh3.googleusercontent.com/a/ACg8ocLdrFmljf-SPXpYAl7HcdIPIVgBam0jRZ5YkySzCZW8zI7oIik2=s96-c'
//   },
//   expires: '2025-12-06T18:59:49.210Z'
// }