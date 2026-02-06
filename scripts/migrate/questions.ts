/**
 * Migrate questions table
 * Depends on: study_areas, extracts
 *
 * NOTE: Custom images need to be migrated to S3
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateQuestions() {
  console.log("Starting questions migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all questions from old database
    const [rows] = await oldDb.query("SELECT * FROM questions ORDER BY id");
    const questions = rows as any[];

    console.log(`Found ${questions.length} questions to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const q of questions) {
      try {
        // Normalize extract_id: -1 and 0 are sentinel values meaning "no extract"
        const extractId =
          q.extract_id && q.extract_id > 0 ? q.extract_id : null;

        // Use raw SQL to insert with manual ID (Prisma doesn't allow this with autoincrement)
        await prisma.$executeRaw`
          INSERT INTO questions (
            id, extract_id, study_area_id, created_by, last_modified_by,
            difficulty, marks, type,
            custom_img_filename, custom_img_s3_url, custom_img_s3_key, custom_img_title,
            mcq_option_1_text, mcq_option_2_text, mcq_option_3_text, mcq_option_4_text, mcq_option_5_text,
            mcq_option_1_img, mcq_option_2_img, mcq_option_3_img, mcq_option_4_img, mcq_option_5_img,
            mcq_option_1_img_id, mcq_option_2_img_id, mcq_option_3_img_id, mcq_option_4_img_id, mcq_option_5_img_id,
            mcq_option_1_s3_url, mcq_option_2_s3_url, mcq_option_3_s3_url, mcq_option_4_s3_url, mcq_option_5_s3_url,
            mcq_correct_answer,
            ddi_1_label, ddi_1_correct_answer, ddi_2_label, ddi_2_correct_answer,
            question_text, study_notes,
            date_created, last_modified
          ) VALUES (
            ${q.id}, ${extractId}, ${q.study_area_id}, ${q.created_by}, ${q.last_modified_by},
            ${q.difficulty}, ${q.marks}, ${q.type}::question_type,
            ${q.custom_img_filename}, ${null}, ${null}, ${q.custom_img_title},
            ${q.mcq_option_1_text}, ${q.mcq_option_2_text}, ${q.mcq_option_3_text}, ${q.mcq_option_4_text}, ${q.mcq_option_5_text},
            ${q.mcq_option_1_img}, ${q.mcq_option_2_img}, ${q.mcq_option_3_img}, ${q.mcq_option_4_img}, ${q.mcq_option_5_img},
            ${q.mcq_option_1_img_id}, ${q.mcq_option_2_img_id}, ${q.mcq_option_3_img_id}, ${q.mcq_option_4_img_id}, ${q.mcq_option_5_img_id},
            ${null}, ${null}, ${null}, ${null}, ${null},
            ${q.mcq_correct_answer},
            ${q.ddi_1_label}, ${q.ddi_1_correct_answer}, ${q.ddi_2_label}, ${q.ddi_2_correct_answer},
            ${q.question_text}, ${q.study_notes},
            ${q.date_created}, ${q.last_modified}
          )
        `;

        migrated++;

        if (migrated % 100 === 0) {
          console.log(`  Migrated ${migrated}/${questions.length} questions...`);
        }
      } catch (error) {
        console.error(`Error migrating question ${q.id}:`, error);
        errors++;
      }
    }

    console.log(`✓ Migrated ${migrated} questions (${errors} errors)`);
    console.log("⚠️  Custom images need to be uploaded to S3");

    await recordMigration(
      "questions",
      migrated,
      `${errors} errors, custom images need S3 migration`
    );
  } catch (error) {
    console.error("Error migrating questions:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateQuestions()
    .then(() => {
      console.log("Questions migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateQuestions };
