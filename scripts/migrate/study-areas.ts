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

    // Insert into new database using raw SQL to preserve IDs
    for (const sa of studyAreas) {
      await prisma.$executeRaw`
        INSERT INTO study_areas (id, position, name, description, slug, date_created, last_modified)
        VALUES (${sa.id}, ${sa.position}, ${sa.name}, ${sa.description}, ${sa.slug}, ${sa.date_created}, ${sa.last_modified})
      `;
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
