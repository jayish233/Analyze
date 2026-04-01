import nodemailer from "nodemailer";
import { IVideo } from "@/models/Video";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildEmailHTML(
  videos: IVideo[],
  aiSummary: string,
  date: string
): string {
  const rows = videos
    .slice(0, 15)
    .map(
      (v, i) => `
    <tr style="background:${i % 2 === 0 ? "#0f172a" : "#1e293b"};">
      <td style="padding:12px 8px; color:#94a3b8; font-size:13px; width:28px;">${i + 1}</td>
      <td style="padding:12px 8px;">
        <a href="${v.url}" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:600; font-size:14px; display:block; margin-bottom:3px;">${v.title}</a>
        <span style="color:#64748b; font-size:12px;">📺 ${v.channelName}</span>
      </td>
      <td style="padding:12px 8px; text-align:center; color:#f1f5f9; font-size:13px;">${formatNumber(v.views)}</td>
      <td style="padding:12px 8px; text-align:center; color:#34d399; font-size:13px; font-weight:700;">${formatNumber(v.viewsPerDay)}/day</td>
      <td style="padding:12px 8px; text-align:center;">
        <span style="background:#7c3aed; color:#fff; padding:3px 8px; border-radius:12px; font-size:12px; font-weight:700;">${v.outperformRatio}x</span>
      </td>
      <td style="padding:12px 8px; text-align:center; color:#94a3b8; font-size:12px;">${formatDate(v.publishedDate)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YT Intel — Daily Report</title></head>
<body style="margin:0; padding:0; background:#020617; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:800px; margin:0 auto; padding:24px 16px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1b4b 0%,#0f172a 100%); border-radius:16px; padding:32px; margin-bottom:24px;">
          <tr>
            <td>
              <h1 style="margin:0; color:#fff; font-size:28px; font-weight:800;">📊 YT Intel</h1>
              <p style="margin:8px 0 0; color:#94a3b8; font-size:16px;">Daily Outperforming Videos Report</p>
              <p style="margin:4px 0 0; color:#64748b; font-size:13px;">${date} • WebDev & AI Niche</p>
            </td>
          </tr>
        </table>

        <!-- AI Summary -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b; border-left:4px solid #7c3aed; border-radius:8px; padding:20px; margin-bottom:24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px; color:#a78bfa; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">🤖 AI Trend Summary</p>
              <p style="margin:0; color:#e2e8f0; font-size:15px; line-height:1.6;">${aiSummary}</p>
            </td>
          </tr>
        </table>

        <!-- Stats Bar -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td width="33%" style="background:#1e293b; border-radius:12px; padding:16px; text-align:center; margin-right:8px;">
              <div style="color:#38bdf8; font-size:24px; font-weight:800;">${videos.length}</div>
              <div style="color:#64748b; font-size:12px; margin-top:4px;">Videos Analyzed</div>
            </td>
            <td width="4px"></td>
            <td width="33%" style="background:#1e293b; border-radius:12px; padding:16px; text-align:center;">
              <div style="color:#34d399; font-size:24px; font-weight:800;">${videos.filter(v => v.isOutperforming).length}</div>
              <div style="color:#64748b; font-size:12px; margin-top:4px;">Outperforming</div>
            </td>
            <td width="4px"></td>
            <td width="33%" style="background:#1e293b; border-radius:12px; padding:16px; text-align:center;">
              <div style="color:#f59e0b; font-size:24px; font-weight:800;">${videos[0] ? videos[0].outperformRatio + 'x' : 'N/A'}</div>
              <div style="color:#64748b; font-size:12px; margin-top:4px;">Top Score</div>
            </td>
          </tr>
        </table>

        <!-- Videos Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a; border-radius:12px; overflow:hidden; border:1px solid #1e293b;">
          <thead>
            <tr style="background:#1e293b;">
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:left; font-weight:600;">#</th>
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:left; font-weight:600;">Video</th>
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:center; font-weight:600;">Views</th>
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:center; font-weight:600;">Views/Day</th>
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:center; font-weight:600;">Score</th>
              <th style="padding:14px 8px; color:#64748b; font-size:11px; text-transform:uppercase; text-align:center; font-weight:600;">Published</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0 8px;">
          <tr>
            <td style="text-align:center;">
              <p style="color:#334155; font-size:12px; margin:0;">YT Intel • Automated by AI • krishma939@gmail.com</p>
              <p style="color:#334155; font-size:11px; margin:4px 0 0;">Next report tomorrow at 4:00 AM IST</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendDailyReport(
  videos: IVideo[],
  aiSummary: string
): Promise<{ success: boolean; error?: string }> {
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const html = buildEmailHTML(videos, aiSummary, date);
  const outperformCount = videos.filter((v) => v.isOutperforming).length;

  try {
    await transporter.sendMail({
      from: `"YT Intel 📊" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_TO,
      subject: `📊 ${outperformCount} Outperforming Videos Today | ${date} — YT Intel`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[Email] Send error:", err.message);
    return { success: false, error: err.message };
  }
}
