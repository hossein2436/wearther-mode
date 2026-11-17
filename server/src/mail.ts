import nodemailer from 'nodemailer';

export interface Mailer {
  sendCode(email: string, code: string): Promise<void>;
}

/**
 * Sends login codes by SMTP when SMTP_URL is set (e.g. smtps://user:pass@smtp.example.com:465).
 * Without SMTP the code is printed to the server log, so you can still sign in while setting up:
 *   docker compose logs api | grep "login code"
 */
export function createMailer(smtpUrl: string | undefined, from: string, log: (msg: string) => void): Mailer {
  if (!smtpUrl) {
    return {
      async sendCode(email, code) {
        log(`[no SMTP configured] login code for ${email}: ${code}`);
      },
    };
  }
  const transport = nodemailer.createTransport(smtpUrl);
  return {
    async sendCode(email, code) {
      await transport.sendMail({
        from,
        to: email,
        subject: `${code} is your Wearther Mode code`,
        text: `Your code is ${code}\n\nIt works for 10 minutes. If you didn't ask for it, ignore this email.`,
      });
    },
  };
}
