import { redirect } from "next/navigation";
import { resetPassword } from "../actions/password-reset";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const error = params.error;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <main className="container">
      <article style={{ maxWidth: "500px", margin: "2rem auto" }}>
        <header>
          <h1>Set New Password</h1>
          <p>Enter your new password below</p>
        </header>

        {error === "invalid_token" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Invalid or expired reset link. Please request a new one.
          </div>
        )}

        {error === "password_mismatch" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Passwords do not match
          </div>
        )}

        {error === "password_length" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Password must be at least 6 characters
          </div>
        )}

        {error === "server" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            An error occurred. Please try again.
          </div>
        )}

        <form action={resetPassword}>
          <input type="hidden" name="token" value={token} />

          <label>
            New Password
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button type="submit">Reset Password</button>
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
