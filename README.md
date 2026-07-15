# Career Arsenal — 16 AI Skills + HR Live Chat + Job Finder · Powered by GLM

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ats--jobs.space--z.ai-success?style=for-the-badge)](https://ats-jobs.space-z.ai)

> **Try it now:** [https://ats-jobs.space-z.ai](https://ats-jobs.space-z.ai)

Upload your resume or LinkedIn export once. Run all 16 career & hiring skills, chat live with AI-powered HR experts, search for jobs across LinkedIn/Indeed/Glassdoor, and get everything you need for your job search — all powered by Z.ai GLM, free.

Built with [Next.js 16](https://nextjs.org), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com/), [Prisma](https://www.prisma.io/), and the [`z-ai-web-dev-sdk`](https://www.npmjs.com/package/z-ai-web-dev-sdk).

The 16 skills are based on the open-source [Career Arsenal](https://github.com/roman-ryzenadvanced/Job-Hunter-Linkedin-Skill-Hermes-OpenClaw-ClaudeCode-Comet) skill collection.

---

## 🚀 Live Demo

**URL:** [https://ats-jobs.space-z.ai](https://ats-jobs.space-z.ai)

| Feature | How to try |
|---|---|
| **Upload Resume** | Drop a PDF/DOCX/TXT resume on the landing page |
| **16 AI Skills** | Click any skill card → fill inputs → "Run with GLM" |
| **HR Live Chat** | Click the floating chat button (bottom-right) → pick a persona → ask anything |
| **Resume Builder** | Click "Resume Builder" card → paste job posting → choose from 20 templates |
| **Cover Letter Builder** | Click "Cover Letter Builder" card → choose format (Text/HTML/PDF) |
| **Job Finder** | Click "Job Finder" card → search LinkedIn/Indeed/Glassdoor → save → auto-apply |
| **Google-style Job Search** | Use the search bar on the dashboard → filter by type/experience/date |
| **AI Provider Settings** | Click the gear icon (⚙️) in the header → view/switch provider |
| **Multi-language** | Click the globe icon (🌐) → switch between EN/RU/HE/FR/AR |

---

## ✨ Features

### Core Platform
- **Drag-and-drop upload** — drop a PDF / DOCX / TXT resume or LinkedIn export; files are parsed **client-side** (in your browser) and only extracted text is sent to the server, avoiding body size limits and ensuring privacy.
- **16 AI skills in one place** — 8 career skills (job-seeker side) + 8 HR skills (hiring side), each with its own typed inputs and prompt template.
- **Free LLM access via GLM** — all skill runs hit `z-ai-web-dev-sdk` → GLM-4.6. No API keys, no quotas.
- **Clean, minimal chat.z.ai-style UI** — sticky header, top promo banner, sidebar profile + history panel, responsive skill grid, dark/light mode.
- **Replace CV / Clear profile** — swap resumes anytime; one-click clean slate.
- **Per-skill run dialog** — fill inputs, run, get markdown output with copy + download-as-`.md` buttons. Re-run with different inputs.
- **Recent runs history** — every LLM call is persisted with skillId, inputs, output, model, and timestamp.
- **Local-first** — your data stays on the device. No analytics, no telemetry, no third-party tracking.

### 🆕 HR Expert Live Chat
Chat with 6 AI-powered HR expert personas in real-time:
- **Sarah** — Senior Recruiter (resume tips, interview prep, what recruiters look for)
- **Marcus** — Compensation Specialist (salary benchmarking, equity evaluation, negotiation)
- **Dr. Priya** — Career Coach (transitions, imposter syndrome, promotion strategy)
- **James** — HR & Employment Legal (contracts, non-competes, worker classification)
- **Elena** — Culture & Retention Expert (culture assessment, red flags, team dynamics)
- **Alex** — Startup Founder Advisor (joining early-stage, equity, founder interviews)

Each persona has a specialized system prompt. Multi-turn conversations with context. Suggested questions per persona. Floating chat button (bottom-right) with slide-out drawer.

### 🆕 Multi-Language Support (i18n)
Full end-to-end internationalization with 5 languages:
- 🇬🇧 English
- 🇷🇺 Russian (Русский)
- 🇮🇱 Hebrew (עברית) — with RTL support
- 🇫🇷 French (Français)
- 🇸🇦 Arabic (العربية) — with RTL support

Language preference is saved to localStorage. RTL languages automatically switch the entire UI direction. Language switcher in the header with flag icons.

### 🆕 Cute Pug Helper Animation
An animated SVG pug appears during loading states:
- Bouncing body, wagging tail, twitching ears, blinking eyes, licking tongue
- Shows during file parsing ("Sniffing out your skills…")
- Shows during skill execution ("Thinking…")
- Pure SVG + CSS animations — no external dependencies

### 🆕 UI Transitions
- Page fade-in-up animations
- Staggered card entrance (skill cards appear one by one)
- Smooth theme and language transitions
- Toast notification animations
- Dialog backdrop fade

### 🆕 Mobile-First Responsive Design
- Fixed mobile scrolling across all sections
- Sticky sidebar disabled on mobile (flows naturally)
- Skill grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Upload zone reduced padding on mobile
- Dialog content scrolls properly with momentum scrolling
- Horizontal overflow prevented
- Touch-friendly 44px+ tap targets

### Promo Badges
- **Top banner**: "Built using GLM 5.2 Coding Model" → links to [z.ai/subscribe](https://z.ai/subscribe?ic=ROK78RJKNW) + Telegram community link
- **Bottom footer**: Mirrored promo banner + author credit (Rommark.Dev) + email contact

---

## 🧠 The 16 Skills

### Career Skills (8) — for job seekers

| Skill | What it does |
|---|---|
| **Career GPS** | Strategic career planning, skill gap analysis, role transition roadmaps. |
| **Resume Architect** | Generate ATS-optimized, role-targeted resumes from your career data. |
| **Cover Letter Craft** | Customized cover letters following the proven 4-paragraph formula. |
| **LinkedIn Optimizer** | Turn your LinkedIn profile into a recruiter magnet and networking machine. |
| **Interview Commander** | Mock interviews, STAR stories, behavioral + technical prep. |
| **Salary Negotiator** | Market data + negotiation scripts to maximize your offer. |
| **Job Switch Advisor** | Decide whether to switch jobs — or stay and negotiate. |
| **JobHunter Master** | Aggressive, multi-channel job hunt strategy beyond Easy Apply. |

### HR / Hiring Skills (8) — for hiring teams & founders

| Skill | What it does |
|---|---|
| **JD Forge** | Write job descriptions that attract the right candidates and filter out the wrong ones. |
| **Candidate Hunter** | Agentic LinkedIn sourcing strategy — find humans, not applications. |
| **Interview Designer** | Structured interview loops with rubrics and anti-bias guardrails. |
| **Offer Architect** | Design competitive offers that win without overpaying. |
| **Onboarding Commander** | 30-60-90 day onboarding plans that get new hires to full productivity fast. |
| **Talent Pipeline** | Build a proactive pipeline of candidates before you need them. |
| **Retention Radar** | Identify flight risks before they resign, and intervene. |
| **Culture Architect** | Design and codify company culture intentionally — not by accident. |

Each skill is defined declaratively in [`src/lib/skills.ts`](src/lib/skills.ts) with: id, name, category, icon, color, tagline, description, typed inputs, system prompt, and a `userPromptTemplate(profile, inputs)` function that injects the user's full career context.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (client)                       │
│  ─ UploadZone (drag-drop) ─ ProfilePanel ─ SkillCard grid     │
│  ─ SkillRunDialog (inputs form + markdown output)             │
│  ─ HistoryPanel (recent runs)                                 │
└──────────────────────────┬───────────────────────────────────┘
                           │ fetch (relative paths)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 16 API routes                      │
│  POST /api/upload          → parse PDF/DOCX/TXT, upsert       │
│  GET  /api/upload          → fetch current profile + counts   │
│  PATCH /api/profile        → update target role / context     │
│  DELETE /api/profile/delete → wipe profile (clean slate)      │
│  POST /api/skills/[id]/run → build prompt → call GLM → save   │
│  GET  /api/runs            → recent 50 runs for history       │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
           ▼                                   ▼
┌────────────────────────┐         ┌──────────────────────────┐
│  Prisma + SQLite       │         │  z-ai-web-dev-sdk → GLM  │
│  Profile / SkillRun /  │         │  (system-level config    │
│  UploadedFile          │         │   at /etc/.z-ai-config)  │
└────────────────────────┘         └──────────────────────────┘
```

### Database schema (Prisma)

- **Profile** — single-user design; stores `rawText`, `sourceKind` (resume/linkedin), `targetRole`, `targetContext`.
- **UploadedFile** — tracks every upload (fileName, fileType, extractedText).
- **SkillRun** — every LLM call: `skillId`, `skillName`, `input` (JSON), `output` (markdown), `modelUsed`, `createdAt`.

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema.

---

## 🚀 Quick start

### Prerequisites

- **Node.js 20+** (or [Bun](https://bun.sh) — recommended)
- A Z.ai SDK config file at one of:
  - `./.z-ai-config` (project dir)
  - `~/.z-ai-config` (home dir)
  - `/etc/.z-ai-config` (system dir)

The config file should look like:

```json
{
  "baseUrl": "https://api.z.ai/api/your-endpoint/v1",
  "apiKey": "your-z-ai-api-key",
  "chatId": "optional",
  "userId": "optional"
}
```

> **Note:** This project was developed in the Z.ai sandbox environment where `/etc/.z-ai-config` is pre-provisioned. If you're running elsewhere, supply your own config file. Get free access at [z.ai/subscribe](https://z.ai/subscribe?ic=ROK78RJKNW).

### Install

```bash
git clone <your-fork-url>
cd career-arsenal
bun install   # or: npm install / pnpm install
```

### Set up the database

```bash
cp .env.example .env   # edit if needed — default uses local SQLite
bun run db:push        # creates the SQLite DB + tables
```

### Run the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Drop a resume, click a skill card, hit "Run with GLM".

### Lint

```bash
bun run lint
```

---

## 📁 Project structure

```
.
├── prisma/
│   └── schema.prisma              # Profile, UploadedFile, SkillRun models
├── public/                        # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts            # POST/GET upload + parse
│   │   │   ├── profile/route.ts           # PATCH target role/context
│   │   │   ├── profile/delete/route.ts    # DELETE clean slate
│   │   │   ├── skills/[id]/run/route.ts   # POST run skill via GLM
│   │   │   └── runs/route.ts              # GET recent runs
│   │   ├── globals.css           # Tailwind + prose + scrollbar styles
│   │   ├── layout.tsx            # ThemeProvider + metadata
│   │   └── page.tsx              # Main single-page app
│   ├── components/
│   │   ├── theme-provider.tsx    # next-themes wrapper
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       ├── db.ts                 # Prisma client singleton
│       ├── skills.ts             # 16 skill definitions + prompt templates
│       └── utils.ts              # cn() helper
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🛠️ Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server routes for LLM + parsing, client UI in one app |
| Language | **TypeScript 5** | Type-safe skills, inputs, and API contracts |
| Styling | **Tailwind CSS 4** + **shadcn/ui** | Rapid, consistent, accessible components |
| Database | **Prisma** + **SQLite** | Zero-config local persistence, single-file DB |
| LLM | **z-ai-web-dev-sdk** → GLM-4.6 | Free, fast, high-quality outputs |
| PDF parsing | **unpdf** | Serverless-friendly pdfjs-dist wrapper |
| DOCX parsing | **mammoth** | Reliable .docx → text extraction |
| Markdown | **react-markdown** | Render LLM output safely |
| Theming | **next-themes** | Dark/light mode with no hydration flash |
| Icons | **lucide-react** | Clean, consistent icon set |

---

## 🧩 How a skill run works

1. User opens a skill card → dialog with typed inputs renders.
2. User fills inputs (textarea / text / select) and clicks **Run with GLM**.
3. Frontend POSTs to `/api/skills/[id]/run` with `{ inputs }`.
4. Backend:
   - Looks up the skill definition in `src/lib/skills.ts`
   - Validates required inputs
   - Loads the user's profile from Prisma (rawText + targetRole + targetContext)
   - Calls `skill.userPromptTemplate({ profile, inputs })` to build the user message
   - Calls `zai.chat.completions.create({ messages: [system, user] })` via the SDK
   - Persists the run to the `SkillRun` table
5. Frontend receives the markdown output, renders it with `react-markdown`, and offers Copy + Download-as-`.md` buttons.

---

## 📝 Customizing

### Add a new skill

Open [`src/lib/skills.ts`](src/lib/skills.ts) and add a new entry to either `CAREER_SKILLS` or `HR_SKILLS`:

```typescript
{
  id: "my-new-skill",
  name: "My New Skill",
  category: "career",          // or "hr"
  icon: "Sparkles",            // any lucide-react icon name
  color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  tagline: "Short one-liner shown on the card.",
  description: "Longer explanation shown in the dialog.",
  inputs: [
    {
      key: "topic",
      label: "What do you want help with?",
      type: "textarea",
      placeholder: "Describe...",
      required: true,
    },
  ],
  systemPrompt: "You are an expert at...",
  userPromptTemplate: ({ profile, inputs }) => `${profile.rawText}\n\nTopic: ${inputs.topic}\n\nHelp the user now.`,
}
```

The skill automatically appears in the grid and is runnable via the API. No other changes needed.

### Change the LLM model

Edit `src/app/api/skills/[id]/run/route.ts`:

```typescript
let modelUsed = 'glm-4.6';  // change to whatever the SDK supports
```

### Add a new file type for upload

Edit `src/app/api/upload/route.ts` — add a new `else if` branch in the parse block with the appropriate parser. Don't forget to update the `accept` attribute on the file inputs in `src/app/page.tsx`.

---

## 🌐 Deploying

This is a standard Next.js 16 app — deploy anywhere that supports Next.js (Vercel, Netlify, self-hosted, etc.).

**Important for deploy:**
1. Set up the Z.ai SDK config on your hosting environment (env var or mounted file).
2. Run `bun run db:push` (or `prisma migrate deploy`) once after first deploy to create the SQLite DB.
3. If using SQLite, make sure the DB file path is writable by the app process.

---

## 🔒 Privacy

- **Local-first**: Profile text and skill runs are stored in a local SQLite file. Nothing leaves your server except the LLM calls to GLM.
- **No analytics**: No tracking, no telemetry, no third-party scripts.
- **Your data, your control**: Use the "Clear" button to wipe everything instantly.

---

## 📜 Credits

- **Skills**: Based on [Career Arsenal](https://github.com/roman-ryzenadvanced/Job-Hunter-Linkedin-Skill-Hermes-OpenClaw-ClaudeCode-Comet) by [@roman-ryzenadvanced](https://github.com/roman-ryzenadvanced).
- **LLM**: [Z.ai GLM](https://chat.z.ai) — free access via `z-ai-web-dev-sdk`.
- **UI components**: [shadcn/ui](https://ui.shadcn.com/) (New York style).
- **Icons**: [lucide-react](https://lucide.dev).

---

## 👤 Author

**Rommark.Dev**
- 🌐 [www.rommark.dev](https://www.rommark.dev)
- ✉️ [rommark@gmx.com](mailto:rommark@gmx.com)

---

## 💬 Community

- 📢 [Telegram — free resources for vibe coders](https://t.me/VibeCodePrompterSystem)
- ⚡ [GLM 5.2 Coding Model — coding plans](https://z.ai/subscribe?ic=ROK78RJKNW)

---

## 📄 License

MIT — see [LICENSE](LICENSE).

You're free to use, modify, and distribute this project. A credit link to [rommark.dev](https://www.rommark.dev) is appreciated but not required.
