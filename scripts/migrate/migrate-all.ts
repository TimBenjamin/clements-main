/**
 * Master migration script
 * Runs all migrations in correct dependency order
 */

import { migrateStudyAreas } from "./study-areas";
import { migrateExtracts } from "./extracts";
import { migrateInlineImages } from "./inline-images";
import { migrateQuestions } from "./questions";
import { migrateDdiOptions } from "./ddi-options";
import { migrateProducts } from "./products";
import { migrateUsers } from "./users";

async function migrateAll() {
  console.log("=== Starting Full Migration ===\n");

  try {
    // Phase 1: Static Content (no dependencies)
    console.log("PHASE 1: Static Content");
    console.log("------------------------\n");

    console.log("1/6: Study Areas");
    await migrateStudyAreas();

    console.log("\n2/6: Extracts");
    await migrateExtracts();

    console.log("\n3/6: Inline Images");
    await migrateInlineImages();

    console.log("\n4/6: Questions");
    await migrateQuestions();

    console.log("\n5/6: DDI Options");
    await migrateDdiOptions();

    console.log("\n6/6: Products");
    await migrateProducts();

    // Phase 2: User Data
    console.log("\n\nPHASE 2: User Data");
    console.log("------------------\n");

    console.log("1/1: Users");
    await migrateUsers();

    console.log("\n\n=== Migration Complete ===");
    console.log("\nNext steps:");
    console.log("1. Run incremental sync for dynamic data: npm run migrate:sync");
    console.log("2. Verify migration: npm run migrate:verify");
    console.log("3. Upload media files to S3 (extracts, custom images)");
    console.log("4. Send password reset emails to all users");
  } catch (error) {
    console.error("\n\n=== Migration Failed ===");
    console.error(error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateAll()
    .then(() => {
      console.log("\nFull migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nMigration failed:", error);
      process.exit(1);
    });
}

export { migrateAll };
