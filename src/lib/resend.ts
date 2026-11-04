import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
}

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || 'Sevaya Studio <info@sevaya-studio.com>';
const DEFAULT_REPLY_TO =
  process.env.RESEND_REPLY_TO || 'info@sevaya-studio.com';

/**
 * Strips carriage returns and newlines to prevent email header injection (CWE-93).
 */
function sanitizeHeader(val?: string): string {
  if (!val) return '';
  return val.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Basic RFC 5322 compliant email validator.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sends an email via Resend with:
 * - Anti-header injection sanitization
 * - Email format validation
 * - Automatic retry with exponential backoff on transient network or 429 errors
 * - Plain text fallback for spam score optimization
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  reply_to = DEFAULT_REPLY_TO,
}: SendEmailOptions) {
  const cleanSubject = sanitizeHeader(subject);
  const cleanFrom = sanitizeHeader(from);
  const cleanReplyTo = sanitizeHeader(reply_to);

  // Validate recipients
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients
    .map((r) => sanitizeHeader(r).toLowerCase())
    .filter(isValidEmail);

  if (validRecipients.length === 0) {
    const errorMsg = 'No valid recipient email address provided.';
    console.warn('[Resend Validation Error]:', errorMsg, { rawTo: to });
    return { success: false, error: new Error(errorMsg) };
  }

  // Generate plain text from HTML if not explicitly provided (helps email deliverability & anti-spam)
  const plainText =
    text ||
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Retry with exponential backoff (max 2 attempts)
  const MAX_RETRIES = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const emailPayload: any = {
        from: cleanFrom,
        to: validRecipients.length === 1 ? validRecipients[0] : validRecipients,
        subject: cleanSubject,
        html,
        text: plainText,
      };
      if (cleanReplyTo) {
        emailPayload.replyTo = cleanReplyTo;
      }

      const data = await resend.emails.send(emailPayload);

      return { success: true, data };
    } catch (error: any) {
      lastError = error;
      const status = error?.statusCode || error?.status;
      const isRateLimited = status === 429;
      const isNetworkError =
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed');

      if (attempt < MAX_RETRIES && (isRateLimited || isNetworkError)) {
        const delayMs = attempt * 1000;
        console.warn(
          `[Resend Transient Error] Attempt ${attempt} failed, retrying in ${delayMs}ms...`,
          error?.message
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }
  }

  console.error('Failed to send email via Resend after retries:', lastError);
  return { success: false, error: lastError };
}
