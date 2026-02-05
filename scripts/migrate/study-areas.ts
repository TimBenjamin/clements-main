/**
 * Migrate study_areas table
 * No dependencies - can run first
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateStudyAreas() {
  console.log("Starting study_areas migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all study areas from old database
    const [rows] = await oldDb.query("SELECT * FROM study_areas ORDER BY id");
    const studyAreas = rows as any[];

    console.log(`Found ${studyAreas.length} study areas to migrate`);

    // Insert into new database
    for (const sa of studyAreas) {
      await prisma.studyArea.upsert({
        where: { id: sa.id },
        update: {
          position: sa.position,
          name: sa.name,
          description: sa.description,
          slug: sa.slug,
          dateCreated: sa.date_created,
          lastModified: sa.last_modified,
        },
        create: {
          id: sa.id,
          position: sa.position,
          name: sa.name,
          description: sa.description,
          slug: sa.slug,
          dateCreated: sa.date_created,
          lastModified: sa.last_modified,
        },
      });
    }

    console.log(`✓ Migrated ${studyAreas.length} study areas`);

    await recordMigration("study_areas", studyAreas.length);
  } catch (error) {
    console.error("Error migrating study areas:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateStudyAreas()
    .then(() => {
      console.log("Study areas migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateStudyAreas };
