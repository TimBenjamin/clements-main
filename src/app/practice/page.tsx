import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PracticePage() {
  const user = await requireAuth();

  // Get all study areas with question counts
  const studyAreas = await prisma.studyArea.findMany({
    orderBy: {
      position: "asc",
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>Practice Questions</h1>
          <p>Select a topic to start practicing</p>
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

        <section>
          <h2>Topics</h2>
          {studyAreas.length === 0 ? (
            <p role="alert">No topics available yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              {studyAreas.map((area) => (
                <Link
                  key={area.id}
                  href={`/practice/topic/${area.id}`}
                  role="button"
                  className="outline"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <strong>{area.name}</strong>
                    {area.description && (
                      <div>
                        <small style={{ opacity: 0.8 }}>
                          {area.description}
                        </small>
                      </div>
                    )}
                  </div>
                  <small style={{ opacity: 0.7 }}>
                    {area._count.questions} question
                    {area._count.questions !== 1 ? "s" : ""}
                  </small>
                </Link>
              ))}
            </div>
          )}
        </section>

        <footer>
          <Link href="/dashboard" role="button" className="secondary">
            Back to Dashboard
          </Link>
        </footer>
      </article>
    </main>
  );
}
