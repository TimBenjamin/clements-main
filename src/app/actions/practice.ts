"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
