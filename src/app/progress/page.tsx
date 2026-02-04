import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ProgressPage() {
  const user = await requireAuth();

  // Get user's question history
  const recentQuestions = await prisma.userQuestion.findMany({
    where: {
      userId: user.id,
    },
    include: {
      question: {
        include: {
          studyArea: true,
        },
      },
    },
    orderBy: {
      dateCreated: "desc",
    },
    take: 20,
  });

  // Get breakdown by topic - we need to do this in two queries
  const topicStatsAll = await prisma.userQuestion.groupBy({
    by: ["type"],
    where: {
      userId: user.id,
    },
    _count: {
      id: true,
    },
  });

  const topicStatsCorrect = await prisma.userQuestion.groupBy({
    by: ["type"],
    where: {
      userId: user.id,
      correct: true,
    },
    _count: {
      id: true,
    },
  });

  // Merge the stats
  const topicStats = topicStatsAll.map((stat) => {
    const correctStat = topicStatsCorrect.find((s) => s.type === stat.type);
    return {
      type: stat.type,
      _count: stat._count,
      correctCount: correctStat?._count.id || 0,
    };
  });

  // Calculate accuracy
  const accuracy =
    user.questionsTotal > 0
      ? Math.round((user.questionsCorrect / user.questionsTotal) * 100)
      : 0;

  return (
    <main className="container">
      <article>
        <header>
          <h1>My Progress</h1>
          <p>Track your learning journey</p>
        </header>

        {/* Overall Stats */}
        <section>
          <h2>Overall Statistics</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                {user.questionsTotal}
              </h3>
              <small>Total Questions</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--ins-color)",
                }}
              >
                {user.questionsCorrect}
              </h3>
              <small>Correct</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--del-color)",
                }}
              >
                {user.questionsIncorrect}
              </h3>
              <small>Incorrect</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>{accuracy}%</h3>
              <small>Accuracy</small>
            </div>
          </div>
        </section>

        {/* Progress by Grade */}
        {user.progressTotal > 0 && (
          <section>
            <h2>Progress by Grade</h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((grade) => {
                const gradeField = `progress${grade}` as
                  | "progress1"
                  | "progress2"
                  | "progress3"
                  | "progress4"
                  | "progress5"
                  | "progress6"
                  | "progress7";
                const count = user[gradeField];

                if (count === 0) return null;

                return (
                  <div
                    key={grade}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      backgroundColor: "var(--card-background-color)",
                      borderRadius: "var(--border-radius)",
                    }}
                  >
                    <strong>Grade {grade}</strong>
                    <span>
                      {count} question{count !== 1 ? "s" : ""} answered correctly
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Question Type Breakdown */}
        {topicStats.length > 0 && (
          <section>
            <h2>By Question Type</h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {topicStats.map((stat) => {
                const correct = stat.correctCount;
                const total = stat._count.id;
                const percentage = Math.round((correct / total) * 100);

                return (
                  <div
                    key={stat.type}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      backgroundColor: "var(--card-background-color)",
                      borderRadius: "var(--border-radius)",
                    }}
                  >
                    <div>
                      <strong>
                        {stat.type === "TMCQ" && "Text Multiple Choice"}
                        {stat.type === "GMCQ" && "Graphical Multiple Choice"}
                        {stat.type === "DDI" && "Drag & Drop"}
                      </strong>
                      <div>
                        <small>
                          {correct} / {total} correct
                        </small>
                      </div>
                    </div>
                    <span>{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {recentQuestions.length > 0 && (
          <section>
            <h2>Recent Activity</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuestions.map((uq) => (
                    <tr key={uq.id}>
                      <td>
                        <small>
                          {new Date(uq.dateCreated).toLocaleDateString("en-GB")}
                        </small>
                      </td>
                      <td>{uq.question.studyArea.name}</td>
                      <td>
                        <small>{uq.type}</small>
                      </td>
                      <td>
                        {uq.correct ? (
                          <span style={{ color: "var(--ins-color)" }}>✓</span>
                        ) : (
                          <span style={{ color: "var(--del-color)" }}>✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {recentQuestions.length === 0 && (
          <section>
            <div role="alert">
              <p>No activity yet. Start practicing to track your progress!</p>
              <Link href="/practice" role="button">
                Start Practicing
              </Link>
            </div>
          </section>
        )}

        <footer>
          <Link href="/dashboard" role="button" className="secondary">
            Back to Dashboard
          </Link>
        </footer>
      </article>
    </main>
  );
}
