import nodemailer from 'nodemailer';

export interface SendEmailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  mode: 'live' | 'trace';
  message: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    console.warn(`[Email] Missing EMAIL or EMAIL_PASSWORD. Trace mode fallback for ${to}: "${subject}"`);
    return {
      success: true,
      mode: 'trace',
      message: `[TRACE] Email would send to ${to}: "${subject}"`,
    };
  }

  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);

    if (!host) {
      return {
        success: false,
        mode: 'live',
        message: 'SMTP host is missing.',
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `TalentBridge <${process.env.EMAIL}>`,
      to,
      subject,
      html,
      text: text ?? stripHtml(html ?? ''),
    });

    return {
      success: true,
      mode: 'live',
      message: `Email sent to ${to}: "${subject}"`,
    };
  } catch (error) {
    console.error(`[Email] Send failed for ${to}: "${subject}"`, error);
    return {
      success: false,
      mode: 'live',
      message: `Email failed for ${to}: "${subject}"`,
    };
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
