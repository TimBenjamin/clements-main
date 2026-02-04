-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('ind', 'org', 'stu', 'admin');

-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('TMCQ', 'GMCQ', 'DDI');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('GBP', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "voucher_status" AS ENUM ('pending', 'active', 'inactive');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "type" "user_type" NOT NULL DEFAULT 'ind',
    "name" VARCHAR(255) NOT NULL,
    "displayname" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "mobile" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "postcode" VARCHAR(255),
    "country" VARCHAR(255),
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "exam_date" DATE,
    "last_action" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" VARCHAR(255),
    "licenses" INTEGER NOT NULL DEFAULT 0,
    "student_funding_code" VARCHAR(16),
    "expiry" TIMESTAMP,
    "stripe_customer_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "site_admin" BOOLEAN NOT NULL DEFAULT false,
    "forum_admin" BOOLEAN NOT NULL DEFAULT false,
    "question_admin" BOOLEAN NOT NULL DEFAULT false,
    "blog_admin" BOOLEAN NOT NULL DEFAULT false,
    "welcome_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "initial_checkout_complete" BOOLEAN NOT NULL DEFAULT false,
    "show_welcome_box" BOOLEAN NOT NULL DEFAULT true,
    "show_subscription_renewal_box" BOOLEAN NOT NULL DEFAULT true,
    "where_did_you_hear" VARCHAR(255),
    "where_did_you_hear_other" VARCHAR(255),
    "progress_total" INTEGER NOT NULL DEFAULT 0,
    "progress_1" INTEGER NOT NULL DEFAULT 0,
    "progress_2" INTEGER NOT NULL DEFAULT 0,
    "progress_3" INTEGER NOT NULL DEFAULT 0,
    "progress_4" INTEGER NOT NULL DEFAULT 0,
    "progress_5" INTEGER NOT NULL DEFAULT 0,
    "progress_6" INTEGER NOT NULL DEFAULT 0,
    "progress_7" INTEGER NOT NULL DEFAULT 0,
    "questions_total" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "questions_incorrect" INTEGER NOT NULL DEFAULT 0,
    "tests_count" INTEGER NOT NULL DEFAULT 0,
    "successful_logins" INTEGER NOT NULL DEFAULT 0,
    "allow_overdue_assignments" BOOLEAN NOT NULL DEFAULT false,
    "allow_overdue_assignments_period_days" INTEGER NOT NULL DEFAULT 0,
    "suppress_teacher_assignment_emails" BOOLEAN NOT NULL DEFAULT false,
    "suppress_student_assignment_emails" BOOLEAN NOT NULL DEFAULT false,
    "suppress_student_welcome_emails" BOOLEAN NOT NULL DEFAULT false,
    "expired_assignments_student_visibility_duration_days" INTEGER NOT NULL DEFAULT 30,
    "complete_assignments_student_visibility_duration_days" INTEGER NOT NULL DEFAULT 30,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "last_action" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deleted_users" (
    "id" SERIAL NOT NULL,
    "original_id" INTEGER,
    "type" "user_type" NOT NULL DEFAULT 'ind',
    "name" VARCHAR(255),
    "displayname" VARCHAR(255),
    "phone" VARCHAR(255),
    "mobile" VARCHAR(255),
    "email" VARCHAR(255),
    "address" TEXT,
    "postcode" VARCHAR(255),
    "country" VARCHAR(255),
    "username" VARCHAR(255),
    "password" VARCHAR(255),
    "last_action" TIMESTAMP(3),
    "licenses" INTEGER NOT NULL DEFAULT 0,
    "expiry" TIMESTAMP,
    "original_date_created" TIMESTAMP(3),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_stu_users" (
    "id" SERIAL NOT NULL,
    "org_user_id" INTEGER NOT NULL,
    "stu_user_id" INTEGER NOT NULL,
    "org_group_id" INTEGER,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_stu_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_groups" (
    "id" SERIAL NOT NULL,
    "org_user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "colour" VARCHAR(16),
    "sort_order" INTEGER,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_stu_groups" (
    "id" SERIAL NOT NULL,
    "org_group_id" INTEGER NOT NULL,
    "stu_user_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_stu_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_areas" (
    "id" SERIAL NOT NULL,
    "position" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(255),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "extract_id" INTEGER,
    "study_area_id" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "type" "question_type" NOT NULL DEFAULT 'TMCQ',
    "custom_img_filename" VARCHAR(255),
    "custom_img_s3_url" VARCHAR(500),
    "custom_img_s3_key" VARCHAR(500),
    "custom_img_title" VARCHAR(255),
    "mcq_option_1_text" VARCHAR(255),
    "mcq_option_2_text" VARCHAR(255),
    "mcq_option_3_text" VARCHAR(255),
    "mcq_option_4_text" VARCHAR(255),
    "mcq_option_5_text" VARCHAR(255),
    "mcq_option_1_img" VARCHAR(255),
    "mcq_option_2_img" VARCHAR(255),
    "mcq_option_3_img" VARCHAR(255),
    "mcq_option_4_img" VARCHAR(255),
    "mcq_option_5_img" VARCHAR(255),
    "mcq_option_1_img_id" INTEGER NOT NULL DEFAULT -1,
    "mcq_option_2_img_id" INTEGER NOT NULL DEFAULT -1,
    "mcq_option_3_img_id" INTEGER NOT NULL DEFAULT -1,
    "mcq_option_4_img_id" INTEGER NOT NULL DEFAULT -1,
    "mcq_option_5_img_id" INTEGER NOT NULL DEFAULT -1,
    "mcq_option_1_s3_url" VARCHAR(500),
    "mcq_option_2_s3_url" VARCHAR(500),
    "mcq_option_3_s3_url" VARCHAR(500),
    "mcq_option_4_s3_url" VARCHAR(500),
    "mcq_option_5_s3_url" VARCHAR(500),
    "mcq_correct_answer" INTEGER,
    "ddi_1_label" VARCHAR(255),
    "ddi_1_correct_answer" VARCHAR(255),
    "ddi_2_label" VARCHAR(255),
    "ddi_2_correct_answer" VARCHAR(255),
    "question_text" TEXT,
    "study_notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "last_modified_by" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ddi_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "list" VARCHAR(1) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ddi_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inline_images" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "s3Url" VARCHAR(500),
    "s3Key" VARCHAR(500),
    "title" VARCHAR(255),
    "category" VARCHAR(255),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inline_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracts" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "audio_s3_url" VARCHAR(500),
    "audio_s3_key" VARCHAR(500),
    "title" VARCHAR(255),
    "composer" VARCHAR(255),
    "duration_seconds" INTEGER,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musical_terms" (
    "id" SERIAL NOT NULL,
    "grade" INTEGER,
    "term" VARCHAR(255),
    "alternatives" VARCHAR(255),
    "meaning" TEXT,
    "language" VARCHAR(255),
    "notes" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "musical_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assignment_id" INTEGER,
    "type" VARCHAR(64),
    "include_previous_correct" BOOLEAN NOT NULL DEFAULT false,
    "include_previous_incorrect" BOOLEAN NOT NULL DEFAULT false,
    "topics" VARCHAR(255),
    "num_questions" INTEGER,
    "difficulty" VARCHAR(16),
    "min_difficulty" INTEGER,
    "max_difficulty" INTEGER,
    "difficulties" VARCHAR(45),
    "time_limit_requested" BOOLEAN NOT NULL DEFAULT false,
    "time_limit" INTEGER,
    "questions" TEXT,
    "answers" TEXT,
    "current_question" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "marks" INTEGER,
    "marks_available" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_questions" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "savename" VARCHAR(255),
    "questions" VARCHAR(255),
    "topics" VARCHAR(255),
    "min_difficulty" INTEGER,
    "max_difficulty" INTEGER,
    "difficulties" VARCHAR(45),
    "time_limit_requested" BOOLEAN NOT NULL DEFAULT false,
    "reuse_old_questions" BOOLEAN NOT NULL DEFAULT false,
    "type" VARCHAR(20) NOT NULL DEFAULT 'internal',
    "user_id" INTEGER NOT NULL,
    "study_guide" VARCHAR(255),
    "deadline" TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_date" TIMESTAMP(3),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_assignments" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "test_id" INTEGER,
    "deadline" TIMESTAMP,
    "date_completed" TIMESTAMP(3),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_data" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "progress_total" INTEGER NOT NULL DEFAULT 0,
    "progress_1" INTEGER NOT NULL DEFAULT 0,
    "progress_2" INTEGER NOT NULL DEFAULT 0,
    "progress_3" INTEGER NOT NULL DEFAULT 0,
    "progress_4" INTEGER NOT NULL DEFAULT 0,
    "progress_5" INTEGER NOT NULL DEFAULT 0,
    "progress_6" INTEGER NOT NULL DEFAULT 0,
    "progress_7" INTEGER NOT NULL DEFAULT 0,
    "date_created" DATE NOT NULL,

    CONSTRAINT "progress_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER DEFAULT 0,
    "name" VARCHAR(255),
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" INTEGER NOT NULL DEFAULT 0,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartitems" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "voucher_id" INTEGER DEFAULT 0,
    "price" DOUBLE PRECISION,
    "currency" "currency" NOT NULL DEFAULT 'GBP',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartitems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "paypal_transaction_id" VARCHAR(255),
    "paypal_payment_status" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_invoice_id" VARCHAR(255),
    "total" DOUBLE PRECISION,
    "currency" "currency" NOT NULL DEFAULT 'GBP',
    "transaction_date" TIMESTAMP(3),
    "notes" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" "currency" NOT NULL DEFAULT 'GBP',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "code" VARCHAR(255),
    "expiry" DATE,
    "status" "voucher_status" NOT NULL DEFAULT 'inactive',
    "max_usage" INTEGER NOT NULL DEFAULT 0,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "commission_percent" INTEGER NOT NULL DEFAULT 0,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "voucher_id" INTEGER,
    "transaction_id" INTEGER,
    "date_used" TIMESTAMP(3),
    "referral_due" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referral_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "voucher_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "voucher_id" INTEGER DEFAULT 0,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "date_granted" TIMESTAMP(3),
    "prefer_reward" BOOLEAN NOT NULL DEFAULT false,
    "teach" BOOLEAN NOT NULL DEFAULT false,
    "students_per_year" VARCHAR(255),
    "instruments_taught" TEXT,
    "teach_in_school" BOOLEAN NOT NULL DEFAULT false,
    "teach_in_private" BOOLEAN NOT NULL DEFAULT false,
    "teach_theory" BOOLEAN NOT NULL DEFAULT false,
    "teach_one_to_one" BOOLEAN NOT NULL DEFAULT false,
    "teach_in_classes" BOOLEAN NOT NULL DEFAULT false,
    "num_years_teaching_music" INTEGER DEFAULT 0,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_invitations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "voucher_id" INTEGER DEFAULT 0,
    "student_name" VARCHAR(255),
    "student_email" VARCHAR(255),
    "personal_message" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "user_id_to" INTEGER,
    "addressTo" VARCHAR(255),
    "addressFrom" VARCHAR(255),
    "subject" VARCHAR(255),
    "body_text" TEXT,
    "body_html" TEXT,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "send_result" BOOLEAN NOT NULL DEFAULT false,
    "send_error" VARCHAR(255),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logger" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER DEFAULT 0,
    "event_type" VARCHAR(255),
    "event_code" INTEGER,
    "event_data" VARCHAR(255),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_displayname_key" ON "users"("displayname");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_type_idx" ON "users"("type");

-- CreateIndex
CREATE INDEX "users_expiry_idx" ON "users"("expiry");

-- CreateIndex
CREATE INDEX "users_session_id_idx" ON "users"("session_id");

-- CreateIndex
CREATE INDEX "users_sessions_session_id_idx" ON "users_sessions"("session_id");

-- CreateIndex
CREATE INDEX "users_sessions_user_id_idx" ON "users_sessions"("user_id");

-- CreateIndex
CREATE INDEX "org_stu_users_org_user_id_idx" ON "org_stu_users"("org_user_id");

-- CreateIndex
CREATE INDEX "org_stu_users_stu_user_id_idx" ON "org_stu_users"("stu_user_id");

-- CreateIndex
CREATE INDEX "org_groups_org_user_id_idx" ON "org_groups"("org_user_id");

-- CreateIndex
CREATE INDEX "org_stu_groups_org_group_id_idx" ON "org_stu_groups"("org_group_id");

-- CreateIndex
CREATE INDEX "org_stu_groups_stu_user_id_idx" ON "org_stu_groups"("stu_user_id");

-- CreateIndex
CREATE INDEX "questions_study_area_id_idx" ON "questions"("study_area_id");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_extract_id_idx" ON "questions"("extract_id");

-- CreateIndex
CREATE INDEX "ddi_options_question_id_idx" ON "ddi_options"("question_id");

-- CreateIndex
CREATE INDEX "inline_images_category_idx" ON "inline_images"("category");

-- CreateIndex
CREATE INDEX "musical_terms_grade_idx" ON "musical_terms"("grade");

-- CreateIndex
CREATE INDEX "tests_user_id_idx" ON "tests"("user_id");

-- CreateIndex
CREATE INDEX "tests_assignment_id_idx" ON "tests"("assignment_id");

-- CreateIndex
CREATE INDEX "tests_complete_idx" ON "tests"("complete");

-- CreateIndex
CREATE INDEX "users_questions_user_id_idx" ON "users_questions"("user_id");

-- CreateIndex
CREATE INDEX "users_questions_question_id_idx" ON "users_questions"("question_id");

-- CreateIndex
CREATE INDEX "users_questions_test_id_idx" ON "users_questions"("test_id");

-- CreateIndex
CREATE INDEX "users_questions_correct_idx" ON "users_questions"("correct");

-- CreateIndex
CREATE INDEX "assignments_user_id_idx" ON "assignments"("user_id");

-- CreateIndex
CREATE INDEX "assignments_archived_idx" ON "assignments"("archived");

-- CreateIndex
CREATE INDEX "users_assignments_assignment_id_idx" ON "users_assignments"("assignment_id");

-- CreateIndex
CREATE INDEX "users_assignments_user_id_idx" ON "users_assignments"("user_id");

-- CreateIndex
CREATE INDEX "users_assignments_complete_idx" ON "users_assignments"("complete");

-- CreateIndex
CREATE INDEX "progress_data_user_id_idx" ON "progress_data"("user_id");

-- CreateIndex
CREATE INDEX "progress_data_date_created_idx" ON "progress_data"("date_created");

-- CreateIndex
CREATE INDEX "cartitems_user_id_idx" ON "cartitems"("user_id");

-- CreateIndex
CREATE INDEX "cartitems_product_id_idx" ON "cartitems"("product_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_stripe_payment_intent_id_idx" ON "transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "transaction_items_transaction_id_idx" ON "transaction_items"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_items_user_id_idx" ON "transaction_items"("user_id");

-- CreateIndex
CREATE INDEX "vouchers_code_idx" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_status_idx" ON "vouchers"("status");

-- CreateIndex
CREATE INDEX "voucher_usage_user_id_idx" ON "voucher_usage"("user_id");

-- CreateIndex
CREATE INDEX "voucher_usage_voucher_id_idx" ON "voucher_usage"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_applications_user_id_idx" ON "voucher_applications"("user_id");

-- CreateIndex
CREATE INDEX "voucher_invitations_user_id_idx" ON "voucher_invitations"("user_id");

-- CreateIndex
CREATE INDEX "emails_user_id_to_idx" ON "emails"("user_id_to");

-- CreateIndex
CREATE INDEX "logger_user_id_idx" ON "logger"("user_id");

-- CreateIndex
CREATE INDEX "logger_event_type_idx" ON "logger"("event_type");

-- AddForeignKey
ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_stu_users" ADD CONSTRAINT "org_stu_users_org_user_id_fkey" FOREIGN KEY ("org_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_stu_users" ADD CONSTRAINT "org_stu_users_stu_user_id_fkey" FOREIGN KEY ("stu_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_groups" ADD CONSTRAINT "org_groups_org_user_id_fkey" FOREIGN KEY ("org_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_stu_groups" ADD CONSTRAINT "org_stu_groups_org_group_id_fkey" FOREIGN KEY ("org_group_id") REFERENCES "org_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_stu_groups" ADD CONSTRAINT "org_stu_groups_stu_user_id_fkey" FOREIGN KEY ("stu_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_study_area_id_fkey" FOREIGN KEY ("study_area_id") REFERENCES "study_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_extract_id_fkey" FOREIGN KEY ("extract_id") REFERENCES "extracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ddi_options" ADD CONSTRAINT "ddi_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_questions" ADD CONSTRAINT "users_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_questions" ADD CONSTRAINT "users_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_questions" ADD CONSTRAINT "users_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_assignments" ADD CONSTRAINT "users_assignments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_assignments" ADD CONSTRAINT "users_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_assignments" ADD CONSTRAINT "users_assignments_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_data" ADD CONSTRAINT "progress_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartitems" ADD CONSTRAINT "cartitems_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartitems" ADD CONSTRAINT "cartitems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartitems" ADD CONSTRAINT "cartitems_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_applications" ADD CONSTRAINT "voucher_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_applications" ADD CONSTRAINT "voucher_applications_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_invitations" ADD CONSTRAINT "voucher_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_invitations" ADD CONSTRAINT "voucher_invitations_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
