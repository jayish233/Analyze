# 📊 YT Intel — YouTube Competitor Intelligence Dashboard

> Automatically finds outperforming videos in the WebDev & AI niche, scores them with AI, and sends a daily report to your Gmail at **4:00 AM IST**.

---

## 🚀 How It Works

1. **Searches** YouTube for 15 niche keywords (AI, WebDev, automation, startup, etc.) via ScrapingDog API
2. **Scores** each video: compares its `views/day` against the channel's own average
3. **Flags** videos with **2x or more** views/day vs channel average as "Outperforming 🔥"
4. **Analyzes** top videos with Google Gemini AI
5. **Emails** a beautiful report to `krishma939@gmail.com` every day at **4:00 AM IST**

---

## 🔑 Step 1 — Get Your API Keys

### A) MongoDB Atlas (Free Database)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Sign up free
2. Create a **Free M0 cluster**
3. Under **Database Access**, create a user (save username/password)
4. Under **Network Access**, click "Add IP Address" → "Allow Access from Anywhere" (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection string
6. Replace `<password>` with your DB user password
7. Your `MONGODB_URI` looks like: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/yt-intel`

### B) Google Gemini API (Free)
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key → paste into `GEMINI_API_KEY`

### C) Gmail App Password (for sending emails)
1. Make sure **2-Step Verification** is enabled on your Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select app: **Mail**, device: **Other** → Name it "YT Intel"
4. Click **Generate** → Copy the 16-character password
5. Paste into `GMAIL_APP_PASSWORD` (format: `xxxx xxxx xxxx xxxx`)

---

## ⚙️ Step 2 — Configure Environment Variables

Update `.env.local` with your real values:

```env
SCRAPINGDOG_API_KEY=69cb1784c6af04a0cfb76b84
GEMINI_API_KEY=your_actual_gemini_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yt-intel
GMAIL_TO=krishma939@gmail.com
GMAIL_USER=krishma939@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
CRON_SECRET=yt-intel-secret-2025
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

---

## 💻 Step 3 — Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Click **"Search Now"** to do your first data pull.

---

## 🌐 Step 4 — Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Then in the **Vercel Dashboard**:
1. Go to your project → **Settings** → **Environment Variables**
2. Add ALL the variables from `.env.local`
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://yt-intel.vercel.app`)

---

## ⏰ Step 5 — Set Up Daily 4 AM Email

The `vercel.json` already configures a cron job for **22:30 UTC = 4:00 AM IST**:

```json
{
  "crons": [{ "path": "/api/cron/daily-report", "schedule": "30 22 * * *" }]
}
```

> **Note**: Vercel Hobby plan supports 1 cron job. This is already set up — no action needed after deploying!

**Test the email manually** (after setting env vars):
```
GET https://your-vercel-url.vercel.app/api/cron/daily-report?secret=yt-intel-secret-2025
```

---

## 📱 Dashboard Features

| Feature | Description |
|---|---|
| 🔍 Search Now | Manually trigger a full niche search |
| 🔥 Outperforming Filter | Show only 2x+ videos |
| 📺 Channel Filter | Filter by specific channel |
| 🏷️ Topic Filter | Filter by search keyword |
| 🤖 AI Insight | Click any video to get Gemini analysis |
| 📊 Score Bar | Visual ratio indicator |
| 📧 Auto Email | Daily at 4 AM IST to krishma939@gmail.com |

---

## 🎯 Outperform Algorithm

```
viewsPerDay = totalViews / daysSincePublish

channelMedianViewsPerDay = median(all videos by same channel)

outperformRatio = viewsPerDay / channelMedianViewsPerDay

isOutperforming = outperformRatio >= 2.0  (2x or more)
```

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **MongoDB Atlas** + Mongoose
- **ScrapingDog** YouTube API
- **Google Gemini 1.5 Flash**
- **Nodemailer** + Gmail SMTP
- **Vercel** (hosting + cron)
- **Tailwind CSS** (dark theme)
