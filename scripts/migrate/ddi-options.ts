/**
 * Migrate ddi_options table
 * Depends on: questions
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateDdiOptions() {
  console.log("Starting ddi_options migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all DDI options from old database
    const [rows] = await oldDb.query("SELECT * FROM ddi_options ORDER BY id");
    const options = rows as any[];

    console.log(`Found ${options.length} DDI options to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const opt of options) {
      try {
        await prisma.ddiOption.upsert({
          where: { id: opt.id },
          update: {
            questionId: opt.question_id,
            list: opt.list,
            value: opt.value,
            dateCreated: opt.date_created,
            lastModified: opt.last_modified,
          },
          create: {
            id: opt.id,
            questionId: opt.question_id,
            list: opt.list,
            value: opt.value,
            dateCreated: opt.date_created,
            lastModified: opt.last_modified,
          },
        });

        migrated++;

        if (migrated % 500 === 0) {
          console.log(`  Migrated ${migrated}/${options.length} DDI options...`);
        }
      } catch (error) {
        console.error(`Error migrating DDI option ${opt.id}:`, error);
        errors++;
      }
    }

    console.log(`✓ Migrated ${migrated} DDI options (${errors} errors)`);

    await recordMigration("ddi_options", migrated, `${errors} errors`);
  } catch (error) {
    console.error("Error migrating DDI options:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateDdiOptions()
    .then(() => {
      console.log("DDI options migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateDdiOptions };
