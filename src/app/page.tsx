import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <main className="container">
        <section>
          <header>
            <h1>Welcome back, {user.displayname}!</h1>
          </header>
          <Link href="/dashboard" role="button">
            Go to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section>
        <header>
          <h1>
            Music Theory: Study, Practise and Pass Grade 5 Theory with Clements
            Theory
          </h1>
          <h2>
            <Link href="/study/">Study</Link> and{" "}
            <Link href="/practice/">practise</Link>{" "}
            <strong>music theory</strong> online
          </h2>
        </header>
      </section>

      <div className="grid">
        <section>
          <h3>
            <strong>Clements Theory</strong> is specially designed for anyone
            studying or teaching music theory and provides a clear,
            comprehensive, and cost effective interactive environment where
            students will gain a greater understanding and appreciation of music
            theory.
          </h3>
          <ul>
            <li>Associated Board (ABRSM)</li>
            <li>Trinity College London</li>
            <li>GCSE Music</li>
            <li>AS and A2 Music</li>
          </ul>
          <Link href="/subscribe/" role="button">
            Get Instant Access
          </Link>
        </section>

        <section>
          <p>
            <em>
              [Screenshot carousel would go here - showing My Performance, Study
              Guides, Practice Questions]
            </em>
          </p>
        </section>
      </div>

      <hr />

      <div className="grid">
        <section>
          <blockquote>
            <p>
              "We really like Clements Theory, especially being able to track
              student progress. We've found it invaluable and I would highly
              recommend it."
            </p>
            <footer>
              — Ben Dowsett
              <br />
              <small>
                Head of Music, The Sixth Form College, Farnborough
              </small>
            </footer>
          </blockquote>

          <blockquote>
            <p>
              "Can I say how fantastic I think your website is? The exercises
              are excellent and the whole display is extremely user friendly."
            </p>
            <footer>
              — Paula
              <br />
              <small>
                Clements Theory user and recent AB Grade 5 Theory candidate
              </small>
            </footer>
          </blockquote>
        </section>

        <section>
          <h3>
            Clements Theory consists of <strong>study guides</strong> and{" "}
            <strong>practice questions</strong> organised by difficulty,
            starting from the very beginning and working up through five levels
            to <strong>Grade 5 Theory</strong> standard.
          </h3>
          <ul>
            <li>
              Over <strong>7,000</strong> interactive practice questions
            </li>
            <li>
              <strong>80</strong> comprehensive and easy-to-follow study guides
            </li>
            <li>
              Step-by-step to post-<strong>Grade 5 Theory</strong> level
            </li>
            <li>Help from experts always available online</li>
            <li>
              Handy interactive progress charts to show where you are strong and
              which topics need more work
            </li>
          </ul>
        </section>
      </div>

      <section>
        <p>
          Clements Theory is suitable for any music student, and is particularly
          useful if you are studying to take either a music theory exam (such as{" "}
          <strong>Associated Board Grade 5 Theory</strong>) or if you are
          studying <strong>GCSE</strong> or <strong>A Level</strong> music.
        </p>
      </section>

      <hr />

      <section>
        <h3>
          Extra features are available{" "}
          <strong>for schools and music services</strong>, making Clements
          Theory an excellent{" "}
          <strong>elearning resource for music theory</strong>
        </h3>
      </section>

      <div className="grid">
        <section>
          <ul>
            <li>
              <strong>Set assignments</strong> for your students
            </li>
            <li>
              <strong>Automatic marking</strong> for instant feedback
            </li>
            <li>
              <strong>Track progress</strong> in all topics and between students
            </li>
            <li>
              Use the resources in "classroom mode" for{" "}
              <strong>single sessions</strong>
            </li>
          </ul>
        </section>

        <section>
          <blockquote>
            <p>
              "Clements Theory has been well used and has been a great resource
              to have in the department! Thank you."
            </p>
            <footer>
              — Rachel Setterfield
              <br />
              <small>Department of Music, Wellington College</small>
            </footer>
          </blockquote>
        </section>
      </div>

      <section>
        <p>
          The extensive interactive content available in{" "}
          <strong>Clements Theory</strong>, backed by expert online support for
          your students, will perfectly complement the music theory teaching in
          your school or music service. Flexible, re-useable and discounted
          multi-user licenses are available with simple online control over your
          students' accounts.
        </p>
      </section>

      <hr />

      <section>
        <h2>Five reasons why you should use Clements:</h2>

        <h3>1. Step-by-step Grade 5 Theory study guides</h3>
        <p>
          Step-by-step online study guides prepared by skilled musicians cover
          all key music theory topics.
        </p>

        <h3>2. Grade 5 Theory practice questions</h3>
        <p>
          Students can sit mock exams. With access to thousands of practice
          music theory questions (including many specially selected for{" "}
          <strong>Grade 5 Theory</strong>) choose to focus on problem areas or
          tackle random selections across all key topics.
        </p>

        <h3>3. Track your progress</h3>
        <p>
          Real-time charts enable you to <strong>track improvements</strong> in
          all six key topic areas as well as monitoring overall progress.
        </p>

        <h3>4. Help and Support</h3>
        <p>
          Contact <strong>Clements Theory</strong> at any time, or use the
          informative <strong>Q&amp;A</strong> area where you can submit
          questions and receive helpful answers from our team of experts and
          from other music theory students.
        </p>

        <h3>5. The cost effective answer to music theory tuition</h3>
        <p>
          Exceptional resources, simple to use online accounts and discounted
          multi-user licences make <strong>Clements Theory</strong> the most
          comprehensive e-learning music theory tuition service available.
        </p>

        <Link href="/subscribe/" role="button">
          Get Instant Access
        </Link>
      </section>
    </main>
  );
}
