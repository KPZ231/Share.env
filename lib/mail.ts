import "server-only";
import nodemailer from "nodemailer";

/**
 * Gmail SMTP relay for auth emails, replacing Supabase's default mailer
 * (its shared sender is rate-limited to a couple of emails/hour — fine for
 * a demo project, not for real signups). Only ever call from server code.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `share.env <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
