import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma Database URL Configuration
// Priority: PRISMA_DATABASE_URL (Accelerate) > DATABASE_URL (direct) > POSTGRES_URL
// PRISMA_DATABASE_URL uses Prisma Accelerate for better performance and connection pooling
// In Vercel, these are set as environment variables
const databaseUrl = 
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_URL or PRISMA_DATABASE_URL must be set in production. " +
        "Please configure it in Vercel environment variables."
      );
    }
    // Fallback for local development only
    return "file:./dev.db";
  })();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
