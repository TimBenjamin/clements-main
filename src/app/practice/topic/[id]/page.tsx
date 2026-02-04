import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { PracticeQuestion } from "@/components/PracticeQuestion";

export default async function TopicPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const { q: questionIdParam } = await searchParams;

  // Check subscription for ind/stu users
  if (
    (user.type === "ind" || user.type === "stu") &&
    (!user.expiry || user.expiry < new Date())
  ) {
    redirect("/subscribe");
  }

  const studyAreaId = parseInt(id);

  if (isNaN(studyAreaId)) {
    notFound();
  }

  // Get study area
  const studyArea = await prisma.studyArea.findUnique({
    where: { id: studyAreaId },
  });

  if (!studyArea) {
    notFound();
  }

  // Get all questions for this study area
  const allQuestions = await prisma.question.findMany({
    where: {
      studyAreaId,
    },
    select: {
      id: true,
    },
  });

  if (allQuestions.length === 0) {
    return (
      <main className="container">
        <article>
          <header>
            <h1>{studyArea.name}</h1>
          </header>

          <div role="alert">
            <p>No questions available for this topic yet.</p>
          </div>

          <footer>
            <Link href="/practice" role="button" className="secondary">
              Back to Practice
            </Link>
          </footer>
        </article>
      </main>
    );
  }

  // Determine which question to show
  let currentQuestion;

  if (questionIdParam) {
    // Load specific question by ID
    currentQuestion = await prisma.question.findFirst({
      where: {
        id: parseInt(questionIdParam),
        studyAreaId,
      },
      include: {
        ddiOptions: true,
        extract: true,
      },
    });

    if (!currentQuestion) {
      // Question not found - redirect to random question
      currentQuestion = await prisma.question.findFirst({
        where: {
          studyAreaId,
        },
        include: {
          ddiOptions: true,
          extract: true,
        },
        orderBy: {
          id: "asc",
        },
      });
    }
  } else {
    // Get user's progress to find unanswered questions
    const userProgress = await prisma.userQuestion.findMany({
      where: {
        userId: user.id,
        question: {
          studyAreaId,
        },
      },
      select: {
        questionId: true,
        correct: true,
      },
    });

    // Filter to questions not yet answered correctly
    const answeredCorrectly = new Set(
      userProgress.filter((p) => p.correct).map((p) => p.questionId)
    );

    const unansweredQuestions = allQuestions.filter(
      (q) => !answeredCorrectly.has(q.id)
    );

    // Pick a random unanswered question, or any random question if all are answered
    const questionsToChooseFrom =
      unansweredQuestions.length > 0 ? unansweredQuestions : allQuestions;

    const randomQuestion =
      questionsToChooseFrom[
        Math.floor(Math.random() * questionsToChooseFrom.length)
      ];

    if (!randomQuestion) {
      notFound();
    }

    currentQuestion = await prisma.question.findUnique({
      where: {
        id: randomQuestion.id,
      },
      include: {
        ddiOptions: true,
        extract: true,
      },
    });
  }

  if (!currentQuestion) {
    notFound();
  }

  // Get user's previous answer for this question
  const userAnswer = await prisma.userQuestion.findFirst({
    where: {
      userId: user.id,
      questionId: currentQuestion.id,
    },
    orderBy: {
      dateCreated: "desc",
    },
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>{studyArea.name}</h1>
          <p>
            Question{" "}
            {allQuestions.findIndex((q) => q.id === currentQuestion!.id) + 1} of{" "}
            {allQuestions.length}
          </p>
        </header>

        <PracticeQuestion
          question={currentQuestion}
          userAnswer={userAnswer}
          studyAreaId={studyAreaId}
          studyAreaName={studyArea.name}
        />

        <footer>
          <Link href="/practice" role="button" className="secondary">
            Back to Practice
          </Link>
        </footer>
      </article>
    </main>
  );
}
