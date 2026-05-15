import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface LoginAlertData {
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  timestamp: string;
  referrer: string;
}

function parseBrowser(ua: string): string {
  if (/Edg\/([0-9.]+)/.test(ua)) return `Edge ${ua.match(/Edg\/([0-9.]+)/)![1]}`;
  if (/OPR\/([0-9.]+)/.test(ua)) return `Opera ${ua.match(/OPR\/([0-9.]+)/)![1]}`;
  if (/Chrome\/([0-9.]+)/.test(ua)) return `Chrome ${ua.match(/Chrome\/([0-9.]+)/)![1]}`;
  if (/Firefox\/([0-9.]+)/.test(ua)) return `Firefox ${ua.match(/Firefox\/([0-9.]+)/)![1]}`;
  if (/Safari\/([0-9.]+)/.test(ua) && /Version\/([0-9.]+)/.test(ua)) return `Safari ${ua.match(/Version\/([0-9.]+)/)![1]}`;
  return 'Unknown Browser';
}

function parseOS(ua: string): string {
  if (/Windows NT 10\.0/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Mac OS X ([0-9_]+)/.test(ua)) return `macOS ${ua.match(/Mac OS X ([0-9_]+)/)![1].replace(/_/g, '.')}`;
  if (/Android ([0-9.]+)/.test(ua)) return `Android ${ua.match(/Android ([0-9.]+)/)![1]}`;
  if (/iPhone OS ([0-9_]+)/.test(ua)) return `iOS ${ua.match(/iPhone OS ([0-9_]+)/)![1].replace(/_/g, '.')}`;
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

export function parseUserAgent(ua: string) {
  return {
    browser: parseBrowser(ua),
    os: parseOS(ua),
  };
}

export async function sendLoginAlert(data: LoginAlertData) {
  const { ipAddress, userAgent, browser, os, timestamp, referrer } = data;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1e293b; padding: 24px 32px;">
      <h1 style="color: #f8fafc; margin: 0; font-size: 20px;">🔐 Dashboard Login Alert</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">${timestamp}</p>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; width: 40%;">Login Time</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">${timestamp}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b;">IP Address</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 500; font-family: monospace;">${ipAddress}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b;">Browser</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">${browser}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b;">Operating System</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">${os}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b;">Referrer</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">${referrer || 'Direct'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b; vertical-align: top;">User Agent</td>
          <td style="padding: 12px 0; color: #475569; font-family: monospace; font-size: 12px; word-break: break-all;">${userAgent}</td>
        </tr>
      </table>
      <div style="margin-top: 24px; padding: 16px; background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; font-size: 13px; color: #713f12;">
        ⚠️ If this wasn't you, change your password immediately and check your account for unauthorized activity.
      </div>
    </div>
    <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      This is an automated security alert from Sam's Review Dashboard
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: 'Dashboard Alerts <onboarding@resend.dev>',
    to: 'premkumar.gurunathan@joytechnologies.com',
    subject: `🔐 Dashboard Login Alert - ${timestamp}`,
    html,
  });
}
