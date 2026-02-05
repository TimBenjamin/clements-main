/**
 * Database connection utilities for migration scripts
 */

import * as mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Old MySQL database connection
export async function getOldDb() {
  if (!process.env.OLD_DB_HOST) {
    throw new Error("OLD_DB_HOST not configured in .env");
  }

  const connection = await mysql.createConnection({
    host: process.env.OLD_DB_HOST,
    port: parseInt(process.env.OLD_DB_PORT || "3306"),
    user: process.env.OLD_DB_USER,
    password: process.env.OLD_DB_PASSWORD,
    database: process.env.OLD_DB_NAME,
  });

  console.log("✓ Connected to old MySQL database");
  return connection;
}

// New Postgres database (Prisma)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

/**
 * Track migration state
 */
export async function recordMigration(
  tableName: string,
  recordCount: number,
  notes?: string
) {
  // Create migration_log table if it doesn't exist
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS migration_log (
      id SERIAL PRIMARY KEY,
      table_name VARCHAR(255) NOT NULL,
      record_count INTEGER NOT NULL,
      notes TEXT,
      migrated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO migration_log (table_name, record_count, notes)
    VALUES (${tableName}, ${recordCount}, ${notes || null})
  `;

  console.log(`✓ Recorded migration: ${tableName} (${recordCount} records)`);
}

/**
 * Get last sync timestamp for a table
 */
export async function getLastSyncTime(tableName: string): Promise<Date | null> {
  const result = await prisma.$queryRaw<Array<{ migrated_at: Date }>>`
    SELECT migrated_at
    FROM migration_log
    WHERE table_name = ${tableName}
    ORDER BY migrated_at DESC
    LIMIT 1
  `;

  return result[0]?.migrated_at || null;
}

/**
 * Close database connections
 */
export async function closeConnections(oldDb: mysql.Connection) {
  await oldDb.end();
  await prisma.$disconnect();
  console.log("✓ Database connections closed");
}
