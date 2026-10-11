import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || true,
        auth: { user, pass }
      });
      this.logger.log(`Nodemailer configured successfully with user: ${user}`);
    } else {
      this.logger.warn(
        'Nodemailer credentials not detected (GMAIL_USER, GMAIL_APP_PASSWORD or SMTP_USER, SMTP_PASS). Live OTPs will be logged and returned for preview until configured.'
      );
    }
  }

  async sendOtpEmail(to: string, otp: string, userName?: string): Promise<{ delivered: boolean; info?: string }> {
    const subject = `Your Verification Code: ${otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Campus Attendance System</div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Identity & Security Verification</p>
        </div>
        <div style="background: #131d31; border-radius: 12px; padding: 24px; border: 1px solid #334155; text-align: center;">
          <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 8px;">Hello${userName ? ' ' + userName : ''},</p>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Use the following One-Time Password (OTP) to verify your account or reset your password:</p>
          <div style="letter-spacing: 8px; font-size: 34px; font-weight: 800; color: #38bdf8; background: #0b1120; padding: 14px 20px; border-radius: 10px; display: inline-block; font-family: monospace; border: 1px dashed #0284c7;">
            ${otp}
          </div>
          <p style="color: #f87171; font-size: 13px; margin-top: 18px; font-weight: 600;">⏳ This code expires in 5 minutes.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center; line-height: 1.5;">
          If you did not request this verification code, you can safely ignore this email. Never share this code with anyone.
        </p>
      </div>
    `;

    if (this.transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"Campus Attendance" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
        await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text: `Your One-Time Password (OTP) is ${otp}. It expires in 5 minutes.`,
          html
        });
        this.logger.log(`Nodemailer successfully delivered OTP to ${to}`);
        return { delivered: true, info: `OTP sent to ${to}` };
      } catch (err: any) {
        this.logger.error(`Nodemailer delivery error to ${to}: ${err.message}`);
        return { delivered: false, info: err.message };
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL] To: ${to} | OTP: ${otp} | Expires in 5 minutes`);
      return { delivered: false, info: 'Simulated OTP (SMTP credentials not yet configured in .env)' };
    }
  }
}
