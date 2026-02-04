-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_expiry" TIMESTAMP(3),
ADD COLUMN     "reset_token" VARCHAR(255);
