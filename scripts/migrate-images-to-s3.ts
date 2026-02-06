import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

const s3Client = new S3Client({ region: "eu-west-1" });
const BUCKET_NAME = "clementstheory";

interface UploadStats {
  uploaded: number;
  skipped: number;
  errors: number;
  errorFiles: string[];
}

async function uploadDirectoryToS3(
  localDir: string,
  s3Prefix: string,
  stats: UploadStats
): Promise<void> {
  const files = await readdir(localDir);

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const fileStat = fs.statSync(localPath);

    if (fileStat.isDirectory()) {
      // Recursively upload subdirectories
      await uploadDirectoryToS3(localPath, `${s3Prefix}/${file}`, stats);
    } else {
      try {
        const fileContent = await readFile(localPath);
        const s3Key = `${s3Prefix}/${file}`;

        // Determine content type based on extension
        const ext = path.extname(file).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".svg") contentType = "image/svg+xml";

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000", // 1 year cache
          })
        );

        stats.uploaded++;
        if (stats.uploaded % 100 === 0) {
          console.log(`  Uploaded ${stats.uploaded} files...`);
        }
      } catch (error) {
        stats.errors++;
        stats.errorFiles.push(`${s3Prefix}/${file}`);
        console.error(`  Error uploading ${file}:`, error);
      }
    }
  }
}

async function updateInlineImagesDatabase() {
  console.log("\nUpdating inline_images table with S3 URLs...");

  const images = await prisma.inlineImage.findMany({
    select: {
      id: true,
      filename: true,
    },
  });

  let updated = 0;
  let notFound = 0;

  for (const image of images) {
    if (!image.filename) {
      notFound++;
      continue;
    }

    const s3Key = `images/inline/${image.filename}`;
    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    try {
      await prisma.inlineImage.update({
        where: { id: image.id },
        data: {
          s3Url,
          s3Key,
        },
      });

      updated++;
      if (updated % 100 === 0) {
        console.log(`  Updated ${updated}/${images.length} inline images...`);
      }
    } catch (error) {
      console.error(`  Error updating inline image ${image.id}:`, error);
    }
  }

  console.log(`✓ Updated ${updated} inline images`);
  console.log(`⚠ ${notFound} images had no filename`);
}

async function updateCustomImagesDatabase() {
  console.log("\nUpdating questions with custom_img S3 URLs...");

  const questions = await prisma.question.findMany({
    where: {
      customImgFilename: { not: null },
    },
    select: {
      id: true,
      customImgFilename: true,
    },
  });

  let updated = 0;

  for (const question of questions) {
    if (!question.customImgFilename) continue;

    const s3Key = `images/custom/${question.customImgFilename}`;
    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    try {
      await prisma.question.update({
        where: { id: question.id },
        data: {
          customImgS3Url: s3Url,
          customImgS3Key: s3Key,
        },
      });

      updated++;
    } catch (error) {
      console.error(
        `  Error updating question ${question.id} custom image:`,
        error
      );
    }
  }

  console.log(`✓ Updated ${updated} questions with custom images`);
}

