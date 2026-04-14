type WelcomeInput = {
  to: string;
  name: string;
  accessUrl: string;
};

export async function sendWelcomeEmail(input: WelcomeInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const subject = `Your AllTheCalls portal is ready, ${firstName(input.name)}`;
  const html = renderWelcome(input);
  const text = renderWelcomeText(input);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AllTheCalls <hello@allthecalls.ai>",
      to: [input.to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}

function firstName(name: string): string {
  return name.split(/[\s·,]/)[0] || name;
}

function renderWelcomeText(input: WelcomeInput): string {
  return [
    `Hey ${firstName(input.name)},`,
    ``,
    `Your AllTheCalls mission control is live. You can see every call your AI receptionist handles — call history, recordings, transcripts, and summaries — all in one place.`,
    ``,
    `Open your portal:`,
    input.accessUrl,
    ``,
    `👉 To install it to your phone's home screen:`,
    `  • iPhone: Open the link in Safari → tap the Share button → Add to Home Screen`,
    `  • Android: Open the link in Chrome → tap the ⋮ menu → Install app`,
    ``,
    `You'll stay logged in for 30 days. If you ever get logged out, just tap the link again.`,
    ``,
    `— The AllTheCalls team`,
  ].join("\n");
}

function renderWelcome(input: WelcomeInput): string {
  const first = firstName(input.name);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#08090f;color:#e8eaf2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08090f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0f1119;border:1px solid #1f2233;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px;">
              <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                <span style="background:linear-gradient(135deg,#4cd7f6,#a78bfa,#d2bbff);-webkit-background-clip:text;background-clip:text;color:transparent;">allthecalls</span><span style="color:#a78bfa;">.ai</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:700;color:#ffffff;">
                Your portal is live, ${escapeHtml(first)} 👋
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#9aa0b8;">
                Every call your AI receptionist handles — call history, recordings, transcripts, and summaries — all in one place, on any device.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;" align="center">
              <a href="${escapeAttr(input.accessUrl)}" style="display:inline-block;padding:16px 32px;border-radius:14px;background:linear-gradient(135deg,#4cd7f6 0%,#7c3aed 55%,#c4b5fd 100%);color:#ffffff;font-weight:600;font-size:16px;text-decoration:none;box-shadow:0 10px 30px -10px rgba(124,58,237,0.5);">
                Open My Portal →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="border-top:1px solid #1f2233;padding-top:24px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a78bfa;margin-bottom:8px;">
                  Install to your home screen
                </div>
                <p style="margin:0 0 10px;font-size:14px;color:#9aa0b8;">
                  <strong style="color:#e8eaf2;">iPhone:</strong> Open the link in Safari → tap Share → Add to Home Screen
                </p>
                <p style="margin:0 0 16px;font-size:14px;color:#9aa0b8;">
                  <strong style="color:#e8eaf2;">Android:</strong> Open the link in Chrome → tap ⋮ → Install app
                </p>
                <p style="margin:0;font-size:12px;color:#5d6378;">
                  You'll stay logged in for 30 days. If you get logged out, just tap this email's button again.
                </p>
              </div>
            </td>
          </tr>
        </table>
        <div style="margin-top:24px;font-size:12px;color:#5d6378;">
          AllTheCalls.ai · Your AI receptionist, always answering.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
