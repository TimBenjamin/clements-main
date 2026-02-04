import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function TestsPage() {
  const user = await requireAuth();

  // Get user's completed tests
  const tests = await prisma.test.findMany({
    where: {
      userId: user.id,
      complete: true,
    },
    orderBy: {
      endTime: "desc",
    },
    take: 20,
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>My Tests</h1>
          <p>View your test history and results</p>
        </header>

        <section>
          <Link href="/tests/new" role="button">
            Take a New Test
          </Link>
        </section>

        {tests.length === 0 ? (
          <section>
            <div role="alert">
              <p>You haven't completed any tests yet.</p>
              <Link href="/tests/new" role="button">
                Take Your First Test
              </Link>
            </div>
          </section>
        ) : (
          <section>
            <h2>Recent Tests</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => {
                    const percentage = test.marksAvailable
                      ? Math.round(
                          ((test.marks || 0) / test.marksAvailable) * 100
                        )
                      : 0;

                    return (
                      <tr key={test.id}>
                        <td>
                          <small>
                            {test.endTime?.toLocaleDateString("en-GB")}
                          </small>
                        </td>
                        <td>{test.numQuestions}</td>
                        <td>
                          {test.marks} / {test.marksAvailable}
                        </td>
                        <td>
                          <strong
                            style={{
                              color:
                                percentage >= 80
                                  ? "var(--ins-color)"
                                  : percentage >= 60
                                    ? "inherit"
                                    : "var(--del-color)",
                            }}
                          >
                            {percentage}%
                          </strong>
                        </td>
                        <td>
                          <Link
                            href={`/tests/${test.id}/results`}
                            role="button"
                            className="outline"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            View Results
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