async function updateMcqOptionImagesDatabase() {
  console.log("\nUpdating questions with MCQ option image S3 URLs...");

  // Get all questions that have mcq option image IDs
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { mcqOption1ImgId: { not: null } },
        { mcqOption2ImgId: { not: null } },
        { mcqOption3ImgId: { not: null } },
        { mcqOption4ImgId: { not: null } },
        { mcqOption5ImgId: { not: null } },
      ],
    },
    select: {
      id: true,
      mcqOption1ImgId: true,
      mcqOption2ImgId: true,
      mcqOption3ImgId: true,
      mcqOption4ImgId: true,
      mcqOption5ImgId: true,
    },
  });

  console.log(`Found ${questions.length} questions with MCQ option images`);

  // Get all inline images for lookup
  const inlineImages = await prisma.inlineImage.findMany({
    select: {
      id: true,
      s3Url: true,
    },
  });

  const imageMap = new Map(inlineImages.map((img) => [img.id, img.s3Url]));

  let updated = 0;

  for (const question of questions) {
    const updates: any = {};

    if (question.mcqOption1ImgId && imageMap.has(question.mcqOption1ImgId)) {
      updates.mcqOption1S3Url = imageMap.get(question.mcqOption1ImgId);
    }
    if (question.mcqOption2ImgId && imageMap.has(question.mcqOption2ImgId)) {
      updates.mcqOption2S3Url = imageMap.get(question.mcqOption2ImgId);
    }
    if (question.mcqOption3ImgId && imageMap.has(question.mcqOption3ImgId)) {
      updates.mcqOption3S3Url = imageMap.get(question.mcqOption3ImgId);
    }
    if (question.mcqOption4ImgId && imageMap.has(question.mcqOption4ImgId)) {
      updates.mcqOption4S3Url = imageMap.get(question.mcqOption4ImgId);
    }
    if (question.mcqOption5ImgId && imageMap.has(question.mcqOption5ImgId)) {
      updates.mcqOption5S3Url = imageMap.get(question.mcqOption5ImgId);
    }

    if (Object.keys(updates).length > 0) {
      try {
        await prisma.question.update({
          where: { id: question.id },
          data: updates,
        });

        updated++;
        if (updated % 100 === 0) {
          console.log(`  Updated ${updated}/${questions.length} questions...`);
        }
      } catch (error) {
        console.error(
          `  Error updating question ${question.id} MCQ options:`,
          error
        );
      }
    }
  }

  console.log(`✓ Updated ${updated} questions with MCQ option images`);
}

async function updateExtractImagesDatabase() {
  console.log("\nUpdating extracts table with audio S3 URLs...");

  const extracts = await prisma.extract.findMany({
    where: {
      filename: { not: null },
    },
    select: {
      id: true,
      filename: true,
    },
  });

  let updated = 0;

  for (const extract of extracts) {
    if (!extract.filename) continue;

    // Extracts could be in either extracts/ or mcq/ directory
    // Try extracts first, then mcq
    const s3Key = `images/extracts/${extract.filename}`;
    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    try {
      await prisma.extract.update({
        where: { id: extract.id },
        data: {
          audioS3Url: s3Url,
          audioS3Key: s3Key,
        },
      });

      updated++;
    } catch (error) {
      console.error(`  Error updating extract ${extract.id}:`, error);
    }
  }

  console.log(`✓ Updated ${updated} extracts`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("IMAGE MIGRATION TO S3");
  console.log("=".repeat(60));

  const stats: UploadStats = {
    uploaded: 0,
    skipped: 0,
    errors: 0,
    errorFiles: [],
  };

  // Upload all image directories
  console.log("\n1. Uploading inline images to S3...");
  await uploadDirectoryToS3("questions/inline", "images/inline", stats);

  console.log("\n2. Uploading custom images to S3...");
  await uploadDirectoryToS3("questions/custom", "images/custom", stats);

  console.log("\n3. Uploading extract images to S3...");
  await uploadDirectoryToS3("questions/extracts", "images/extracts", stats);

  console.log("\n4. Uploading MCQ images to S3...");
  await uploadDirectoryToS3("questions/mcq", "images/mcq", stats);

  console.log("\n" + "=".repeat(60));
  console.log("UPLOAD SUMMARY");
  console.log("=".repeat(60));
  console.log(`✓ Uploaded: ${stats.uploaded} files`);
  console.log(`✗ Errors: ${stats.errors} files`);

  if (stats.errorFiles.length > 0) {
    console.log("\nFailed files:");
    stats.errorFiles.forEach((file) => console.log(`  - ${file}`));
  }

  // Update database with S3 URLs
  console.log("\n" + "=".repeat(60));
  console.log("DATABASE UPDATES");
  console.log("=".repeat(60));

  await updateInlineImagesDatabase();
  await updateCustomImagesDatabase();
  await updateMcqOptionImagesDatabase();
  await updateExtractImagesDatabase();

  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION COMPLETE!");
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
