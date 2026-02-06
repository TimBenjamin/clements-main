"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Submit an answer to a practice question
 */
export async function submitAnswer(formData: FormData): Promise<void> {
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

  const questionId = parseInt(formData.get("questionId") as string);
  const selectedAnswer = parseInt(formData.get("selectedAnswer") as string);

  if (isNaN(questionId) || isNaN(selectedAnswer)) {
    throw new Error("Invalid question or answer");
  }

  // Get the question
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const isCorrect = selectedAnswer === question.mcqCorrectAnswer;

  // Record the answer
  try {
    await prisma.userQuestion.create({
      data: {
        userId: user.id,
        questionId: question.id,
        selectedAnswer,
        correct: isCorrect,
        type: question.type,
        // Note: grade, topic1, topic2 will be NULL for practice questions
        // These are derived from StudyArea, not stored directly on Question
      },
    });

    // Update user's stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        questionsTotal: { increment: 1 },
        questionsCorrect: isCorrect ? { increment: 1 } : undefined,
        questionsIncorrect: !isCorrect ? { increment: 1 } : undefined,
        progressTotal: isCorrect ? { increment: 1 } : undefined,
      },
    });
  } catch (error) {
    console.error("Error recording answer:", error);
    throw new Error("Failed to record answer");
  }
}

/**
 * Starts a new practice test by creating a Test record and generating questions
 */
export async function startPracticeTest(formData: FormData) {
  try {
    const user = await requireAuth();

    // Parse form data
    const topics = formData.get("topics")?.toString() || "";
    const difficulties = formData.get("difficulties")?.toString() || "1|2|3|4|5";
    const numQuestions = parseInt(formData.get("numQuestions")?.toString() || "10");
    const timeLimitRequested = formData.get("timeLimit") === "1";
    const repeatPrevious = formData.get("repeatPrevious")?.toString() || "incorrect";

  // Map repeatPrevious to include flags
  let includePreviousCorrect = false;
  let includePreviousIncorrect = false;

  switch (repeatPrevious) {
    case "all":
      includePreviousCorrect = true;
      includePreviousIncorrect = true;
      break;
    case "incorrect":
      includePreviousIncorrect = true;
      break;
    case "none":
      // Both false
      break;
  }

  // Calculate time limit in seconds (similar to old system)
  // Roughly 90 seconds per question
  const timeLimit = timeLimitRequested ? numQuestions * 90 : 0;

  // Create the test record
  const test = await prisma.test.create({
    data: {
      userId: user.id,
      type: "custom",
      includePreviousCorrect,
      includePreviousIncorrect,
      topics,
      numQuestions,
      difficulties,
      timeLimitRequested,
      timeLimit,
      startTime: new Date(),
      currentQuestion: 0,
      complete: false,
      marks: 0,
      marksAvailable: 0,
      progress: 0,
    },
  });

  // Generate questions for this test
  await generateQuestions(test.id, {
    userId: user.id,
    topics: topics.split(",").map((id) => parseInt(id)),
    difficulties: difficulties.split("|").map((d) => parseInt(d)),
    numQuestions,
    includePreviousCorrect,
    includePreviousIncorrect,
  });

    // Store test ID in session
    const { getPracticeSession } = await import("@/lib/practice-session");
    const session = await getPracticeSession();
    session.testId = test.id;
    await session.save();

    // Redirect to practice page with resume action to start immediately
    redirect("/practice?action=resume");
  } catch (error) {
    console.error("Error in startPracticeTest:", error);
    throw error;
  }
}

interface GenerateQuestionsOptions {
  userId: number;
  topics: number[];
  difficulties: number[];
  numQuestions: number;
  includePreviousCorrect: boolean;
  includePreviousIncorrect: boolean;
}

/**
 * Generates questions for a test based on criteria
 * Logic ported from old PHP Test::GenerateQuestions()
 */
async function generateQuestions(
  testId: number,
  options: GenerateQuestionsOptions
) {
  const {
    userId,
    topics,
    difficulties,
    numQuestions,
    includePreviousCorrect,
    includePreviousIncorrect,
  } = options;

  // Get questions answered in past 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentAnswers = await prisma.userQuestion.findMany({
    where: {
      userId,
      dateCreated: {
        gte: threeMonthsAgo,
      },
    },
    select: {
      questionId: true,
      correct: true,
    },
  });

  // Build exclusion list based on include flags
  const excludeQuestionIds: number[] = [];

  for (const answer of recentAnswers) {
    if (answer.correct && !includePreviousCorrect) {
      excludeQuestionIds.push(answer.questionId);
    } else if (!answer.correct && !includePreviousIncorrect) {
      excludeQuestionIds.push(answer.questionId);
    }
  }

  // Get all incorrectly answered questions (any time)
  const incorrectAnswers = await prisma.userQuestion.findMany({
    where: {
      userId,
      correct: false,
    },
    select: {
      questionId: true,
    },
  });

  for (const answer of incorrectAnswers) {
    if (!includePreviousIncorrect && !excludeQuestionIds.includes(answer.questionId)) {
      excludeQuestionIds.push(answer.questionId);
    }
  }

  // Query for available questions
  const where = {
    studyAreaId: {
      in: topics,
    },
    difficulty: {
      in: difficulties,
    },
    ...(excludeQuestionIds.length > 0 && {
      id: {
        notIn: excludeQuestionIds,
      },
    }),
  };

  // Get questions ordered randomly
  // Note: Prisma doesn't have native RAND(), so we'll fetch all matching questions
  // and randomize in application code
  const allMatchingQuestions = await prisma.question.findMany({
    where,
    select: {
      id: true,
      extractId: true,
    },
  });

  // Shuffle questions
  const shuffled = allMatchingQuestions.sort(() => Math.random() - 0.5);

  // Select questions, avoiding duplicate extracts (optional enhancement)
  const selectedQuestionIds: number[] = [];
  const usedExtractIds = new Set<number>();

  for (const question of shuffled) {
    if (selectedQuestionIds.length >= numQuestions) {
      break;
    }

    // Optional: avoid reusing extracts (commented out for now as per old code)
    // if (question.extractId && usedExtractIds.has(question.extractId)) {
    //   continue;
    // }

    selectedQuestionIds.push(question.id);
    if (question.extractId) {
      usedExtractIds.add(question.extractId);
    }
  }

  // Update test with selected questions
  await prisma.test.update({
    where: { id: testId },
    data: {
      questions: selectedQuestionIds.join(","),
      marksAvailable: selectedQuestionIds.length,
    },
  });
}

