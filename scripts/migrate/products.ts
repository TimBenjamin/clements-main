/**
 * Migrate products table
 * No dependencies - can run first
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";

async function migrateProducts() {
  console.log("Starting products migration...");

  const oldDb = await getOldDb();

  try {
    // Fetch all products from old database
    const [rows] = await oldDb.query("SELECT * FROM products ORDER BY id");
    const products = rows as any[];

    console.log(`Found ${products.length} products to migrate`);

    // Insert into new database using raw SQL to preserve IDs
    for (const p of products) {
      await prisma.$executeRaw`
        INSERT INTO products (id, group_id, name, description, price, price_eur, price_usd, period, date_created, last_modified)
        VALUES (${p.id}, ${p.group_id}, ${p.name}, ${p.description}, ${p.price}, ${p.price_eur}, ${p.price_usd}, ${p.period}, ${p.date_created}, ${p.last_modified})
      `;
    }

    console.log(`✓ Migrated ${products.length} products`);

    await recordMigration("products", products.length);
  } catch (error) {
    console.error("Error migrating products:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateProducts()
    .then(() => {
      console.log("Products migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateProducts };
