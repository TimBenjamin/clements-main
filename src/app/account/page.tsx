import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateProfile, changePassword } from "../actions/account";
import Link from "next/link";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const success = params.success;
  const error = params.error;

  return (
    <main className="container">
      <article style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <header>
          <h1>Account Settings</h1>
          <p>Manage your profile and preferences</p>
        </header>

        {success === "profile" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Profile updated successfully
          </div>
        )}

        {success === "password" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Password changed successfully
          </div>
        )}

        {success === "email" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Email updated successfully
          </div>
        )}

        {error === "password_mismatch" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            New passwords do not match
          </div>
        )}

        {error === "password_incorrect" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Current password is incorrect
          </div>
        )}

        {error === "password_length" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Password must be at least 6 characters
          </div>
        )}

        {error === "email_taken" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            This email is already in use
          </div>
        )}

        {error === "displayname_taken" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            This display name is already taken
          </div>
        )}

        {error === "displayname_invalid" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Display name can only contain letters, numbers, and hyphens
          </div>
        )}

        <section>
          <h2>Profile Information</h2>
          <form action={updateProfile}>
            <label>
              Full Name
              <input
                type="text"
                name="name"
                defaultValue={user.name}
                required
                minLength={2}
              />
            </label>

            <label>
              Display Name
              <input
                type="text"
                name="displayname"
                defaultValue={user.displayname}
                required
                minLength={3}
                pattern="[a-zA-Z0-9-]+"
                title="Only letters, numbers, and hyphens allowed"
              />
              <small>
                This is your unique username. Only letters, numbers, and hyphens
                allowed.
              </small>
            </label>

            <label>
              Email Address
              <input
                type="email"
                name="email"
                defaultValue={user.email}
                required
              />
            </label>

            <button type="submit">Update Profile</button>
          </form>
        </section>

        <section>
          <h2>Change Password</h2>
          <form action={changePassword}>
            <label>
              Current Password
              <input
                type="password"
                name="currentPassword"
                required
                autoComplete="current-password"
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                name="newPassword"
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
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>

            <button type="submit">Change Password</button>
          </form>
        </section>

        <section>
          <h2>Account Information</h2>
          <dl>
            <dt>Account Type</dt>
            <dd>
              {user.type === "ind" && "Individual"}
              {user.type === "org" && "Organization"}
              {user.type === "stu" && "Student"}
              {user.type === "admin" && "Administrator"}
            </dd>

            {(user.type === "ind" || user.type === "stu") && (
              <>
                <dt>Subscription Status</dt>
                <dd>
                  {user.expiry && user.expiry > new Date() ? (
                    <>
                      Active until{" "}
                      {new Date(user.expiry).toLocaleDateString("en-GB")}
                    </>
                  ) : (
                    <>
                      Expired or inactive.{" "}
                      <Link href="/subscribe">Subscribe now</Link>
                    </>
                  )}
                </dd>
              </>
            )}

            <dt>Member Since</dt>
            <dd>{new Date(user.dateCreated).toLocaleDateString("en-GB")}</dd>

            <dt>Successful Logins</dt>
            <dd>{user.successfulLogins}</dd>
          </dl>
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
