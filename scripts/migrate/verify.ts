/**
 * Verify migration by comparing row counts
 */

import { getOldDb, prisma, closeConnections } from "./db";

async function verify() {
  console.log("=== Migration Verification ===\n");

  const oldDb = await getOldDb();

  try {
    const tables = [
      { old: "study_areas", new: "studyArea" },
      { old: "extracts", new: "extract" },
      { old: "inline_images", new: "inlineImage" },
      { old: "questions", new: "question" },
      { old: "ddi_options", new: "ddiOption" },
      { old: "products", new: "product" },
      { old: "users", new: "user" },
      { old: "org_stu_users", new: "orgStudentUser" },
      { old: "assignments", new: "assignment" },
      { old: "tests", new: "test" },
      { old: "users_questions", new: "userQuestion" },
      { old: "users_assignments", new: "userAssignment" },
    ];

    console.log("Table Name                 Old Count    New Count    Difference");
    console.log("----------------------------------------------------------------");

    let allMatch = true;

    for (const table of tables) {
      // Count in old database
      const [oldRows] = await oldDb.query(
        `SELECT COUNT(*) as count FROM ${table.old}`
      );
      const oldCount = (oldRows as any)[0].count;

      // Count in new database
      const newCount = await (prisma as any)[table.new].count();

      const diff = newCount - oldCount;
      const status = diff === 0 ? "✓" : diff > 0 ? "+" : "-";

      console.log(
        `${table.old.padEnd(25)} ${String(oldCount).padStart(10)} ${String(newCount).padStart(12)} ${status} ${diff !== 0 ? diff : ""}`
      );

      if (diff !== 0) {
        allMatch = false;
      }
    }

    console.log("----------------------------------------------------------------");

    if (allMatch) {
      console.log("\n✓ All tables match!");
    } else {
      console.log("\n⚠️  Some tables have different counts");
      console.log("This is normal if:");
      console.log("- Incremental sync hasn't been run yet");
      console.log("- There are foreign key constraint errors");
      console.log("- Some records were intentionally skipped");
    }

    // Check migration log
    console.log("\n\nMigration Log:");
    console.log("----------------------------------------------------------------");

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
      LIMIT 20
    `;

    if (migrationLog.length === 0) {
      console.log("No migrations recorded yet");
    } else {
      for (const log of migrationLog) {
        console.log(
          `${log.table_name.padEnd(25)} ${String(log.record_count).padStart(10)}  ${new Date(log.migrated_at).toISOString()}`
        );
        if (log.notes) {
          console.log(`  Notes: ${log.notes}`);
        }
      }
    }
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  verify()
    .then(() => {
      console.log("\nVerification complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nVerification failed:", error);
      process.exit(1);
    });
}

export { verify };
