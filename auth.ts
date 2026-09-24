import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLE_DASHBOARDS } from "@/lib/roles";

export { ROLE_DASHBOARDS };

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) throw new CredentialsSignin("Email and password are required");

        const user = await prisma.user.findUnique({
          where: { email },
          include: { schoolMemberships: { include: { school: true } } },
        });
        if (!user?.password || !(await compare(password, user.password))) {
          throw new CredentialsSignin("Invalid email or password");
        }
        if (user.status !== "ACTIVE") throw new CredentialsSignin("This account is not active");

        const membership = user.schoolMemberships.find((item) => item.status === "ACTIVE");
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: membership?.role ?? user.role,
          school: membership?.school
            ? { id: membership.school.id, name: membership.school.name, slug: membership.school.slug }
            : undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { schoolMemberships: { include: { school: true } } },
        });

        if (!dbUser) {
          const created = await prisma.user.create({
            data: { email: user.email, name: user.name, avatarUrl: user.image, role: "STUDENT" },
          });
          token.id = created.id;
          token.role = created.role;
          token.avatarUrl = created.avatarUrl ?? undefined;
        } else {
          const membership = dbUser.schoolMemberships.find((item) => item.status === "ACTIVE");
          token.id = dbUser.id;
          token.role = membership?.role ?? dbUser.role;
          token.avatarUrl = dbUser.avatarUrl ?? user.image ?? undefined;
          token.school = membership?.school
            ? { id: membership.school.id, name: membership.school.name, slug: membership.school.slug }
            : undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.avatarUrl = token.avatarUrl as string | undefined;
        session.user.school = token.school as { id: string; name: string; slug: string } | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 10 * 60 * 60 },
  jwt: { maxAge: 10 * 60 * 60 },
});
