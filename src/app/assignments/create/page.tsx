import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { createAssignment } from "@/app/actions/assignments";

export default async function CreateAssignmentPage() {
  const user = await requireAuth();

  // Only org users can create assignments
  if (user.type !== "org" && user.type !== "admin") {
    redirect("/dashboard");
  }

  // Get study areas for topic selection
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

  // Get org's students
  const orgStudents = await prisma.orgStudentUser.findMany({
    where: {
      orgUserId: user.id,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          displayname: true,
        },
      },
    },
    orderBy: {
      student: {
        name: "asc",
      },
    },
  });

  return (
    <main className="container">
      <article style={{ maxWidth: "900px", margin: "2rem auto" }}>
        <header>
          <h1>Create Assignment</h1>
          <p>Set up a test assignment for your students</p>
        </header>

        <form action={createAssignment}>
          <section>
            <h2>Assignment Details</h2>

            <label>
              Assignment Name
              <input
                type="text"
                name="savename"
                placeholder="Week 4 Music Theory Test"
                required
              />
            </label>

            <label>
              Deadline (optional)
              <input type="datetime-local" name="dueDate" />
              <small>Students can still submit after this date</small>
            </label>
          </section>

          <section>
            <h2>Select Students</h2>
            {orgStudents.length === 0 ? (
              <div role="alert">
                <p>
                  You need to add students before creating assignments.{" "}
                  <Link href="/students">Add students</Link>
                </p>
              </div>
            ) : (
              <fieldset>
                <label>
                  <input
                    type="checkbox"
                    name="selectAll"
                    onChange={(e) => {
                      const checkboxes = document.querySelectorAll(
                        "input[name=\"students\"]"
                      ) as NodeListOf<HTMLInputElement>;
                      checkboxes.forEach((cb) => {
                        cb.checked = (e.target as HTMLInputElement).checked;
                      });
                    }}
                  />
                  Select All Students
                </label>
                <hr />
                {orgStudents.map((orgStudent) => (
                  <label key={orgStudent.student.id}>
                    <input
                      type="checkbox"
                      name="students"
                      value={orgStudent.student.id}
                    />
                    {orgStudent.student.name} (@{orgStudent.student.displayname}
                    )
                  </label>
                ))}
              </fieldset>
            )}
          </section>

          <section>
            <h2>Test Configuration</h2>

            <label>
              Topics
              <small>Select one or more topics</small>
            </label>
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
                <option value="">All Levels</option>
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
            </label>
          </section>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" disabled={orgStudents.length === 0}>
              Create Assignment
            </button>
            <Link href="/assignments" role="button" className="secondary">
              Cancel
            </Link>
          </div>
        </form>
      </article>
    </main>
  );
}
