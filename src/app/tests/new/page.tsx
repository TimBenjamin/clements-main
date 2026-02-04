import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { createTest } from "@/app/actions/tests";

export default async function NewTestPage() {
  await requireAuth();

  // Get all study areas
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
      <article style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <header>
          <h1>Create a New Test</h1>
          <p>Configure your test settings</p>
        </header>

        <form action={createTest}>
          <section>
            <h2>Topics</h2>
            <p>
              <small>Select one or more topics to include in your test</small>
            </p>

            <fieldset>
              {studyAreas.map((area) => (
                <label key={area.id}>
                  <input
                    type="checkbox"
                    name="topics"
                    value={area.id}
                    defaultChecked
                  />
                  {area.name} ({area._count.questions} questions)
                </label>
              ))}
            </fieldset>
          </section>

          <section>
            <h2>Test Settings</h2>

            <label>
              Number of Questions
              <input
                type="number"
                name="numQuestions"
                min="5"
                max="50"
                defaultValue="10"
                required
              />
              <small>Between 5 and 50 questions</small>
            </label>

            <label>
              Difficulty
              <select name="difficulty" required>
                <option value="all">All Levels</option>
                <option value="easy">Easy (1-2)</option>
                <option value="intermediate">Intermediate (3-4)</option>
                <option value="hard">Hard (4-5)</option>
              </select>
            </label>

            <label>
              <input type="checkbox" name="timeLimitRequested" />
              Set a time limit
            </label>

            <label>
              Time Limit (minutes)
              <input
                type="number"
                name="timeLimit"
                min="5"
                max="120"
                defaultValue="30"
              />
              <small>Leave blank for no time limit</small>
            </label>
          </section>

          <section>
            <h2>Question Selection</h2>

            <label>
              <input type="checkbox" name="includePreviousCorrect" />
              Include questions you've answered correctly before
            </label>

            <label>
              <input type="checkbox" name="includePreviousIncorrect" />
              Include questions you've answered incorrectly before
            </label>

            <p>
              <small>
                If both are unchecked, only new questions will be included
              </small>
            </p>
          </section>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit">Start Test</button>
            <Link href="/dashboard" role="button" className="secondary">
              Cancel
            </Link>
          </div>
        </form>
      </article>
    </main>
  );
}
