import { prisma } from "./db";

async function getFinalCounts() {
  const counts = {
    study_areas: await prisma.studyArea.count(),
    extracts: await prisma.extract.count(),
    inline_images: await prisma.inlineImage.count(),
    products: await prisma.product.count(),
    users: await prisma.user.count(),
    questions: await prisma.question.count(),
    ddi_options: await prisma.ddiOption.count(),
  };

  console.log("\n✅ Migration Complete!");
  console.log("======================\n");
  console.log("Final Database Counts:");
  console.log("----------------------");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table.padEnd(20)} ${count.toLocaleString()}`);
  }

  console.log("\n📊 Total records migrated:", Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString());

  await prisma.$disconnect();
}

getFinalCounts().catch(console.error);
