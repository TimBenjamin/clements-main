import "dotenv/config";
import { createClient } from "contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

async function testContentful() {
  try {
    console.log("Testing Contentful connection...");

    const entries = await client.getEntries({
      content_type: "studyGuide",
      limit: 1,
    });

    console.log(`✓ Connected to space: ${process.env.CONTENTFUL_SPACE_ID}`);
    console.log(`✓ Found ${entries.total} study guide(s)`);

    if (entries.items.length > 0) {
      const firstGuide = entries.items[0];
      console.log(`✓ Sample guide: "${firstGuide.fields.title}"`);
    }

    console.log("\n✅ Contentful connection working!");
  } catch (error) {
    console.error("❌ Contentful test failed:", error);
  }
}

testContentful();
