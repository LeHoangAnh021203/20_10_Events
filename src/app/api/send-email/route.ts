import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

interface EmailData {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  receiverName?: string;
}

// Email service using SMTP server (Nodemailer)
async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("⚠️ SMTP configuration missing. Email will be logged only.");
      console.log("📧 Email would be sent:", {
        to: data.to,
        subject: data.subject,
        from: smtpFrom || "noreply@facewashfox.com",
      });
      return { success: true }; // Return success in dev mode
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587"),
      secure: parseInt(smtpPort || "587") === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Additional options for better compatibility
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log("✅ SMTP server connection verified");
    } catch (verifyError) {
      console.error("❌ SMTP verification failed:", verifyError);
      throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : "Unknown error"}`);
    }

    // Send email
    const mailOptions = {
      from: `"Face Wash Fox" <${smtpFrom || smtpUser}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      to: data.to,
      subject: data.subject,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, senderName, receiverName } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, html, senderName, receiverName });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/send-email error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}

