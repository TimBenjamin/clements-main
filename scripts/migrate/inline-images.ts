/**
 * Migrate inline_images table
 * No dependencies - can run first
 *
 * NOTE: Image files need to be migrated to S3
 * This script assumes images already uploaded to S3
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateInlineImages() {
  console.log("Starting inline_images migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all inline images from old database
    const [rows] = await oldDb.query("SELECT * FROM inline_images ORDER BY id");
    const images = rows as any[];

    console.log(`Found ${images.length} inline images to migrate`);

    // Insert into new database using raw SQL to preserve IDs
    // Note: Using camelCase column names as they exist in DB (no @map directives in schema)
    for (const img of images) {
      await prisma.$executeRaw`
        INSERT INTO inline_images (id, filename, "s3Url", "s3Key", title, category, date_created, last_modified)
        VALUES (${img.id}, ${img.filename}, ${null}, ${null}, ${img.title}, ${img.category}, ${img.date_created}, ${img.last_modified})
      `;
    }

    console.log(`✓ Migrated ${images.length} inline images`);
    console.log("⚠️  Image files need to be uploaded to S3");

    await recordMigration(
      "inline_images",
      images.length,
      "Image files need S3 migration"
    );
  } catch (error) {
    console.error("Error migrating inline images:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateInlineImages()
    .then(() => {
      console.log("Inline images migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateInlineImages };
