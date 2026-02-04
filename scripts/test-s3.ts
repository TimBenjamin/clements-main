import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function testS3() {
  try {
    console.log("Testing S3 upload...");
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: "test/hello.txt",
        Body: "Hello from Clements Music Theory!",
        ContentType: "text/plain",
      })
    );
    console.log("✓ Upload successful");

    console.log("Testing S3 list...");
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: "test/",
      })
    );
    console.log(`✓ Found ${response.Contents?.length || 0} objects`);

    console.log("\n✅ S3 connection working!");
  } catch (error) {
    console.error("❌ S3 test failed:", error);
  }
}

testS3();
