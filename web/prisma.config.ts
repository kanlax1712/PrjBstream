import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma Database URL Configuration
// Priority: PRISMA_DATABASE_URL (Accelerate) > DATABASE_URL (direct) > fallback
// PRISMA_DATABASE_URL uses Prisma Accelerate for better performance and connection pooling
const databaseUrl = 
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL || 
  "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40";

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
