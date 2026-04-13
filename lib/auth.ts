import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getDbUser(supabaseUserId: string) {
  return prisma.user.findFirst({
    where: { email: { not: undefined } },
  });
}

/**
 * Upsert Supabase auth user into Prisma User table.
 * Called after successful login/signup.
 */
export async function upsertUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}) {
  if (!supabaseUser.email) return null;

  return prisma.user.upsert({
    where: { email: supabaseUser.email },
    update: {
      name: supabaseUser.user_metadata?.full_name ?? undefined,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ?? undefined,
    },
    create: {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name ?? null,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
    },
  });
}
