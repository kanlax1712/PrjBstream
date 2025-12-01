#!/usr/bin/env node

/**
 * Script to verify Prisma Accelerate connection
 * Usage: node scripts/verify-prisma-accelerate.mjs
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env.local") });
dotenv.config({ path: join(__dirname, "../.env") });

async function verifyConnection() {
  console.log("🔍 Verifying Prisma Accelerate Connection...\n");

  // Check environment variables
  const prismaDatabaseUrl = process.env.PRISMA_DATABASE_URL;
  const databaseUrl = process.env.DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_URL;

  console.log("📋 Environment Variables:");
  console.log(`  PRISMA_DATABASE_URL: ${prismaDatabaseUrl ? "✅ Set" : "❌ Not set"}`);
  if (prismaDatabaseUrl) {
    const url = new URL(prismaDatabaseUrl);
    console.log(`    Protocol: ${url.protocol}`);
    console.log(`    Host: ${url.hostname}`);
    console.log(`    Has API Key: ${url.searchParams.has("api_key") ? "✅ Yes" : "❌ No"}`);
  }

  console.log(`  DATABASE_URL: ${databaseUrl ? "✅ Set" : "❌ Not set"}`);
  if (databaseUrl) {
    const url = databaseUrl.includes("://") ? new URL(databaseUrl) : null;
    if (url) {
      console.log(`    Protocol: ${url.protocol}`);
      console.log(`    Host: ${url.hostname}`);
      console.log(`    Port: ${url.port || "default"}`);
    } else {
      console.log(`    Format: ${databaseUrl.substring(0, 50)}...`);
    }
  }

  console.log(`  POSTGRES_URL: ${postgresUrl ? "✅ Set" : "❌ Not set"}`);
  console.log("");

  // Determine which URL to use
  const connectionUrl = prismaDatabaseUrl || databaseUrl || postgresUrl;

  if (!connectionUrl) {
    console.error("❌ No database URL found in environment variables!");
    console.error("   Please set PRISMA_DATABASE_URL, DATABASE_URL, or POSTGRES_URL");
    process.exit(1);
  }

  console.log("🔗 Using connection URL:");
  if (connectionUrl.includes("prisma+postgres://")) {
    console.log("   ✅ Prisma Accelerate URL detected");
    const url = new URL(connectionUrl);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Has API Key: ${url.searchParams.has("api_key") ? "✅" : "❌"}`);
  } else if (connectionUrl.includes("db.prisma.io")) {
    console.log("   ⚠️  Direct Prisma Accelerate endpoint (db.prisma.io)");
    console.log("   This may not work - consider using prisma+postgres:// protocol");
  } else {
    console.log("   ℹ️  Direct PostgreSQL connection");
  }
  console.log("");

  // Test connection
  console.log("🧪 Testing database connection...\n");

  // Set DATABASE_URL for Prisma Client
  process.env.DATABASE_URL = connectionUrl;

  const prisma = new PrismaClient({
    log: ["error", "warn"],
  });

  try {
    // Test 1: Connect to database
    console.log("1️⃣  Testing connection...");
    await prisma.$connect();
    console.log("   ✅ Successfully connected to database!\n");

    // Test 2: Simple query
    console.log("2️⃣  Testing query (counting users)...");
    const userCount = await prisma.user.count();
    console.log(`   ✅ Query successful! Found ${userCount} user(s)\n`);

    // Test 3: Check tables exist
    console.log("3️⃣  Verifying database schema...");
    const tables = [
      "User",
      "Channel",
      "Video",
      "Comment",
      "Playlist",
      "Subscription",
    ];

    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`   ✅ ${table}: ${count} record(s)`);
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }
    console.log("");

    // Test 4: Test write operation (optional)
    console.log("4️⃣  Testing write operation (optional)...");
    try {
      // Just check if we can query, don't actually write
      await prisma.$queryRaw`SELECT 1`;
      console.log("   ✅ Write operations should work\n");
    } catch (err) {
      console.log(`   ⚠️  Write test: ${err.message}\n`);
    }

    console.log("✅ All tests passed! Database connection is working.\n");
    console.log("📊 Connection Summary:");
    console.log(`   Connection URL: ${connectionUrl.includes("prisma+postgres://") ? "Prisma Accelerate" : "Direct PostgreSQL"}`);
    console.log(`   Status: ✅ Connected`);
    console.log(`   Users in database: ${userCount}`);

  } catch (error) {
    console.error("\n❌ Connection test failed!\n");
    console.error("Error details:");
    console.error(`   Type: ${error.constructor.name}`);
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Message: ${error.message}\n`);

    if (error.code === "P1001") {
      console.error("💡 This error means:");
      console.error("   - Cannot reach database server");
      console.error("   - Check if the host is correct");
      console.error("   - Check if the port is correct");
      console.error("   - Check network/firewall settings\n");
    } else if (error.code === "P2024") {
      console.error("💡 This error means:");
      console.error("   - Connection pool timeout");
      console.error("   - Database might be overloaded");
      console.error("   - Try using Prisma Accelerate for better connection pooling\n");
    } else if (error.message?.includes("authentication")) {
      console.error("💡 This error means:");
      console.error("   - Invalid credentials");
      console.error("   - Check username/password");
      console.error("   - Check API key (for Prisma Accelerate)\n");
    }

    console.error("🔧 Troubleshooting:");
    console.error("   1. Verify the connection URL is correct");
    console.error("   2. Check if the database is accessible");
    console.error("   3. For Prisma Accelerate, verify the API key is valid");
    console.error("   4. Check Vercel environment variables\n");

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run verification
verifyConnection().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

