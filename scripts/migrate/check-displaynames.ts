import { getOldDb, closeConnections } from "./db";

async function checkDisplaynames() {
  const oldDb = await getOldDb();

  try {
    const [nullCount] = await oldDb.query(`
      SELECT COUNT(*) as count FROM users WHERE displayname IS NULL OR displayname = ''
    `);
    console.log(`Users with NULL/empty displayname: ${(nullCount as any)[0].count}`);

    const [totalCount] = await oldDb.query(`SELECT COUNT(*) as count FROM users`);
    console.log(`Total users: ${(totalCount as any)[0].count}`);

    // Check if displaynames are actually unique
    const [dupeCheck] = await oldDb.query(`
      SELECT displayname, COUNT(*) as count
      FROM users
      WHERE displayname IS NOT NULL AND displayname != ''
      GROUP BY displayname
      HAVING COUNT(*) > 1
      LIMIT 10
    `);

    if ((dupeCheck as any[]).length > 0) {
      console.log('\nDuplicate displaynames found:');
      console.log(dupeCheck);
    } else {
      console.log('\n✓ All non-null displaynames are unique');
    }

    // Sample some NULL displayname users
    const [samples] = await oldDb.query(`
      SELECT id, name, username, email, displayname
      FROM users
      WHERE displayname IS NULL OR displayname = ''
      LIMIT 10
    `);
    console.log('\nSample users with NULL/empty displayname:');
    console.log(samples);
  } finally {
    await closeConnections(oldDb);
  }
}

checkDisplaynames().catch(console.error);
