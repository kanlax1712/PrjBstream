import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Get DATABASE_URL with fallback for build time
const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

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
