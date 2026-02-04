/**
 * Email sending utilities
 *
 * TODO: Implement with a proper email service like Resend or SendGrid
 * For now, this logs emails in development and will need configuration for production
 */

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@clementsmusic.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;

  const emailContent = {
    from: FROM_EMAIL,
    to,
    subject: "Reset Your Password - Clements Music Theory",
    text: `
Hi ${name},

You requested to reset your password for Clements Music Theory.

Click the link below to set a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
Clements Music Theory Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Reset Your Password</h1>

    <p>Hi ${name},</p>

    <p>You requested to reset your password for Clements Music Theory.</p>

    <p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
        Reset Password
      </a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #7f8c8d; word-break: break-all;">${resetUrl}</p>

    <p><strong>This link will expire in 1 hour.</strong></p>

    <p>If you didn't request this, you can safely ignore this email.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="color: #7f8c8d; font-size: 14px;">
      Best regards,<br>
      Clements Music Theory Team
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  // In development, log the email instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email would be sent:");
    console.log(JSON.stringify(emailContent, null, 2));
    console.log("\n🔗 Password reset link:", resetUrl);
    return;
  }

  // TODO: Implement actual email sending
  // Example with Resend:
  // const { Resend } = await import('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send(emailContent);

  throw new Error(
    "Email sending not implemented for production. Configure an email service."
  );
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  const emailContent = {
    from: FROM_EMAIL,
    to,
    subject: "Welcome to Clements Music Theory",
    text: `
Hi ${name},

Welcome to Clements Music Theory!

Your account has been created successfully. You can now log in and start practicing music theory.

Get started: ${SITE_URL}/dashboard

Best regards,
Clements Music Theory Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Clements Music Theory</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Welcome to Clements Music Theory!</h1>

    <p>Hi ${name},</p>

    <p>Your account has been created successfully. You can now log in and start practicing music theory.</p>

    <p>
      <a href="${SITE_URL}/dashboard" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
        Get Started
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="color: #7f8c8d; font-size: 14px;">
      Best regards,<br>
      Clements Music Theory Team
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email would be sent:");
    console.log(JSON.stringify(emailContent, null, 2));
    return;
  }

  // TODO: Implement actual email sending
  throw new Error(
    "Email sending not implemented for production. Configure an email service."
  );
}
