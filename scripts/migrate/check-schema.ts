import { prisma } from "./db";

async function checkSchema() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'inline_images'
    ORDER BY ordinal_position
  `;
  console.log("inline_images columns:");
  console.log(result);
  await prisma.$disconnect();
}

checkSchema().catch(console.error);
