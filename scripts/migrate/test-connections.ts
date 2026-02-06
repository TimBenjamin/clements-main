/**
 * Test database connections before running migration
 */

import { getOldDb, prisma, closeConnections } from "./db";

async function testConnections() {
  console.log("=== Testing Database Connections ===\n");

  let oldDb;
  let oldDbOk = false;
  let newDbOk = false;

  // Test old MySQL database
  try {
    console.log("Testing old MySQL database...");
    oldDb = await getOldDb();

    const [rows] = await oldDb.query("SELECT COUNT(*) as count FROM users");
    const userCount = (rows as any)[0].count;

    console.log(`✓ Connected to old MySQL database`);
    console.log(`  Found ${userCount} users\n`);
    oldDbOk = true;
  } catch (error: any) {
    console.error("✗ Failed to connect to old MySQL database");
    console.error(`  Error: ${error.message}\n`);
  }

  // Test new PostgreSQL database
  try {
    console.log("Testing new PostgreSQL database...");
    const userCount = await prisma.user.count();

    console.log(`✓ Connected to new PostgreSQL database`);
    console.log(`  Found ${userCount} users\n`);
    newDbOk = true;
  } catch (error: any) {
    console.error("✗ Failed to connect to new PostgreSQL database");
    console.error(`  Error: ${error.message}\n`);
  }

  // Summary
  console.log("=== Summary ===");
  console.log(`Old MySQL DB: ${oldDbOk ? "✓ OK" : "✗ FAILED"}`);
  console.log(`New PostgreSQL DB: ${newDbOk ? "✓ OK" : "✗ FAILED"}\n`);

  if (oldDbOk && newDbOk) {
    console.log("🎉 Both databases are accessible! Ready to migrate.\n");
    console.log("Next step: npm run migrate:all");
  } else {
    console.log("⚠️  Fix connection issues before running migration.\n");

    if (!oldDbOk) {
      console.log("Old DB troubleshooting:");
      console.log("  - Check OLD_DB_* environment variables in .env");
      console.log("  - Verify MySQL credentials are correct");
      console.log("  - Check network access to RDS instance");
      console.log("  - Ensure security groups allow your IP\n");
    }

    if (!newDbOk) {
      console.log("New DB troubleshooting:");
      console.log("  - Check DATABASE_URL in .env");
      console.log("  - Run: npx prisma generate");
      console.log("  - Run: npx prisma db push\n");
    }
  }

  // Cleanup
  if (oldDb) {
    await closeConnections(oldDb);
  } else {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testConnections()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}

export { testConnections };
