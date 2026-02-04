import { requestPasswordReset } from "../actions/password-reset";
import Link from "next/link";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const success = params.success;
  const error = params.error;

  return (
    <main className="container">
      <article style={{ maxWidth: "500px", margin: "2rem auto" }}>
        <header>
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a reset link</p>
        </header>

        {success === "sent" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Password reset link sent! Check your email.
          </div>
        )}

        {error === "not_found" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            No account found with that email address
          </div>
        )}

        {error === "server" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            An error occurred. Please try again later.
          </div>
        )}

        <form action={requestPasswordReset}>
          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </label>

          <button type="submit">Send Reset Link</button>
        </form>

        <footer>
          <p>
            <Link href="/login">Back to Login</Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
