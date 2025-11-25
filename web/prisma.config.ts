import "dotenv/config";
import { defineConfig } from "prisma/config";

// Get DATABASE_URL - required for production builds
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️  DATABASE_URL not found. Prisma operations may fail.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl || "postgresql://placeholder",
  },
});
