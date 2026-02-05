/**
 * Show migration status
 * Displays what has been migrated and when
 */

import { prisma } from "./db";

async function status() {
  console.log("=== Migration Status ===\n");

  try {
    // Check if migration_log table exists
    const migrationLog = await prisma.$queryRaw<
      Array<{
        table_name: string;
        record_count: number;
        notes: string | null;
        migrated_at: Date;
      }>
    >`
      SELECT table_name, record_count, notes, migrated_at
      FROM migration_log
      ORDER BY migrated_at DESC
    `.catch(() => []);

    if (migrationLog.length === 0) {
      console.log("No migrations have been run yet.\n");
      console.log("To run initial migration:");
      console.log("  npm run migrate:all\n");
      console.log("To run incremental sync:");
      console.log("  npm run migrate:sync\n");
      return;
    }

    console.log("Recent Migrations:");
    console.log("----------------------------------------------------------------");
    console.log(
      "Table Name                 Records      Last Migrated"
    );
    console.log("----------------------------------------------------------------");

    // Group by table name, showing most recent migration for each
    const tableMap = new Map<
      string,
      { count: number; date: Date; notes: string | null }
    >();

    for (const log of migrationLog) {
      const existing = tableMap.get(log.table_name);
      if (
        !existing ||
        new Date(log.migrated_at) > new Date(existing.date)
      ) {
        tableMap.set(log.table_name, {
          count: log.record_count,
          date: log.migrated_at,
          notes: log.notes,
        });
      }
    }

    // Sort by table name
    const sortedTables = Array.from(tableMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    for (const [tableName, info] of sortedTables) {
      const dateStr = new Date(info.date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log(
        `${tableName.padEnd(25)} ${String(info.count).padStart(10)}  ${dateStr}`
      );

      if (info.notes) {
        console.log(`  Notes: ${info.notes}`);
      }
    }

    console.log("----------------------------------------------------------------\n");

    // Show summary stats
    const totalTables = tableMap.size;
    const totalRecords = Array.from(tableMap.values()).reduce(
      (sum, info) => sum + info.count,
      0
    );

    console.log(`Total tables migrated: ${totalTables}`);
    console.log(`Total records migrated: ${totalRecords.toLocaleString()}\n`);

    // Get actual counts from new database
    console.log("Current Database Counts:");
    console.log("----------------------------------------------------------------");

    const counts = {
      study_areas: await prisma.studyArea.count(),
      extracts: await prisma.extract.count(),
      inline_images: await prisma.inlineImage.count(),
      questions: await prisma.question.count(),
      ddi_options: await prisma.ddiOption.count(),
      products: await prisma.product.count(),
      users: await prisma.user.count(),
      org_stu_users: await prisma.orgStudentUser.count(),
      assignments: await prisma.assignment.count(),
      tests: await prisma.test.count(),
      users_questions: await prisma.userQuestion.count(),
      users_assignments: await prisma.userAssignment.count(),
    };

    for (const [table, count] of Object.entries(counts)) {
      if (count > 0) {
        console.log(`${table.padEnd(25)} ${String(count).padStart(10)}`);
      }
    }

    console.log("----------------------------------------------------------------\n");
  } catch (error) {
    console.error("Error getting migration status:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  status()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Status check failed:", error);
      process.exit(1);
    });
}

export { status };
