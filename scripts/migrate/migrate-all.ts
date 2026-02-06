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
    console.log("PHASE 1: Static Content (No User Dependencies)");
    console.log("------------------------------------------------\n");

    console.log("1/4: Study Areas");
    await migrateStudyAreas();

    console.log("\n2/4: Extracts");
    await migrateExtracts();

    console.log("\n3/4: Inline Images");
    await migrateInlineImages();

    console.log("\n4/4: Products");
    await migrateProducts();

    // Phase 2: Users (required before questions due to createdBy/lastModifiedBy)
    console.log("\n\nPHASE 2: Users");
    console.log("---------------\n");

    console.log("1/1: Users");
    await migrateUsers();

    // Phase 3: Questions (depends on users and study areas)
    console.log("\n\nPHASE 3: Questions & Content");
    console.log("-----------------------------\n");

    console.log("1/2: Questions");
    await migrateQuestions();

    console.log("\n2/2: DDI Options");
    await migrateDdiOptions();

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
