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
    `Your AllTheCalls mission control is live. You can see every call your AI receptionist handles — call history, recordings, transcripts, and summaries — all in one place, on any device.`,
    ``,
    `Step 1 — Open your portal:`,
    input.accessUrl,
    ``,
    `This is your personal login link. Bookmark it — tapping it keeps you signed in for 30 days.`,
    ``,
    `Step 2 — Install it on your phone (recommended, 15 seconds):`,
    ``,
    `📱 iPhone / iPad`,
    `  1. IMPORTANT: open the link in Safari (not Chrome or Gmail's in-app browser — it has to be Safari)`,
    `  2. Tap the Share button at the bottom of Safari (the square with the arrow pointing up)`,
    `  3. Scroll down and tap "Add to Home Screen"`,
    `  4. Tap "Add" in the top-right corner`,
    `  5. You'll see the AllTheCalls icon on your home screen — tap it like any app`,
    ``,
    `🤖 Android`,
    `  1. Open the link in Chrome`,
    `  2. Tap the three-dot menu (⋮) in the top-right`,
    `  3. Tap "Install app" or "Add to Home Screen"`,
    `  4. Tap "Install"`,
    ``,
    `Already installed before but see the wrong icon?`,
    `  Delete the old icon from your home screen first (long-press → Remove), then follow the steps above. iPhone caches icons and only refreshes on re-install.`,
    ``,
    `Need help? Reply to this email and we'll walk you through it.`,
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
            <td style="padding:0 32px 8px;">
              <div style="border-top:1px solid #1f2233;padding-top:24px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a78bfa;margin-bottom:6px;">
                  Step 2 · Install to your home screen
                </div>
                <p style="margin:0 0 20px;font-size:14px;color:#9aa0b8;line-height:1.5;">
                  This makes the portal feel like a native app — no browser bar, just tap the icon and you're in.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px solid #1f2233;border-radius:14px;padding:20px;background:#141725;">
                <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:10px;">
                  📱 iPhone / iPad
                </div>
                <ol style="margin:0 0 8px 0;padding-left:20px;font-size:13px;color:#9aa0b8;line-height:1.7;">
                  <li><strong style="color:#e8eaf2;">Must be Safari</strong> — not Chrome, not Gmail's in-app browser. Open this email in Safari, or copy the link and paste it into Safari.</li>
                  <li>Tap the <strong style="color:#e8eaf2;">Share button</strong> at the bottom of Safari (square with an up arrow).</li>
                  <li>Scroll down and tap <strong style="color:#e8eaf2;">&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                  <li>Tap <strong style="color:#e8eaf2;">&ldquo;Add&rdquo;</strong> in the top-right. Done.</li>
                </ol>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px solid #1f2233;border-radius:14px;padding:20px;background:#141725;">
                <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:10px;">
                  🤖 Android
                </div>
                <ol style="margin:0;padding-left:20px;font-size:13px;color:#9aa0b8;line-height:1.7;">
                  <li>Open this link in <strong style="color:#e8eaf2;">Chrome</strong>.</li>
                  <li>Tap the <strong style="color:#e8eaf2;">three-dot menu</strong> (⋮) top-right.</li>
                  <li>Tap <strong style="color:#e8eaf2;">&ldquo;Install app&rdquo;</strong> or &ldquo;Add to Home Screen&rdquo;.</li>
                  <li>Tap <strong style="color:#e8eaf2;">&ldquo;Install&rdquo;</strong>. Done.</li>
                </ol>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <div style="border:1px solid rgba(234,179,8,0.25);border-radius:14px;padding:16px 18px;background:rgba(234,179,8,0.06);">
                <div style="font-size:12px;font-weight:700;color:#facc15;margin-bottom:6px;">
                  ⚠️ Already installed before?
                </div>
                <div style="font-size:13px;color:#9aa0b8;line-height:1.5;">
                  If you see an old icon on your home screen, delete it first (long-press → Remove), then re-add. iPhone caches icons aggressively and only refreshes when you re-install.
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0;font-size:12px;color:#5d6378;line-height:1.6;">
                Need help? Reply to this email and we&rsquo;ll walk you through it.
                You&rsquo;ll stay signed in for 30 days — if you ever get logged out, just tap the button above again.
              </p>
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
