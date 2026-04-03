import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const phpPath = process.env.PHP_BINARY || 'php';
  const scriptPath = path.resolve(__dirname, '../../scripts/send_smtp_mail.php');

  if (!existsSync(scriptPath)) {
    throw new Error(`No se encontró el helper SMTP en ${scriptPath}`);
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(phpPath, [scriptPath]);
    let stderr = '';

    child.on('error', reject);
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `php mailer terminó con código ${code}`));
    });

    child.stdin.write(
      JSON.stringify({
        to: sanitizeHeader(payload.to),
        subject: sanitizeHeader(payload.subject),
        text: payload.text
      })
    );
    child.stdin.end();
  });
}
