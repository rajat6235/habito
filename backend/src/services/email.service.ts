import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  private async send(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
    } catch (err) {
      logger.error('Email send failed', { to: payload.to, subject: payload.subject, err });
    }
  }

  async sendVerification(to: string, token: string, firstName: string): Promise<void> {
    const url = `${env.CLIENT_URL}/verify-email/${token}`;
    await this.send({
      to,
      subject: 'Verify your Habito account',
      html: `
        <h2>Welcome to Habito, ${firstName}!</h2>
        <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
        <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Verify Email
        </a>
        <p>Or copy this URL: ${url}</p>
      `,
      text: `Verify your email: ${url}`,
    });
  }

  async sendPasswordReset(to: string, token: string, firstName: string): Promise<void> {
    const url = `${env.CLIENT_URL}/reset-password/${token}`;
    await this.send({
      to,
      subject: 'Reset your Habito password',
      html: `
        <h2>Hi ${firstName},</h2>
        <p>You requested a password reset. Click below to set a new password. This link expires in 1 hour.</p>
        <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p>If you didn't request this, ignore this email.</p>
      `,
      text: `Reset your password: ${url}`,
    });
  }

  async sendWeeklyRecap(to: string, firstName: string, stats: Record<string, unknown>): Promise<void> {
    await this.send({
      to,
      subject: `Your Habito Weekly Recap 📊`,
      html: `<h2>Hey ${firstName}!</h2><p>Here's your week: ${JSON.stringify(stats)}</p>`,
      text: `Your weekly recap: ${JSON.stringify(stats)}`,
    });
  }
}
