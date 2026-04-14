import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // In serverless environments each invocation can spin up its own pool.
  // Use a single connection per pool instance and let the Supabase transaction-
  // mode pooler (port 6543) multiplex across many concurrent invocations.
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,           // one connection per serverless instance
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
