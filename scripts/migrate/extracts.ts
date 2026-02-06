/**
 * Migrate extracts table
 * No dependencies - can run first
 *
 * NOTE: Audio files need to be migrated from Flash SWF to MP3
 * This script assumes MP3 files already uploaded to S3
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateExtracts() {
  console.log("Starting extracts migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all extracts from old database
    const [rows] = await oldDb.query("SELECT * FROM extracts ORDER BY id");
    const extracts = rows as any[];

    console.log(`Found ${extracts.length} extracts to migrate`);

    // Insert into new database using raw SQL to preserve IDs
    for (const extract of extracts) {
      await prisma.$executeRaw`
        INSERT INTO extracts (id, filename, audio_s3_url, audio_s3_key, title, composer, duration_seconds, date_created, last_modified)
        VALUES (${extract.id}, ${extract.filename}, ${null}, ${null}, ${extract.title}, ${extract.composer}, ${null}, ${extract.date_created}, ${extract.last_modified})
      `;
    }

    console.log(`✓ Migrated ${extracts.length} extracts`);
    console.log(
      "⚠️  Audio files need to be converted from Flash SWF to MP3 and uploaded to S3"
    );

    await recordMigration(
      "extracts",
      extracts.length,
      "Audio files need S3 migration"
    );
  } catch (error) {
    console.error("Error migrating extracts:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateExtracts()
    .then(() => {
      console.log("Extracts migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateExtracts };
