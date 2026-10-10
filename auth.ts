import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLE_DASHBOARDS } from "@/lib/roles";

export { ROLE_DASHBOARDS };

// ─── Helper: provision a SchoolUser record for a newly created User ────────
async function provisionStudentMembership(userId: string) {
  // Find or create the school
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: "KKES School", slug: "kkes-school" },
    });
  }

  // Check if a membership already exists (idempotent)
  const existing = await prisma.schoolUser.findUnique({
    where: { schoolId_userId: { schoolId: school.id, userId } },
  });
  if (existing) return { school, membership: existing };

  // Find the current academic session so we have context for the new student
  const currentSession = await prisma.academicSession.findFirst({
    where: { schoolId: school.id, isCurrent: true },
  });

  // Create a StudentSet for this cohort year (or reuse an existing one)
  const entryYear = new Date().getFullYear();
  const expectedGrad = entryYear + 6; // default 6-year programme
  const setName = `Set of ${expectedGrad}`;

  let studentSet = await prisma.studentSet.findFirst({
    where: { schoolId: school.id, name: setName },
  });
  if (!studentSet) {
    studentSet = await prisma.studentSet.create({
      data: {
        schoolId: school.id,
        name: setName,
        entryYear,
        expectedGraduationYear: expectedGrad,
        currentLevel: "JSS1",
      },
    });
  }

  // Create SchoolUser (student) — no classId yet; student selects class on subjects page
  const membership = await prisma.schoolUser.create({
    data: {
      userId,
      schoolId: school.id,
      role: "STUDENT",
      status: "ACTIVE",
      setId: studentSet.id,
      entryLevel: "JSS1",
      entryYear,
      // classId left null until student selects it via /student/subjects
    },
  });

  return { school, membership };
}

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
          // ── Brand-new user (Google / Facebook first sign-in) ──────────────
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              avatarUrl: user.image,
              role: "STUDENT",
              status: "ACTIVE",
            },
          });
          token.id = created.id;
          token.role = created.role;
          token.avatarUrl = created.avatarUrl ?? undefined;

          // Auto-provision school membership linked to the current session
          const { school } = await provisionStudentMembership(created.id);
          token.school = { id: school.id, name: school.name, slug: school.slug };
        } else {
          // ── Returning user ─────────────────────────────────────────────────
          const membership = dbUser.schoolMemberships.find((item) => item.status === "ACTIVE");
          token.id = dbUser.id;
          token.role = membership?.role ?? dbUser.role;
          token.avatarUrl = dbUser.avatarUrl ?? user.image ?? undefined;
          token.school = membership?.school
            ? { id: membership.school.id, name: membership.school.name, slug: membership.school.slug }
            : undefined;

          // If STUDENT but no membership yet, provision one (e.g. created via credentials but never got one)
          if (!membership && (dbUser.role === "STUDENT" || token.role === "STUDENT")) {
            const { school } = await provisionStudentMembership(dbUser.id);
            token.school = { id: school.id, name: school.name, slug: school.slug };
          }
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

