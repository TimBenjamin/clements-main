"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, generateSecureToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Request a password reset - generates token and sends email
 */
export async function requestPasswordReset(
  formData: FormData
): Promise<void> {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    redirect("/forgot-password?error=invalid");
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    // Don't reveal whether email exists - redirect to success anyway
    redirect("/forgot-password?success=sent");
  }

  // Generate reset token
  const resetToken = generateSecureToken();
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + 1); // Token valid for 1 hour

  try {
    // Store token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpiry,
      },
    });

    // Send email with reset link
    await sendPasswordResetEmail(email, user.name, resetToken);

    redirect("/forgot-password?success=sent");
  } catch (error) {
    console.error("Password reset request error:", error);
    redirect("/forgot-password?error=server");
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(formData: FormData): Promise<void> {
  const token = formData.get("token") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    redirect("/forgot-password");
  }

  // Validation
  if (!newPassword || newPassword.length < 6) {
    redirect(`/reset-password?token=${token}&error=password_length`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/reset-password?token=${token}&error=password_mismatch`);
  }

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpiry: {
        gte: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    redirect("/reset-password?error=invalid_token");
  }

  // Update password and clear reset token
  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    redirect("/login?success=password_reset");
  } catch (error) {
    console.error("Password reset error:", error);
    redirect(`/reset-password?token=${token}&error=server`);
  }
}
