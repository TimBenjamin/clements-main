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
        await prisma.question.upsert({
          where: { id: q.id },
          update: {
            extractId: q.extract_id || null,
            studyAreaId: q.study_area_id,
            difficulty: q.difficulty,
            marks: q.marks,
            type: q.type,

            // Custom image (to be migrated to S3)
            customImgFilename: q.custom_img_filename,
            customImgS3Url: null, // To be populated after S3 migration
            customImgS3Key: null,
            customImgTitle: q.custom_img_title,

            // MCQ text options
            mcqOption1Text: q.mcq_option_1_text,
            mcqOption2Text: q.mcq_option_2_text,
            mcqOption3Text: q.mcq_option_3_text,
            mcqOption4Text: q.mcq_option_4_text,
            mcqOption5Text: q.mcq_option_5_text,

            // MCQ image options (legacy)
            mcqOption1Img: q.mcq_option_1_img,
            mcqOption2Img: q.mcq_option_2_img,
            mcqOption3Img: q.mcq_option_3_img,
            mcqOption4Img: q.mcq_option_4_img,
            mcqOption5Img: q.mcq_option_5_img,
            mcqOption1ImgId: q.mcq_option_1_img_id,
            mcqOption2ImgId: q.mcq_option_2_img_id,
            mcqOption3ImgId: q.mcq_option_3_img_id,
            mcqOption4ImgId: q.mcq_option_4_img_id,
            mcqOption5ImgId: q.mcq_option_5_img_id,

            // MCQ image options (S3 - to be populated)
            mcqOption1S3Url: null,
            mcqOption2S3Url: null,
            mcqOption3S3Url: null,
            mcqOption4S3Url: null,
            mcqOption5S3Url: null,

            mcqCorrectAnswer: q.mcq_correct_answer,

            // DDI
            ddi1Label: q.ddi_1_label,
            ddi1CorrectAnswer: q.ddi_1_correct_answer,
            ddi2Label: q.ddi_2_label,
            ddi2CorrectAnswer: q.ddi_2_correct_answer,

            // Content
            questionText: q.question_text,
            studyNotes: q.study_notes,

            // Authorship
            createdBy: q.created_by,
            lastModifiedBy: q.last_modified_by,

            dateCreated: q.date_created,
            lastModified: q.last_modified,
          },
          create: {
            id: q.id,
            extractId: q.extract_id || null,
            studyAreaId: q.study_area_id,
            difficulty: q.difficulty,
            marks: q.marks,
            type: q.type,

            customImgFilename: q.custom_img_filename,
            customImgS3Url: null,
            customImgS3Key: null,
            customImgTitle: q.custom_img_title,

            mcqOption1Text: q.mcq_option_1_text,
            mcqOption2Text: q.mcq_option_2_text,
            mcqOption3Text: q.mcq_option_3_text,
            mcqOption4Text: q.mcq_option_4_text,
            mcqOption5Text: q.mcq_option_5_text,

            mcqOption1Img: q.mcq_option_1_img,
            mcqOption2Img: q.mcq_option_2_img,
            mcqOption3Img: q.mcq_option_3_img,
            mcqOption4Img: q.mcq_option_4_img,
            mcqOption5Img: q.mcq_option_5_img,
            mcqOption1ImgId: q.mcq_option_1_img_id,
            mcqOption2ImgId: q.mcq_option_2_img_id,
            mcqOption3ImgId: q.mcq_option_3_img_id,
            mcqOption4ImgId: q.mcq_option_4_img_id,
            mcqOption5ImgId: q.mcq_option_5_img_id,

            mcqOption1S3Url: null,
            mcqOption2S3Url: null,
            mcqOption3S3Url: null,
            mcqOption4S3Url: null,
            mcqOption5S3Url: null,

            mcqCorrectAnswer: q.mcq_correct_answer,

            ddi1Label: q.ddi_1_label,
            ddi1CorrectAnswer: q.ddi_1_correct_answer,
            ddi2Label: q.ddi_2_label,
            ddi2CorrectAnswer: q.ddi_2_correct_answer,

            questionText: q.question_text,
            studyNotes: q.study_notes,

            createdBy: q.created_by,
            lastModifiedBy: q.last_modified_by,

            dateCreated: q.date_created,
            lastModified: q.last_modified,
          },
        });

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