/**
 * Submits an answer and moves to the next question
 */
export async function submitAndNext(formData: FormData) {
  const user = await requireAuth();
  const { getPracticeSession } = await import("@/lib/practice-session");
  const session = await getPracticeSession();

  if (!session.testId) {
    throw new Error("No active test");
  }

  const questionId = parseInt(formData.get("questionId")?.toString() || "0");
  const selectedAnswer = parseInt(formData.get("selectedAnswer")?.toString() || "0");

  if (!questionId || !selectedAnswer) {
    throw new Error("Invalid question or answer");
  }

  // Verify test belongs to user
  const test = await prisma.test.findUnique({
    where: { id: session.testId },
    select: { userId: true, questions: true, currentQuestion: true },
  });

  if (!test || test.userId !== user.id) {
    throw new Error("Test not found");
  }

  // Get the question to check correctness
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { mcqCorrectAnswer: true },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const correct = selectedAnswer === question.mcqCorrectAnswer;

  // Save or update the user's answer
  await prisma.userQuestion.upsert({
    where: {
      userId_questionId_testId: {
        userId: user.id,
        questionId,
        testId: session.testId,
      },
    },
    create: {
      userId: user.id,
      questionId,
      testId: session.testId,
      selectedAnswer,
      correct,
    },
    update: {
      selectedAnswer,
      correct,
    },
  });

  // Move to next question
  const questionIds = test.questions?.split(",") || [];
  const currentIndex = test.currentQuestion || 0;

  if (currentIndex < questionIds.length - 1) {
    await prisma.test.update({
      where: { id: session.testId },
      data: {
        currentQuestion: currentIndex + 1,
      },
    });
  }

  // Update test progress
  const answeredCount = await prisma.userQuestion.count({
    where: {
      userId: user.id,
      testId: session.testId,
    },
  });

  const correctCount = await prisma.userQuestion.count({
    where: {
      userId: user.id,
      testId: session.testId,
      correct: true,
    },
  });

  const progress = Math.round((answeredCount / questionIds.length) * 100);

  await prisma.test.update({
    where: { id: session.testId },
    data: {
      marks: correctCount,
      progress,
    },
  });

  // Redirect back to practice page
  redirect("/practice?action=resume");
}

/**
 * Moves to the previous question
 */
export async function moveToPrevious() {
  const user = await requireAuth();
  const { getPracticeSession } = await import("@/lib/practice-session");
  const session = await getPracticeSession();

  if (!session.testId) {
    throw new Error("No active test");
  }

  const test = await prisma.test.findUnique({
    where: { id: session.testId },
    select: { userId: true, currentQuestion: true },
  });

  if (!test || test.userId !== user.id) {
    throw new Error("Test not found");
  }

  const currentIndex = test.currentQuestion || 0;

  if (currentIndex > 0) {
    await prisma.test.update({
      where: { id: session.testId },
      data: {
        currentQuestion: currentIndex - 1,
      },
    });
  }

  redirect("/practice?action=resume");
}

/**
 * Finishes the test and saves all answers
 */
export async function finishTest() {
  const user = await requireAuth();
  const { getPracticeSession } = await import("@/lib/practice-session");
  const session = await getPracticeSession();

  if (!session.testId) {
    throw new Error("No active test");
  }

  const test = await prisma.test.findUnique({
    where: { id: session.testId },
    select: { userId: true },
  });

  if (!test || test.userId !== user.id) {
    throw new Error("Test not found");
  }

  // Mark test as complete
  await prisma.test.update({
    where: { id: session.testId },
    data: {
      complete: true,
      endTime: new Date(),
    },
  });

  const testId = session.testId;

  // Clear session
  session.testId = undefined;
  await session.save();

  // Redirect to results
  redirect(`/practice/results?tid=${testId}`);
}

/**
 * Exits the test without saving progress
 */
export async function exitTest() {
  const { getPracticeSession } = await import("@/lib/practice-session");
  const session = await getPracticeSession();

  if (session.testId) {
    // Clear session without marking test as complete
    session.testId = undefined;
    await session.save();
  }

  redirect("/practice");
}

/**
 * Clears the practice session (for starting a new test)
 */
export async function clearPracticeSession() {
  const { getPracticeSession } = await import("@/lib/practice-session");
  const session = await getPracticeSession();

  session.testId = undefined;
  await session.save();

  redirect("/practice");
}
