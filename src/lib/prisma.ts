import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
  // Strip 'file:' prefix if it exists for better-sqlite3
  const dbPath = databaseUrl.replace(/^file:/, "");
  
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  
  return new PrismaClient({ adapter });
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
