"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  deleteSession,
  hasActiveSubscription,
} from "@/lib/auth";
import { UserType } from "@prisma/client";

/**
 * Register a new individual user
 */
export async function register(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const displayname = formData.get("displayname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!name || name.length < 2) {
    redirect("/register?error=name");
  }

  if (!displayname || displayname.length < 3) {
    redirect("/register?error=displayname");
  }

  // Display name validation: alphanumeric and hyphens only
  if (!/^[a-zA-Z0-9-]+$/.test(displayname)) {
    redirect("/register?error=displayname_invalid");
  }

  // Check display name uniqueness
  const existingDisplayname = await prisma.user.findUnique({
    where: { displayname },
  });

  if (existingDisplayname) {
    redirect("/register?error=displayname_taken");
  }

  // Email validation
  if (!email || !email.includes("@")) {
    redirect("/register?error=email");
  }

  // Check email uniqueness
  const existingEmail = await prisma.user.findFirst({
    where: { email },
  });

  if (existingEmail) {
    redirect("/register?error=email_taken");
  }

  // Password validation
  if (!password || password.length < 6) {
    redirect("/register?error=password");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=password_mismatch");
  }

  // Create user
  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        type: "ind" as UserType,
        name,
        displayname,
        email,
        username: email, // Username same as email
        password: hashedPassword,
      },
    });

    // Create session and set cookie
    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId);

    redirect("/dashboard");
  } catch (error) {
    console.error("Registration error:", error);
    redirect("/register?error=server");
  }
}

/**
 * Login with email and password
 */
export async function login(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=invalid");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    redirect("/login?error=invalid");
  }

  // Check subscription for ind/stu users
  if (
    (user.type === "ind" || user.type === "stu") &&
    !hasActiveSubscription(user)
  ) {
    redirect("/login?error=expired");
  }

  // Update successful logins counter
  await prisma.user.update({
    where: { id: user.id },
    data: {
      successfulLogins: { increment: 1 },
    },
  });

  // Create session
  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  redirect("/dashboard");
}

/**
 * Logout current user
 */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
