import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Client automatically reads DATABASE_URL from environment variables
// IMPORTANT: In Vercel, set DATABASE_URL to use PRISMA_DATABASE_URL value
// (the prisma+postgres://accelerate.prisma-data.net URL) for Prisma Accelerate
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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

