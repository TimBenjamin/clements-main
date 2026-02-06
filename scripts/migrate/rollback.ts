/**
 * Rollback migration
 * DESTRUCTIVE: Clears migrated data from new database
 *
 * Usage:
 *   npm run migrate:rollback               # Clear all migrated data
 *   npm run migrate:rollback -- --table=users  # Clear specific table
 */

import { prisma } from "./db";

async function rollback(tableName?: string) {
  console.log("=== Migration Rollback ===\n");

  if (tableName) {
    console.log(`⚠️  WARNING: About to delete all data from ${tableName}`);
  } else {
    console.log("⚠️  WARNING: About to delete ALL migrated data");
  }

  console.log("\nThis action cannot be undone!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    if (tableName) {
      // Clear specific table
      switch (tableName) {
        case "study_areas":
          await prisma.studyArea.deleteMany();
          break;
        case "extracts":
          await prisma.extract.deleteMany();
          break;
        case "inline_images":
          await prisma.inlineImage.deleteMany();
          break;
        case "questions":
          await prisma.question.deleteMany();
          break;
        case "ddi_options":
          await prisma.ddiOption.deleteMany();
          break;
        case "products":
          await prisma.product.deleteMany();
          break;
        case "users":
          await prisma.user.deleteMany();
          break;
        case "org_stu_users":
          await prisma.orgStudentUser.deleteMany();
          break;
        case "assignments":
          await prisma.assignment.deleteMany();
          break;
        case "tests":
          await prisma.test.deleteMany();
          break;
        case "users_questions":
          await prisma.userQuestion.deleteMany();
          break;
        case "users_assignments":
          await prisma.userAssignment.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableName}`);
          process.exit(1);
      }

      console.log(`✓ Cleared ${tableName}`);
    } else {
      // Clear all tables in reverse dependency order
      console.log("Clearing all tables...\n");

      await prisma.userQuestion.deleteMany();
      console.log("✓ Cleared users_questions");

      await prisma.userAssignment.deleteMany();
      console.log("✓ Cleared users_assignments");

      await prisma.test.deleteMany();
      console.log("✓ Cleared tests");

      await prisma.assignment.deleteMany();
      console.log("✓ Cleared assignments");

      await prisma.orgStudentUser.deleteMany();
      console.log("✓ Cleared org_stu_users");

      await prisma.ddiOption.deleteMany();
      console.log("✓ Cleared ddi_options");

      await prisma.question.deleteMany();
      console.log("✓ Cleared questions");

      await prisma.user.deleteMany();
      console.log("✓ Cleared users");

      await prisma.inlineImage.deleteMany();
      console.log("✓ Cleared inline_images");

      await prisma.extract.deleteMany();
      console.log("✓ Cleared extracts");

      await prisma.studyArea.deleteMany();
      console.log("✓ Cleared study_areas");

      await prisma.product.deleteMany();
      console.log("✓ Cleared products");

      // Clear migration log
      await prisma.$executeRaw`TRUNCATE migration_log`;
      console.log("✓ Cleared migration_log");
    }

    console.log("\n✓ Rollback complete");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const tableArg = args.find((arg) => arg.startsWith("--table="));
  const tableName = tableArg ? tableArg.split("=")[1] : undefined;

  rollback(tableName)
    .then(() => {
      console.log("\nRollback complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nRollback failed:", error);
      process.exit(1);
    });
}

export { rollback };
