import { redirect } from "next/navigation";
import { register } from "../actions/auth";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function RegisterPage() {
  // If already logged in, redirect to dashboard
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="container">
      <article style={{ maxWidth: "600px", margin: "2rem auto" }}>
        <header>
          <h1>Create an Account</h1>
          <p>Join Clements Theory to start learning</p>
        </header>

        <form action={register}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              placeholder="Your full name"
              required
              minLength={2}
            />
          </label>

          <label>
            Display Name
            <input
              type="text"
              name="displayname"
              placeholder="Choose a unique display name"
              required
              minLength={3}
              pattern="[a-zA-Z0-9-]+"
            />
            <small>
              Letters, numbers, and hyphens only. This will be visible to other
              users.
            </small>
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Choose a secure password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <small>At least 6 characters</small>
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button type="submit">Create Account</button>
        </form>

        <footer>
          <p>
            Already have an account? <Link href="/login">Log in here</Link>
          </p>
          <p>
            <small>
              By creating an account, you'll need to subscribe to access the
              platform.
            </small>
          </p>
        </footer>
      </article>
    </main>
  );
}
