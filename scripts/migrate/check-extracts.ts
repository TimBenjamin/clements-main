import { getOldDb, closeConnections } from "./db";

async function checkExtracts() {
  const oldDb = await getOldDb();

  try {
    // Check which extract IDs are referenced by questions
    const [questions] = await oldDb.query(`
      SELECT DISTINCT extract_id
      FROM questions
      WHERE extract_id IS NOT NULL
      ORDER BY extract_id
    `);

    const questionExtracts = (questions as any[]).map((q) => q.extract_id);
    console.log(`Questions reference ${questionExtracts.length} unique extract IDs`);
    console.log("Extract IDs:", questionExtracts);

    // Check which extract IDs actually exist
    const [extracts] = await oldDb.query(`SELECT id FROM extracts ORDER BY id`);
    const availableExtracts = (extracts as any[]).map((e) => e.id);
    console.log(`\nExtracts table has ${availableExtracts.length} extracts`);
    console.log("Available IDs:", availableExtracts);

    // Find missing extracts
    const missing = questionExtracts.filter(
      (id) => !availableExtracts.includes(id)
    );
    if (missing.length > 0) {
      console.log(`\n⚠️  ${missing.length} extract IDs are referenced but don't exist:`);
      console.log(missing);

      // Count affected questions
      const [count] = await oldDb.query(
        `SELECT COUNT(*) as count FROM questions WHERE extract_id IN (?)`,
        [missing]
      );
      console.log(
        `\nThis affects ${(count as any)[0].count} questions`
      );
    } else {
      console.log("\n✓ All referenced extracts exist");
    }
  } finally {
    await closeConnections(oldDb);
  }
}

checkExtracts().catch(console.error);
