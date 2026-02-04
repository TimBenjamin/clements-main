"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, getCurrentUser } from "@/lib/auth";

/**
 * Update user profile information
 */
export async function updateProfile(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const displayname = formData.get("displayname") as string;
  const email = formData.get("email") as string;

  // Validation
  if (!name || name.length < 2) {
    redirect("/account?error=name");
  }

  if (!displayname || displayname.length < 3) {
    redirect("/account?error=displayname");
  }

  // Display name validation: alphanumeric and hyphens only
  if (!/^[a-zA-Z0-9-]+$/.test(displayname)) {
    redirect("/account?error=displayname_invalid");
  }

  // Check display name uniqueness (exclude current user)
  if (displayname !== user.displayname) {
    const existingDisplayname = await prisma.user.findUnique({
      where: { displayname },
    });

    if (existingDisplayname) {
      redirect("/account?error=displayname_taken");
    }
  }

  // Email validation
  if (!email || !email.includes("@")) {
    redirect("/account?error=email");
  }

  // Check email uniqueness (exclude current user)
  if (email !== user.email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
    });

    if (existingEmail) {
      redirect("/account?error=email_taken");
    }
  }

  // Update user
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        displayname,
        email,
        username: email, // Keep username in sync with email
      },
    });

    redirect("/account?success=profile");
  } catch (error) {
    console.error("Profile update error:", error);
    redirect("/account?error=server");
  }
}

/**
 * Change user password
 */
export async function changePassword(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/account?error=missing");
  }

  if (newPassword.length < 6) {
    redirect("/account?error=password_length");
  }

  if (newPassword !== confirmPassword) {
    redirect("/account?error=password_mismatch");
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);

  if (!isValid) {
    redirect("/account?error=password_incorrect");
  }

  // Update password
  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    redirect("/account?success=password");
  } catch (error) {
    console.error("Password change error:", error);
    redirect("/account?error=server");
  }
}

/**
 * Update email address (separate from profile to allow for email verification in future)
 */
export async function updateEmail(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const email = formData.get("email") as string;

  // Email validation
  if (!email || !email.includes("@")) {
    redirect("/account?error=email");
  }

  // Check email uniqueness
  const existingEmail = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
  });

  if (existingEmail) {
    redirect("/account?error=email_taken");
  }

  // Update email
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        username: email, // Keep username in sync with email
      },
    });

    redirect("/account?success=email");
  } catch (error) {
    console.error("Email update error:", error);
    redirect("/account?error=server");
  }
}
