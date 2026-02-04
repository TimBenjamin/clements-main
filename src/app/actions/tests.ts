"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Create a new test based on user configuration
 */
export async function createTest(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check subscription for ind/stu users
  if (
    (user.type === "ind" || user.type === "stu") &&
    (!user.expiry || user.expiry < new Date())
  ) {
    redirect("/subscribe");
  }

  // Get form data
  const topics = formData.getAll("topics").map((t) => parseInt(t as string));
  const numQuestions = parseInt(formData.get("numQuestions") as string);
  const difficulty = formData.get("difficulty") as string;
  const timeLimitRequested = formData.get("timeLimitRequested") === "on";
  const timeLimit = timeLimitRequested
    ? parseInt(formData.get("timeLimit") as string) * 60
    : null; // Convert to seconds
  const includePreviousCorrect =
    formData.get("includePreviousCorrect") === "on";
  const includePreviousIncorrect =
    formData.get("includePreviousIncorrect") === "on";

  if (!topics.length || !numQuestions || numQuestions < 5 || numQuestions > 50) {
    redirect("/tests/new?error=invalid");
  }

  // Build query for questions
  interface WhereClause {
    studyAreaId: { in: number[] };
    difficulty?: { lte?: number; gte?: number };
    id?: { notIn: number[] };
  }

  const whereClause: WhereClause = {
    studyAreaId: {
      in: topics,
    },
  };

  // Add difficulty filter
  if (difficulty === "easy") {
    whereClause.difficulty = { lte: 2 };
  } else if (difficulty === "intermediate") {
    whereClause.difficulty = { gte: 3, lte: 4 };
  } else if (difficulty === "hard") {
    whereClause.difficulty = { gte: 4 };
  }

  // If not including previous questions, exclude them
  if (!includePreviousCorrect || !includePreviousIncorrect) {
    const previousQuestions = await prisma.userQuestion.findMany({
      where: {
        userId: user.id,
        correct: includePreviousCorrect
          ? undefined
          : includePreviousIncorrect
            ? false
            : undefined,
      },
      select: {
        questionId: true,
      },
    });

    if (previousQuestions.length > 0) {
      whereClause.id = {
        notIn: previousQuestions.map((pq) => pq.questionId),
      };
    }
  }

  // Get random questions
  const allMatchingQuestions = await prisma.question.findMany({
    where: whereClause,
    select: {
      id: true,
    },
  });

  if (allMatchingQuestions.length === 0) {
    redirect("/tests/new?error=no_questions");
  }

  // Shuffle and take requested number
  const shuffled = allMatchingQuestions.sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(
    0,
    Math.min(numQuestions, shuffled.length)
  );

  // Create test
  try {
    const test = await prisma.test.create({
      data: {
        userId: user.id,
        type: "custom",
        includePreviousCorrect,
        includePreviousIncorrect,
        topics: topics.join(","),
        numQuestions: selectedQuestions.length,
        difficulty,
        timeLimitRequested,
        timeLimit,
        questions: selectedQuestions.map((q) => q.id).join(","),
        answers: "", // Will be filled as user answers
        currentQuestion: 0,
        startTime: new Date(),
        complete: false,
        progress: 0,
        marks: 0,
        marksAvailable: selectedQuestions.length, // 1 mark per question for now
      },
    });

    // Update user's test count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        testsCount: { increment: 1 },
      },
    });

    redirect(`/tests/${test.id}`);
  } catch (error) {
    console.error("Test creation error:", error);
    redirect("/tests/new?error=server");
  }
}

/**
 * Submit an answer for a test question
 */
export async function submitTestAnswer(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const testId = parseInt(formData.get("testId") as string);
  const selectedAnswer = parseInt(formData.get("selectedAnswer") as string);

  if (isNaN(testId) || isNaN(selectedAnswer)) {
    throw new Error("Invalid test or answer");
  }

  // Get the test
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test || test.userId !== user.id) {
    throw new Error("Test not found or access denied");
  }

  if (test.complete) {
    redirect(`/tests/${testId}/results`);
  }

  // Get current question
  const questionIds = test.questions?.split(",").map((id) => parseInt(id)) || [];
  const currentQuestionId = questionIds[test.currentQuestion];

  if (!currentQuestionId) {
    throw new Error("Invalid question index");
  }

  // Get the question to check answer
  const question = await prisma.question.findUnique({
    where: { id: currentQuestionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const isCorrect = selectedAnswer === question.mcqCorrectAnswer;

  // Record the answer in UserQuestion
  await prisma.userQuestion.create({
    data: {
      userId: user.id,
      questionId: currentQuestionId,
      testId: test.id,
      selectedAnswer,
      correct: isCorrect,
      type: question.type,
    },
  });

  // Update test answers and progress
  const currentAnswers = test.answers ? test.answers.split(",") : [];
  currentAnswers[test.currentQuestion] = selectedAnswer.toString();

  const nextQuestionIndex = test.currentQuestion + 1;
  const isComplete = nextQuestionIndex >= questionIds.length;

  await prisma.test.update({
    where: { id: testId },
    data: {
      answers: currentAnswers.join(","),
      currentQuestion: nextQuestionIndex,
      progress: Math.round((nextQuestionIndex / questionIds.length) * 100),
      marks: isCorrect ? { increment: 1 } : undefined,
      complete: isComplete,
      endTime: isComplete ? new Date() : undefined,
    },
  });

  // Update user stats
  await prisma.user.update({
    where: { id: user.id },
    data: {
      questionsTotal: { increment: 1 },
      questionsCorrect: isCorrect ? { increment: 1 } : undefined,
      questionsIncorrect: !isCorrect ? { increment: 1 } : undefined,
      progressTotal: isCorrect ? { increment: 1 } : undefined,
    },
  });

  // Redirect to next question or results
  if (isComplete) {
    redirect(`/tests/${testId}/results`);
  } else {
    redirect(`/tests/${testId}?q=${nextQuestionIndex}`);
  }
}
