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

    // Insert into new database
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          groupId: p.group_id,
          name: p.name,
          description: p.description,
          price: p.price,
          priceEur: p.price_eur,
          priceUsd: p.price_usd,
          period: p.period,
          dateCreated: p.date_created,
          lastModified: p.last_modified,
        },
        create: {
          id: p.id,
          groupId: p.group_id,
          name: p.name,
          description: p.description,
          price: p.price,
          priceEur: p.price_eur,
          priceUsd: p.price_usd,
          period: p.period,
          dateCreated: p.date_created,
          lastModified: p.last_modified,
        },
      });
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
