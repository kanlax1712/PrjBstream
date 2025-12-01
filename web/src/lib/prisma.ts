import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use PRISMA_DATABASE_URL (Accelerate) if available, otherwise fall back to DATABASE_URL
// This ensures we use Prisma Accelerate in production for better connection pooling
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle database connection errors gracefully
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
});

