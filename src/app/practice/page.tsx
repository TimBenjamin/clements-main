import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PracticeSetupForm } from "@/components/PracticeSetupForm";
import { PracticeTestQuestion } from "@/components/PracticeTestQuestion";
import { getPracticeSession } from "@/lib/practice-session";

export default async function PracticePage() {
  const user = await requireAuth();
  const session = await getPracticeSession();

  // Check if there's an active test in session
  if (session.testId) {
    // Fetch the test from database
    const test = await prisma.test.findUnique({
      where: { id: session.testId },
    });

    // If test not found or doesn't belong to user, clear session
    if (!test || test.userId !== user.id) {
      session.testId = undefined;
      await session.save();
    } else if (test.complete) {
      // If test is complete, redirect to results
      redirect(`/practice/results?tid=${test.id}`);
    } else {
      // Show the current question
      return renderTestQuestion(test, user.id);
    }
  }

  // No active test - show setup form
  return renderSetupForm(user);
}

async function renderTestQuestion(test: any, userId: number) {
  // Get question IDs
  const questionIds = test.questions?.split(",").map((id: string) => parseInt(id)) || [];

  if (questionIds.length === 0) {
    // Invalid test, clear session
    const session = await getPracticeSession();
    session.testId = undefined;
    await session.save();
    redirect("/practice");
  }

  const currentIndex = test.currentQuestion || 0;
  const currentQuestionId = questionIds[currentIndex];

  // Get current question
  const question = await prisma.question.findUnique({
    where: { id: currentQuestionId },
    include: {
      ddiOptions: true,
      extract: true,
      studyArea: true,
    },
  });

  if (!question) {
    redirect("/practice");
  }

  // Get user's answers for this test
  const testAnswers = await prisma.userQuestion.findMany({
    where: {
      userId,
      testId: test.id,
    },
    select: {
      questionId: true,
      selectedAnswer: true,
    },
  });

  const answersMap = new Map(
    testAnswers.map((a) => [a.questionId, a.selectedAnswer])
  );

  // Calculate time remaining
  let timeRemaining: number | null = null;
  if (test.timeLimitRequested && test.timeLimit && test.startTime) {
    const elapsedSeconds = Math.floor(
      (Date.now() - test.startTime.getTime()) / 1000
    );
    timeRemaining = Math.max(0, test.timeLimit - elapsedSeconds);

    // If time is up, complete the test
    if (timeRemaining === 0) {
      await prisma.test.update({
        where: { id: test.id },
        data: {
          complete: true,
          endTime: new Date(),
        },
      });
      redirect(`/practice/results?tid=${test.id}`);
    }
  }

  // Calculate progress percentage
  const answeredCount = testAnswers.length;
  const progressPercent = Math.round((answeredCount / questionIds.length) * 100);

  return (
    <main className="container">
      <article>
        <header>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1>Practice Test</h1>
              <p>
                Question {currentIndex + 1} of {questionIds.length}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {timeRemaining !== null && (
                <div>
                  <strong>Time Remaining:</strong>
                  <div style={{ fontSize: "1.5rem", color: timeRemaining < 300 ? "var(--del-color)" : "inherit" }}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Progress:</strong> {progressPercent}%
              </div>
            </div>
          </div>

          <progress value={progressPercent} max="100" />
        </header>

        <PracticeTestQuestion
          question={question}
          questionIndex={currentIndex}
          totalQuestions={questionIds.length}
          existingAnswer={answersMap.get(question.id) || null}
        />

        <footer style={{ marginTop: "2rem" }}>
          <details>
            <summary>Question Details</summary>
            <dl>
              <dt>Question ID</dt>
              <dd>{question.id}</dd>

              <dt>Topic</dt>
              <dd>{question.studyArea.name}</dd>

              <dt>Difficulty</dt>
              <dd>{question.difficulty} / 5</dd>

              <dt>Questions Answered</dt>
              <dd>
                {answeredCount} / {questionIds.length}
              </dd>
            </dl>
          </details>
        </footer>
      </article>
    </main>
  );
}

async function renderSetupForm(user: any) {
  // Get all study areas (excluding Composition which was never populated)
  const studyAreas = await prisma.studyArea.findMany({
    where: {
      name: {
        not: "Composition",
      },
    },
    orderBy: {
      position: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>Practice Questions</h1>
        </header>

        {/* Show subscription notice for ind/stu users without active subscription */}
        {(user.type === "ind" || user.type === "stu") &&
          (!user.expiry || user.expiry < new Date()) && (
            <div
              role="alert"
              style={{ backgroundColor: "var(--secondary-focus)" }}
            >
              <strong>Subscription Required</strong>
              <p>
                You need an active subscription to practice questions.{" "}
                <Link href="/subscribe">Subscribe now</Link> to get unlimited
                access.
              </p>
            </div>
          )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
          gap: "2rem"
        }}>
          {/* Left column: Instructions */}
          <section>
            <h3>Practice Questions</h3>
            <p>
              Simply choose one or more topics from the tool on this page, along with a
              difficulty level and the number of questions to answer to begin a test.
            </p>

            <h3>Difficulty</h3>
            <p>
              The difficulty levels range from <b>level 1</b> up to <b>level 5</b>. These
              correspond to Trinity College and Associated Board music theory exams, and
              are designed to be excellent practice for those exams. They also correspond
              to the different levels in the Clements Theory study guides.
            </p>

            <h3>Time Limit</h3>
            <p>
              Optionally, you can select a time limit. This is designed to provide a
              realistic challenge for those preparing for a music theory exam. If you can
              consistently beat the clock at a difficulty level, you should be well
              prepared for the corresponding grade exam!
            </p>

            <h3>How it works</h3>
            <p>Inside the test there are buttons which work as follows:</p>
            <ul>
              <li>
                <b>Next</b> - Submit your answer and proceed to the next question
              </li>
              <li>
                <b>Previous</b> - Return to the previous question
              </li>
              <li>
                <b>Finish</b> - End the test and save your answers
              </li>
              <li>
                <b>Exit</b> - End the test without saving your answers
              </li>
            </ul>
            <p>
              Therefore, if you want to save your answers, make sure you use the{" "}
              <b>Finish</b> button, or alternatively if you want to quit without saving,
              just use the <b>Exit</b> button.
            </p>

            <h3>Progress Points</h3>
            <p>
              All the questions you answer (whether correctly or not!) will count towards
              your <strong>Progress Score</strong>. You can find this on your personal
              home page together with the full history of your <strong>Practice Question
              Performance</strong>.
            </p>
          </section>

          {/* Right column: Setup form */}
          <section>
            <div
              style={{
                backgroundColor: "var(--card-background-color)",
                padding: "2rem",
                borderRadius: "var(--border-radius)",
              }}
            >
              <h4>Select your practice question options to begin...</h4>
              <PracticeSetupForm studyAreas={studyAreas} />
            </div>
          </section>
        </div>

        <footer style={{ marginTop: "2rem" }}>
          <Link href="/dashboard" role="button" className="secondary">
            Back to Dashboard
          </Link>
        </footer>
      </article>
    </main>
  );
}
