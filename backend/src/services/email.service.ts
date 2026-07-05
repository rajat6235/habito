import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY || 're_placeholder');
  }

  private async send(payload: EmailPayload): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      });
      if (error) {
        logger.error('Resend email failed', { to: payload.to, subject: payload.subject, error });
      }
    } catch (err) {
      logger.error('Email send failed', { to: payload.to, subject: payload.subject, err });
    }
  }

  async sendVerification(to: string, token: string, firstName: string): Promise<void> {
    const url = `${env.CLIENT_URL}/verify-email/${token}`;
    await this.send({
      to,
      subject: 'Verify your Habito account',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">Habito</h1>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:600">Welcome, ${firstName}!</h2>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6">Click the button below to verify your email address and activate your Habito account. This link expires in <strong>24 hours</strong>.</p>
          <a href="${url}" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px">Verify my email</a>
          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px">Or copy this link:<br><a href="${url}" style="color:#6366f1;word-break:break-all">${url}</a></p>
        </td></tr>
        <tr><td style="border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#94a3b8;font-size:12px">If you didn't create a Habito account, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `Welcome to Habito, ${firstName}!\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.`,
    });
  }

  async sendPasswordReset(to: string, token: string, firstName: string): Promise<void> {
    const url = `${env.CLIENT_URL}/reset-password/${token}`;
    await this.send({
      to,
      subject: 'Reset your Habito password',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">Habito</h1>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:600">Hi ${firstName},</h2>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6">You requested a password reset. Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${url}" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px">Reset password</a>
          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px">If you didn't request a reset, ignore this email — your password won't change.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `Hi ${firstName},\n\nReset your password: ${url}\n\nThis link expires in 1 hour.`,
    });
  }

  async sendWeeklyRecap(to: string, firstName: string, stats: Record<string, unknown>): Promise<void> {
    await this.send({
      to,
      subject: `Your Habito Weekly Recap`,
      html: `<h2>Hey ${firstName}!</h2><p>Here's your week: ${JSON.stringify(stats)}</p>`,
      text: `Your weekly recap: ${JSON.stringify(stats)}`,
    });
  }
}
