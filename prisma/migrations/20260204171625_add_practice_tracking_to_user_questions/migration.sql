-- AlterTable
ALTER TABLE "users_questions" ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "selected_answer" INTEGER,
ADD COLUMN     "topic1" VARCHAR(255),
ADD COLUMN     "topic2" VARCHAR(255),
ADD COLUMN     "type" "question_type",
ALTER COLUMN "test_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "users_questions_grade_idx" ON "users_questions"("grade");

-- CreateIndex
CREATE INDEX "users_questions_topic1_idx" ON "users_questions"("topic1");
