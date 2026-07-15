/**
 * Career Arsenal — 16 AI-powered skills (8 career + 8 HR)
 *
 * Each skill has:
 *  - id: slug used in DB + routing
 *  - name: display name
 *  - category: "career" | "hr"
 *  - icon: lucide icon name
 *  - tagline: short one-liner
 *  - description: longer explanation shown in the skill detail panel
 *  - inputs: array of user-facing inputs the skill needs (key, label, type, placeholder, required)
 *  - systemPrompt: the system message sent to GLM
 *  - userPromptTemplate: a function (or template string) that builds the user message
 *                        from profile + inputs
 */

export type SkillInputType = "text" | "textarea" | "select" | "number";

export interface SkillInput {
  key: string;
  label: string;            // English fallback (used by API)
  labelKey?: string;        // i18n key for translated label
  type: SkillInputType;
  placeholder?: string;     // English fallback
  placeholderKey?: string;  // i18n key for translated placeholder
  required?: boolean;
  options?: { label: string; value: string; labelKey?: string }[];
  helpText?: string;
  defaultValue?: string;
}

export interface Skill {
  id: string;
  name: string;             // English fallback (used by API)
  nameKey?: string;         // i18n key for translated name
  category: "career" | "hr";
  icon: string;             // lucide icon name
  color: string;            // tailwind accent color class for card
  tagline: string;          // English fallback
  taglineKey?: string;      // i18n key
  description: string;      // English fallback
  descriptionKey?: string;  // i18n key
  inputs: SkillInput[];
  systemPrompt: string;
  /**
   * Template receives:
   *  - profile: { fullName, rawText, parsedJson, targetRole, targetContext }
   *  - inputs: Record<string, string>  (user-filled inputs for this run)
   * Returns the user message string.
   */
  userPromptTemplate: (ctx: {
    profile: {
      fullName?: string | null;
      rawText: string;
      parsedJson?: string | null;
      targetRole?: string | null;
      targetContext?: string | null;
    };
    inputs: Record<string, string>;
  }) => string;
}

// ─── Helper: build a common preamble with the user's full career context ───
function profilePreamble(rawText: string, targetRole?: string | null, targetContext?: string | null): string {
  let s = `=== USER'S CAREER PROFILE (raw text extracted from their uploaded resume / LinkedIn export) ===\n\n${rawText}\n\n=== END PROFILE ===\n`;
  if (targetRole) s += `\nTarget role / direction the user is aiming for: ${targetRole}\n`;
  if (targetContext) s += `\nAdditional context provided by the user:\n${targetContext}\n`;
  return s;
}

// ───────────────────────────────────────────────────────────────────────────
// CAREER SKILLS (8) — for job seekers
// ───────────────────────────────────────────────────────────────────────────

export const CAREER_SKILLS: Skill[] = [
  // 1. career-gps
  {
    id: "career-gps",
    name: "Career GPS",
    nameKey: "skill.career-gps.name",
    category: "career",
    icon: "Compass",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    tagline: "Strategic career planning, skill gap analysis, role transition roadmaps.",
    taglineKey: "skill.career-gps.tagline",
    description: "Treats your career like a product. Audits your current state, defines 1/3/5-year targets, identifies gaps, and produces a concrete quarterly action plan. Use this first if you're unsure of your direction.",
    descriptionKey: "skill.career-gps.description",
    inputs: [
      {
        key: "aspiration",
        label: "Career aspiration (vague or specific)",
          labelKey: "skill.career-gps.input.aspiration",
        type: "textarea",
        placeholder: "e.g. I want to become a COO at a Series A Web3 startup in 2 years, or: I'm considering switching from ops to product.",
          placeholderKey: "skill.career-gps.input.aspirationPlaceholder",
        required: true,
      },
      {
        key: "horizon",
        label: "Planning horizon",
          labelKey: "skill.career-gps.input.horizon",
        type: "select",
        defaultValue: "5-year",
        options: [
          { label: "1-year tactical", value: "1-year" },
          { label: "3-year mid-term", value: "3-year" },
          { label: "5-year strategic", value: "5-year" },
        ],
      },
    ],
    systemPrompt: `You are Career GPS, an expert career strategist and executive coach. You treat the user's career like a product: with a roadmap, milestones, and metrics. Be honest, specific, and actionable. Never produce vague self-help platitudes. Always structure your response with: (1) Career Audit — honest assessment of current state, (2) Target Definition — specific 1/3/5-year targets, (3) Gap Analysis — what's missing, prioritized by impact × ease, (4) Action Roadmap — quarterly milestones for the next 12 months. Use markdown headings and bullet lists. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

User's career aspiration:
${inputs.aspiration}

Planning horizon: ${inputs.horizon}

Produce a complete career GPS plan now. Use the profile above as the source of truth for current skills and experience. If the aspiration is vague, propose 2-3 concrete refinements before building the plan.`,
  },

  // 2. resume-architect
  {
    id: "resume-architect",
    name: "Resume Architect",
    nameKey: "skill.resume-architect.name",
    category: "career",
    icon: "FileText",
    color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
    tagline: "Generate ATS-optimized, role-targeted resumes from your career data.",
    taglineKey: "skill.resume-architect.tagline",
    description: "Reverse-engineers the target job posting, extracts structured career data from your profile, and assembles an ATS-optimized single-column resume that mirrors the employer's language. Output is markdown that you can paste into any template.",
    descriptionKey: "skill.resume-architect.description",
    inputs: [
      {
        key: "jobPosting",
        label: "Target job posting (paste full text — drives keyword matching)",
          labelKey: "skill.resume-architect.input.jobPosting",
        type: "textarea",
        placeholder: "Paste the job description here. The more complete it is, the better the keyword match.",
          placeholderKey: "skill.resume-architect.input.jobPostingPlaceholder",
        required: true,
      },
      {
        key: "format",
        label: "Resume format",
          labelKey: "skill.resume-architect.input.format",
        type: "select",
        defaultValue: "senior",
        options: [
          { label: "Mid-level (3-7 yrs)", value: "mid" },
          { label: "Senior/Staff (8+ yrs)", value: "senior" },
          { label: "Entry-level (0-2 yrs)", value: "entry" },
        ],
      },
    ],
    systemPrompt: `You are Resume Architect, an expert resume writer who has reviewed 10,000+ resumes for FAANG and top startups. Your resume has ONE job: pass the ATS scanner and land in a human's hands. Rules: (1) Single-column ATS-safe structure, (2) Mirror the job posting's exact keywords, (3) Quantified achievements (X%, $Y, Z users) — never responsibilities without outcomes, (4) Action verbs first (Led, Built, Drove, Architected, Reduced, Scaled), (5) Top 6 seconds must tell the whole story. Output the full resume in markdown with clear section headers: PROFESSIONAL SUMMARY, CORE SKILLS (grouped by category, job-posting keywords first), WORK EXPERIENCE (reverse-chronological, 3-5 bullets per role), EDUCATION, optional CERTIFICATIONS. Never fabricate metrics — if the profile lacks numbers, use restrained qualitative language.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Target job posting:
${inputs.jobPosting}

Resume format: ${inputs.format}

Build the complete ATS-optimized resume now. Mirror the job posting's exact language and keywords. Quantify achievements where the profile supports it; otherwise use honest qualitative language. Output as clean markdown.`,
  },

  // 3. cover-letter-craft
  {
    id: "cover-letter-craft",
    name: "Cover Letter Craft",
    nameKey: "skill.cover-letter-craft.name",
    category: "career",
    icon: "Mail",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    tagline: "Customized cover letters following the 4-paragraph formula.",
    taglineKey: "skill.cover-letter-craft.tagline",
    description: "Writes a cover letter that follows the proven 4-paragraph formula: (1) Why THIS company — show you researched, (2) Why YOU — specific experience matching their needs, (3) What you'll DO — concrete value you'll add, (4) Call to action. Never generic.",
    descriptionKey: "skill.cover-letter-craft.description",
    inputs: [
      {
        key: "jobPosting",
        label: "Target job posting",
          labelKey: "skill.cover-letter-craft.input.jobPosting",
        type: "textarea",
        placeholder: "Paste the job description.",
          placeholderKey: "skill.cover-letter-craft.input.jobPostingPlaceholder",
        required: true,
      },
      {
        key: "companyResearch",
        label: "What you know about the company (recent news, products, mission, culture)",
          labelKey: "skill.cover-letter-craft.input.companyResearch",
        type: "textarea",
        placeholder: "e.g. Just raised Series A led by a16z, building developer tools for Solana, founder previously worked at...",
          placeholderKey: "skill.cover-letter-craft.input.companyResearchPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Cover Letter Craft, an expert cover letter writer. Follow the 4-paragraph formula strictly: (1) Why THIS company — reference a specific recent fact, product, or value you researched, (2) Why YOU — connect 2-3 specific achievements from the profile to the job's stated needs, (3) What you'll DO — propose concrete value you'll add in the first 90 days, (4) Call to action — request a 15-minute meeting. Tone: confident, specific, never desperate or generic. Maximum 350 words. Output only the cover letter, no preamble. Use proper letter format (greeting, body, sign-off).`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Target job posting:
${inputs.jobPosting}

What the user knows about the company:
${inputs.companyResearch}

Write the cover letter now.`,
  },

  // 4. linkedin-optimizer
  {
    id: "linkedin-optimizer",
    name: "LinkedIn Optimizer",
    nameKey: "skill.linkedin-optimizer.name",
    category: "career",
    icon: "Linkedin",
    color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
    tagline: "Turn your LinkedIn profile into a recruiter magnet and networking machine.",
    taglineKey: "skill.linkedin-optimizer.tagline",
    description: "Scores your profile across 10 dimensions (headshot, headline, about, experience, skills, recommendations, activity, featured, education), then rewrites your headline, summary, and experience bullets to maximize recruiter search visibility and conversions.",
    descriptionKey: "skill.linkedin-optimizer.description",
    inputs: [
      {
        key: "targetRole",
        label: "Target role or career direction",
          labelKey: "skill.linkedin-optimizer.input.targetRole",
        type: "text",
        placeholder: "e.g. Senior Backend Engineer | Rust • Distributed Systems",
          placeholderKey: "skill.linkedin-optimizer.input.targetRolePlaceholder",
        required: true,
      },
      {
        key: "focusAreas",
        label: "Areas you most want feedback on (comma-separated)",
          labelKey: "skill.linkedin-optimizer.input.focusAreas",
        type: "text",
        placeholder: "e.g. headline, about, experience bullets",
          placeholderKey: "skill.linkedin-optimizer.input.focusAreasPlaceholder",
        defaultValue: "headline, about, experience",
      },
    ],
    systemPrompt: `You are LinkedIn Optimizer. LinkedIn is not a resume — it's a landing page for your professional brand. Every element must (1) show up in recruiter searches (SEO), (2) communicate value in 5 seconds (hook), (3) prove expertise (authority), (4) make it easy to contact you (conversion). Score the profile 0-10 across: Headshot (assume present), Banner, Headline, About/Summary, Experience, Skills, Recommendations, Activity, Featured, Education. Then provide REWRITTEN versions of: (a) headline (using the formula [Title] | [Key Skills] | [Value Prop], under 220 chars), (b) About section (story-driven, keyword-dense, 3 short paragraphs), (c) top 3 experience bullets rewritten in achievement-first form. Use markdown with clear headers. Maximum 1000 words.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

User's target role: ${inputs.targetRole}
Focus areas: ${inputs.focusAreas}

Audit the LinkedIn profile (use the resume text above as proxy for current LinkedIn content) and provide the full optimization report now.`,
  },

  // 5. interview-commander
  {
    id: "interview-commander",
    name: "Interview Commander",
    nameKey: "skill.interview-commander.name",
    category: "career",
    icon: "Mic",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    tagline: "Mock interviews, STAR stories, behavioral + technical prep.",
    taglineKey: "skill.interview-commander.tagline",
    description: "Generates role-specific mock interview questions, then drafts model answers using the STAR framework based on your profile. Covers behavioral, technical, and case-study rounds. Includes red flags to avoid and follow-up questions to expect.",
    descriptionKey: "skill.interview-commander.description",
    inputs: [
      {
        key: "role",
        label: "Role you're interviewing for",
          labelKey: "skill.interview-commander.input.role",
        type: "text",
        placeholder: "e.g. Senior Backend Engineer at a Series A fintech startup",
          placeholderKey: "skill.interview-commander.input.rolePlaceholder",
        required: true,
      },
      {
        key: "rounds",
        label: "Interview rounds to prep for",
          labelKey: "skill.interview-commander.input.rounds",
        type: "select",
        defaultValue: "behavioral",
        options: [
          { label: "Behavioral (STAR stories)", value: "behavioral" },
          { label: "Technical (system design / coding)", value: "technical" },
          { label: "Case study / take-home", value: "case" },
          { label: "All of the above", value: "all" },
        ],
      },
      {
        key: "weakSpots",
        label: "Weak spots you're worried about (optional)",
          labelKey: "skill.interview-commander.input.weakSpots",
        type: "textarea",
        placeholder: "e.g. I tend to ramble in behavioral, I freeze on system design estimation, I haven't done LeetCode in 2 years...",
          placeholderKey: "skill.interview-commander.input.weakSpotsPlaceholder",
      },
    ],
    systemPrompt: `You are Interview Commander, a senior hiring manager who has conducted 1000+ interviews at top tech companies. Produce a structured interview prep pack: (1) 8-10 likely interview questions for the role and round type, (2) for each question, a model answer using STAR (Situation, Task, Action, Result) drawn from the user's profile, (3) red flags to avoid, (4) follow-up questions the interviewer will likely ask, (5) 2-3 questions the user should ask the interviewer. Be specific to the user's actual experience — never use generic examples. Use markdown with clear headers per question. Maximum 1500 words.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Role interviewing for: ${inputs.role}
Round type: ${inputs.rounds}
Weak spots: ${inputs.weakSpots || "(none specified)"}

Produce the interview prep pack now. Base every model answer on the user's actual experience from their profile.`,
  },

  // 6. salary-negotiator
  {
    id: "salary-negotiator",
    name: "Salary Negotiator",
    nameKey: "skill.salary-negotiator.name",
    category: "career",
    icon: "DollarSign",
    color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
    tagline: "Market data + negotiation scripts to maximize your offer.",
    taglineKey: "skill.salary-negotiator.tagline",
    description: "Analyzes your current offer (or target comp), benchmarks against market data, identifies your leverage, and produces word-for-word negotiation scripts for the initial counter, the second round, and the final close. Includes email and verbal versions.",
    descriptionKey: "skill.salary-negotiator.description",
    inputs: [
      {
        key: "offerDetails",
        label: "Current offer or target compensation details",
          labelKey: "skill.salary-negotiator.input.offerDetails",
        type: "textarea",
        placeholder: "e.g. Base $180k, 0.1% equity (4-yr vest, 1-yr cliff), $20k sign-on, no bonus. Role: Senior Engineer at Series B SaaS startup (remote, US).",
          placeholderKey: "skill.salary-negotiator.input.offerDetailsPlaceholder",
        required: true,
      },
      {
        key: "competingOffers",
        label: "Competing offers or current comp (leverage)",
          labelKey: "skill.salary-negotiator.input.competingOffers",
        type: "textarea",
        placeholder: "e.g. Current comp is $165k base + $30k RSUs. Another company is offering $195k base.",
          placeholderKey: "skill.salary-negotiator.input.competingOffersPlaceholder",
      },
      {
        key: "priorities",
        label: "What matters most to you (cash, equity, level, flexibility)",
          labelKey: "skill.salary-negotiator.input.priorities",
        type: "text",
        placeholder: "e.g. Maximize base, willing to give up some equity. Need remote flexibility.",
          placeholderKey: "skill.salary-negotiator.input.prioritiesPlaceholder",
        defaultValue: "Maximize total comp",
      },
    ],
    systemPrompt: `You are Salary Negotiator, an expert recruiter and comp negotiator. Produce: (1) Market benchmark — reasonable comp range for the role/level/company stage (be honest about uncertainty), (2) Leverage analysis — what gives the user negotiating power, (3) Counter-offer script (email version, then verbal version) — specific numbers, anchored high but defensible, (4) Second-round script — if they push back, (5) Final close script — what to confirm in writing. Tone: confident, collaborative, never adversarial. Maximum 1000 words. Use markdown.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Offer / target compensation:
${inputs.offerDetails}

Competing offers or current comp:
${inputs.competingOffers || "(none provided)"}

User's priorities: ${inputs.priorities}

Produce the full negotiation playbook now.`,
  },

  // 7. job-switch-advisor
  {
    id: "job-switch-advisor",
    name: "Job Switch Advisor",
    nameKey: "skill.job-switch-advisor.name",
    category: "career",
    icon: "TrendingUp",
    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
    tagline: "Decide whether to switch jobs — or stay and negotiate.",
    taglineKey: "skill.job-switch-advisor.tagline",
    description: "Uses the weighted decision matrix from Career GPS. Scores stay vs. switch across 8 factors (growth, comp ceiling, learning velocity, WLB, team/culture, impact, risk tolerance, location) and gives a clear recommendation with the threshold to act.",
    descriptionKey: "skill.job-switch-advisor.description",
    inputs: [
      {
        key: "currentSituation",
        label: "Current job situation — what's pushing you to consider leaving?",
          labelKey: "skill.job-switch-advisor.input.currentSituation",
        type: "textarea",
        placeholder: "e.g. 3 years at current company, promoted once, no path to senior. Comp below market by ~20%. Manager is great but team is shrinking.",
          placeholderKey: "skill.job-switch-advisor.input.currentSituationPlaceholder",
        required: true,
      },
      {
        key: "opportunity",
        label: "Specific opportunity you're considering (or 'general market')",
          labelKey: "skill.job-switch-advisor.input.opportunity",
        type: "textarea",
        placeholder: "e.g. Senior Engineer role at a Series A startup, $190k base + 0.25% equity. Or: just exploring the market.",
          placeholderKey: "skill.job-switch-advisor.input.opportunityPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Job Switch Advisor. Apply the weighted decision matrix from Career GPS. Score each factor 1-10 for STAY vs. SWITCH, with weights: growth potential (3x), comp ceiling (2x), learning velocity (3x), WLB (2x), team/culture (2x), impact potential (2x), risk tolerance (1x), location (2x). Present the full matrix as a markdown table. Then: (1) Weighted totals, (2) Clear recommendation — switch if SWITCH wins by 20%+, (3) If close: what would make staying competitive?, (4) 3 specific next steps regardless of decision. Maximum 900 words.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Current situation:
${inputs.currentSituation}

Opportunity being considered:
${inputs.opportunity}

Run the full decision matrix and recommend now.`,
  },

  // 8. jobhunter-master
  {
    id: "jobhunter-master",
    name: "JobHunter Master",
    nameKey: "skill.jobhunter-master.name",
    category: "career",
    icon: "Crosshair",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    tagline: "Aggressive, multi-channel job hunt strategy beyond Easy Apply.",
    taglineKey: "skill.jobhunter-master.tagline",
    description: "Builds a 30-day job hunt plan: target company list (with reasoning), research checklist per company, multi-channel approach (LinkedIn, email, Twitter), connection-request templates, cold email templates, and follow-up cadence. Treats hunting as a sales process.",
    descriptionKey: "skill.jobhunter-master.description",
    inputs: [
      {
        key: "targetDescription",
        label: "Target role, stage, and location",
          labelKey: "skill.jobhunter-master.input.targetDescription",
        type: "textarea",
        placeholder: "e.g. Senior Backend Engineer at Series A/B Web3 startups, remote, US/EU timezone. Open to fintech and infra.",
          placeholderKey: "skill.jobhunter-master.input.targetDescriptionPlaceholder",
        required: true,
      },
      {
        key: "timeline",
        label: "Search timeline",
          labelKey: "skill.jobhunter-master.input.timeline",
        type: "select",
        defaultValue: "active",
        options: [
          { label: "Just exploring (1-3 mo)", value: "exploring" },
          { label: "Active search (1-2 mo to offers)", value: "active" },
          { label: "Urgent (offer in 4 weeks)", value: "urgent" },
        ],
      },
      {
        key: "weeklyHours",
        label: "Hours per week you can dedicate to the hunt",
          labelKey: "skill.jobhunter-master.input.weeklyHours",
        type: "text",
        defaultValue: "10",
        placeholder: "e.g. 10",
          placeholderKey: "skill.jobhunter-master.input.weeklyHoursPlaceholder",
      },
    ],
    systemPrompt: `You are JobHunter Master. Easy Apply is a lottery ticket — real job hunting is a sales process. Produce a 30-day hunt plan: (1) Target company list — 12-15 specific companies that fit the description, with a one-line reason each, (2) Research checklist — what to learn about each company before applying, (3) Multi-channel approach — LinkedIn (connection request template), Email (cold outreach template), Twitter (engagement plan), (4) Follow-up cadence — Day 0 / Day 3 / Day 7 / Day 14 with specific message angles, (5) Weekly milestones — what to ship each week given the hours budget. Be specific and aggressive. Use markdown. Maximum 1500 words.`,
    userPromptTemplate: ({ profile, inputs }) => `${profilePreamble(profile.rawText, profile.targetRole, profile.targetContext)}

Target description:
${inputs.targetDescription}

Timeline: ${inputs.timeline}
Weekly hours available: ${inputs.weeklyHours}

Produce the 30-day hunt plan now. Tailor target companies and outreach angles to the user's actual background.`,
  },
];

// ───────────────────────────────────────────────────────────────────────────
// HR SKILLS (8) — for hiring teams (also useful for founders hiring their first team)
// ───────────────────────────────────────────────────────────────────────────

export const HR_SKILLS: Skill[] = [
  // 9. hr-job-description-forge
  {
    id: "hr-job-description-forge",
    name: "JD Forge",
    nameKey: "skill.hr-job-description-forge.name",
    category: "hr",
    icon: "FileSignature",
    color: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900",
    tagline: "Write job descriptions that attract the right candidates and filter out the wrong ones.",
    taglineKey: "skill.hr-job-description-forge.tagline",
    description: "Generates a complete job posting with: role mission, responsibilities, must-have vs. nice-to-have requirements, compensation transparency, and a 'how to apply' section designed to filter tire-kickers. Outputs markdown ready to paste into Greenhouse, Lever, or LinkedIn.",
    descriptionKey: "skill.hr-job-description-forge.description",
    inputs: [
      {
        key: "role",
        label: "Role title and seniority",
          labelKey: "skill.hr-job-description-forge.input.role",
        type: "text",
        placeholder: "e.g. Senior Backend Engineer (Rust)",
          placeholderKey: "skill.hr-job-description-forge.input.rolePlaceholder",
        required: true,
      },
      {
        key: "companyContext",
        label: "Company context (stage, mission, team size, tech stack)",
          labelKey: "skill.hr-job-description-forge.input.companyContext",
        type: "textarea",
        placeholder: "e.g. Series A Web3 infrastructure startup, 25 people, building RPC nodes for Solana. Stack: Rust, Kubernetes, AWS.",
          placeholderKey: "skill.hr-job-description-forge.input.companyContextPlaceholder",
        required: true,
      },
      {
        key: "mustHaves",
        label: "Non-negotiable requirements (optional)",
          labelKey: "skill.hr-job-description-forge.input.mustHaves",
        type: "textarea",
        placeholder: "e.g. 5+ yrs production Rust, distributed systems experience, on-call rotation comfort.",
          placeholderKey: "skill.hr-job-description-forge.input.mustHavesPlaceholder",
      },
    ],
    systemPrompt: `You are JD Forge, an expert technical recruiter. Write a job description that attracts the RIGHT candidates and filters out the wrong ones. Rules: (1) Lead with the role's mission — why does this role exist?, (2) Responsibilities — 5-7 specific outcomes they'll own, not vague 'responsibilities', (3) Must-haves (3-5) vs. Nice-to-haves (3-5) — be honest, don't inflate requirements, (4) Compensation transparency — provide a realistic range and equity guidance, (5) 'How to apply' — include 1-2 screening questions that filter tire-kickers. Tone: confident, specific, never generic corporate. Use markdown. Maximum 800 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Company context (this user is the hiring manager):
${inputs.companyContext}

Role: ${inputs.role}
Non-negotiables provided: ${inputs.mustHaves || "(none — propose based on role)"}

Write the job description now.`,
  },

  // 10. hr-candidate-hunter
  {
    id: "hr-candidate-hunter",
    name: "Candidate Hunter",
    nameKey: "skill.hr-candidate-hunter.name",
    category: "hr",
    icon: "Users",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
    tagline: "Agentic LinkedIn sourcing strategy — find humans, not applications.",
    taglineKey: "skill.hr-candidate-hunter.tagline",
    description: "Builds a candidate sourcing playbook: 10+ LinkedIn search queries, Boolean strings, target company lists to poach from, personalized outreach templates per candidate archetype, and a 4-touch follow-up cadence.",
    descriptionKey: "skill.hr-candidate-hunter.description",
    inputs: [
      {
        key: "role",
        label: "Role you're sourcing for",
          labelKey: "skill.hr-candidate-hunter.input.role",
        type: "text",
        placeholder: "e.g. Senior Rust Backend Engineer",
          placeholderKey: "skill.hr-candidate-hunter.input.rolePlaceholder",
        required: true,
      },
      {
        key: "companyContext",
        label: "Your company context (what makes this role exciting)",
          labelKey: "skill.hr-candidate-hunter.input.companyContext",
        type: "textarea",
        placeholder: "e.g. Well-funded Series A Web3 startup, founder ex-FAANG, working on cutting-edge validator infra. Remote-first, competitive comp.",
          placeholderKey: "skill.hr-candidate-hunter.input.companyContextPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Candidate Hunter, an expert technical sourcer. Build a sourcing playbook: (1) Candidate archetypes — 3-4 personas (e.g. 'Big-tech engineer seeking impact', 'Startup generalist ready to specialize'), (2) LinkedIn Boolean search strings — 8+ ready-to-paste queries, (3) Target companies to poach from — 10+ specific companies with reasoning, (4) Personalized outreach templates — one per archetype, under 150 words, (5) 4-touch follow-up cadence with different angles. Be specific and aggressive. Use markdown. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Hiring manager's company context:
${inputs.companyContext}

Role to source: ${inputs.role}

Build the sourcing playbook now.`,
  },

  // 11. hr-interview-designer
  {
    id: "hr-interview-designer",
    name: "Interview Designer",
    nameKey: "skill.hr-interview-designer.name",
    category: "hr",
    icon: "ClipboardCheck",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
    tagline: "Structured interview loops with rubrics and anti-bias guardrails.",
    taglineKey: "skill.hr-interview-designer.tagline",
    description: "Designs a complete interview loop: 4-5 panels with specific questions, evaluation rubrics (1-5 scale), calibration guidance, anti-bias reminders, and a debrief template. Outputs markdown you can paste into your ATS interview kit.",
    descriptionKey: "skill.hr-interview-designer.description",
    inputs: [
      {
        key: "role",
        label: "Role",
          labelKey: "skill.hr-interview-designer.input.role",
        type: "text",
        placeholder: "e.g. Senior Backend Engineer",
          placeholderKey: "skill.hr-interview-designer.input.rolePlaceholder",
        required: true,
      },
      {
        key: "loopFormat",
        label: "Interview loop format",
          labelKey: "skill.hr-interview-designer.input.loopFormat",
        type: "select",
        defaultValue: "standard",
        options: [
          { label: "Standard (4 panels: coding, system design, behavioral, bar-raiser)", value: "standard" },
          { label: "Startup lean (3 panels)", value: "lean" },
          { label: "Executive (5+ panels incl. founder 1:1)", value: "executive" },
        ],
      },
    ],
    systemPrompt: `You are Interview Designer, a senior hiring manager who has built interview loops at FAANG and high-growth startups. Design a structured interview loop: (1) Loop overview — N panels, what each evaluates, who should run it, (2) Per-panel: 3-5 specific questions, what to look for, evaluation rubric (1-5 scale with concrete examples per score), (3) Anti-bias guardrails — common pitfalls and how to avoid them, (4) Calibration guidance — how to debrief, how to handle dissent, (5) Debrief template. Use markdown with clear per-panel sections. Maximum 1500 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Role: ${inputs.role}
Loop format: ${inputs.loopFormat}

Design the complete interview loop now.`,
  },

  // 12. hr-offer-architect
  {
    id: "hr-offer-architect",
    name: "Offer Architect",
    nameKey: "skill.hr-offer-architect.name",
    category: "hr",
    icon: "Gift",
    color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900",
    tagline: "Design competitive offers that win without overpaying.",
    taglineKey: "skill.hr-offer-architect.tagline",
    description: "Given the candidate's profile, your comp band, and competing offers (if known), produces an offer recommendation with base/equity/bonus breakdown, justification, and a fallback negotiation range.",
    descriptionKey: "skill.hr-offer-architect.description",
    inputs: [
      {
        key: "candidate",
        label: "Candidate profile (level, experience, current comp if known)",
          labelKey: "skill.hr-offer-architect.input.candidate",
        type: "textarea",
        placeholder: "e.g. 7 yrs backend experience, currently Senior Engineer at fintech, $175k base + $40k RSU. Strong on Rust and distributed systems.",
          placeholderKey: "skill.hr-offer-architect.input.candidatePlaceholder",
        required: true,
      },
      {
        key: "compBand",
        label: "Your company's comp band for this level",
          labelKey: "skill.hr-offer-architect.input.compBand",
        type: "textarea",
        placeholder: "e.g. Senior Engineer band: $170-200k base, 0.1-0.25% equity, $15-25k sign-on.",
          placeholderKey: "skill.hr-offer-architect.input.compBandPlaceholder",
        required: true,
      },
      {
        key: "competingOffers",
        label: "Known competing offers (optional)",
          labelKey: "skill.hr-offer-architect.input.competingOffers",
        type: "textarea",
        placeholder: "e.g. Competing offer from another startup: $195k base + 0.3% equity.",
          placeholderKey: "skill.hr-offer-architect.input.competingOffersPlaceholder",
      },
    ],
    systemPrompt: `You are Offer Architect, an expert comp strategist. Produce: (1) Recommended offer — specific base, equity, sign-on, bonus, with rationale, (2) Total comp comparison vs. market and competing offers, (3) Negotiation range — your walk-away number and stretch number, (4) Fallback package — if they push back on cash, what equity/sign-on flexibility you have, (5) Risk assessment — likelihood of acceptance, what could derail. Be data-driven and honest. Use markdown. Maximum 900 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Candidate profile:
${inputs.candidate}

Your comp band:
${inputs.compBand}

Competing offers: ${inputs.competingOffers || "(none known)"}

Design the offer package now.`,
  },

  // 13. hr-onboarding-commander
  {
    id: "hr-onboarding-commander",
    name: "Onboarding Commander",
    nameKey: "skill.hr-onboarding-commander.name",
    category: "hr",
    icon: "Rocket",
    color: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-900",
    tagline: "30-60-90 day onboarding plans that get new hires to full productivity fast.",
    taglineKey: "skill.hr-onboarding-commander.tagline",
    description: "Builds a role-specific 30-60-90 day onboarding plan: week-by-week milestones, key relationships to build, training resources, success metrics, and check-in cadence. Reduces time-to-productivity by 40%.",
    descriptionKey: "skill.hr-onboarding-commander.description",
    inputs: [
      {
        key: "role",
        label: "Role being onboarded",
          labelKey: "skill.hr-onboarding-commander.input.role",
        type: "text",
        placeholder: "e.g. Senior Backend Engineer",
          placeholderKey: "skill.hr-onboarding-commander.input.rolePlaceholder",
        required: true,
      },
      {
        key: "companyContext",
        label: "Company + team context (stack, processes, current team size)",
          labelKey: "skill.hr-onboarding-commander.input.companyContext",
        type: "textarea",
        placeholder: "e.g. Series A startup, 15 engineers, Rust + Kubernetes, 2-week sprint cycles, code-review-driven culture.",
          placeholderKey: "skill.hr-onboarding-commander.input.companyContextPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Onboarding Commander. Build a 30-60-90 day plan that gets new hires to full productivity fast. Structure: (1) Pre-day-1 checklist (accounts, hardware, access, welcome package), (2) Week 1 — orientation, environment setup, first small win, (3) Days 1-30 — learning the system, first minor contribution, key relationships, (4) Days 31-60 — owning a small feature, contributing to design, (5) Days 61-90 — full ownership of a project area, (6) Success metrics at each checkpoint, (7) Check-in cadence — manager 1:1s, buddy system, retrospective. Be specific to the role and stack. Use markdown. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Role: ${inputs.role}
Company + team context: ${inputs.companyContext}

Build the 30-60-90 day onboarding plan now.`,
  },

  // 14. hr-talent-pipeline
  {
    id: "hr-talent-pipeline",
    name: "Talent Pipeline",
    nameKey: "skill.hr-talent-pipeline.name",
    category: "hr",
    icon: "GitBranch",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
    tagline: "Build a proactive pipeline of candidates before you need them.",
    taglineKey: "skill.hr-talent-pipeline.tagline",
    description: "Designs a 6-month pipeline strategy: which roles to pipeline, sourcing channels, nurture sequences, quarterly engagement touchpoints, and conversion metrics. Moves you from reactive to proactive hiring.",
    descriptionKey: "skill.hr-talent-pipeline.description",
    inputs: [
      {
        key: "hiringPlan",
        label: "6-month hiring plan (roles + count)",
          labelKey: "skill.hr-talent-pipeline.input.hiringPlan",
        type: "textarea",
        placeholder: "e.g. 3 backend engineers, 2 frontend, 1 designer, 1 PM, 1 SRE.",
          placeholderKey: "skill.hr-talent-pipeline.input.hiringPlanPlaceholder",
        required: true,
      },
      {
        key: "companyContext",
        label: "Company context (stage, brand strength, location)",
          labelKey: "skill.hr-talent-pipeline.input.companyContext",
        type: "textarea",
        placeholder: "e.g. Series A, 30 people, emerging brand in Web3 infra, remote-first.",
          placeholderKey: "skill.hr-talent-pipeline.input.companyContextPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Talent Pipeline strategist. Build a 6-month proactive pipeline plan: (1) Pipeline prioritization — which roles to start with and why, (2) Sourcing channels per role — LinkedIn, communities (Discord, Reddit, HN), events, referrals, content, (3) Nurture sequence — quarterly touchpoint plan for warm candidates, (4) Conversion metrics — pipeline-to-applicant, applicant-to-offer, offer-to-accept targets, (5) Tooling — what to track and how. Be specific. Use markdown. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Company context: ${inputs.companyContext}

6-month hiring plan:
${inputs.hiringPlan}

Build the pipeline strategy now.`,
  },

  // 15. hr-retention-radar
  {
    id: "hr-retention-radar",
    name: "Retention Radar",
    nameKey: "skill.hr-retention-radar.name",
    category: "hr",
    icon: "ShieldCheck",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900",
    tagline: "Identify flight risks before they resign, and intervene.",
    taglineKey: "skill.hr-retention-radar.tagline",
    description: "Builds a retention risk assessment framework: 10 flight-risk signals to monitor, intervention playbooks per signal, stay-interview question bank, and a quarterly retention audit template.",
    descriptionKey: "skill.hr-retention-radar.description",
    inputs: [
      {
        key: "teamContext",
        label: "Team context (size, tenure distribution, recent changes)",
          labelKey: "skill.hr-retention-radar.input.teamContext",
        type: "textarea",
        placeholder: "e.g. 12-person engineering team, avg tenure 2.5 yrs, just went through reorg, 1 senior eng left last quarter.",
          placeholderKey: "skill.hr-retention-radar.input.teamContextPlaceholder",
        required: true,
      },
      {
        key: "concerns",
        label: "Specific retention concerns (optional)",
          labelKey: "skill.hr-retention-radar.input.concerns",
        type: "textarea",
        placeholder: "e.g. Two senior engineers seem disengaged in 1:1s. Compensation hasn't been adjusted in 18 months.",
          placeholderKey: "skill.hr-retention-radar.input.concernsPlaceholder",
      },
    ],
    systemPrompt: `You are Retention Radar, an expert people-ops strategist. Produce: (1) Flight-risk signals — 10 behavioral/professional signals to watch for, (2) Risk assessment framework — how to score each team member (low/medium/high risk), (3) Intervention playbooks — per signal, what to do (and what NOT to do), (4) Stay-interview question bank — 12-15 open questions, (5) Quarterly retention audit template. Be specific and actionable. Use markdown. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Team context:
${inputs.teamContext}

Specific concerns: ${inputs.concerns || "(general assessment)"}

Build the retention framework now.`,
  },

  // 16. hr-culture-architect
  {
    id: "hr-culture-architect",
    name: "Culture Architect",
    nameKey: "skill.hr-culture-architect.name",
    category: "hr",
    icon: "HeartHandshake",
    color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900",
    tagline: "Design and codify company culture intentionally — not by accident.",
    taglineKey: "skill.hr-culture-architect.tagline",
    description: "Helps you articulate your company's operating principles, rituals, and anti-patterns. Produces a culture document, hiring filter questions, and a quarterly culture audit. Useful for founders at any stage.",
    descriptionKey: "skill.hr-culture-architect.description",
    inputs: [
      {
        key: "companyStage",
        label: "Company stage and size",
          labelKey: "skill.hr-culture-architect.input.companyStage",
        type: "text",
        placeholder: "e.g. Series A, 25 people, scaling to 50 in 12 months.",
          placeholderKey: "skill.hr-culture-architect.input.companyStagePlaceholder",
        required: true,
      },
      {
        key: "valuesRaw",
        label: "What do you stand for? (raw brainstorm — what behaviors do you reward/punish?)",
          labelKey: "skill.hr-culture-architect.input.valuesRaw",
        type: "textarea",
        placeholder: "e.g. We reward ownership, speed, and honesty. We punish politics, blame-shifting, and 'not my job' attitudes. We want people who...",
          placeholderKey: "skill.hr-culture-architect.input.valuesRawPlaceholder",
        required: true,
      },
    ],
    systemPrompt: `You are Culture Architect, an expert in scaling company culture from 10 to 100+ people. Produce: (1) Operating Principles — 5-7 specific, behavioral principles (not vague values), each with: the principle, what it looks like in practice, what it does NOT look like, (2) Rituals — 4-5 specific team rituals that reinforce the principles, (3) Anti-patterns — 3-5 behaviors that violate the culture, (4) Hiring filter questions — 5-7 questions to test culture fit in interviews, (5) Quarterly culture audit — 10 questions to ask the team. Be specific and concrete — no 'we value teamwork' platitudes. Use markdown. Maximum 1200 words.`,
    userPromptTemplate: ({ profile, inputs }) => `Company stage: ${inputs.companyStage}

Raw values brainstorm:
${inputs.valuesRaw}

Architect the culture now.`,
  },
];

export const ALL_SKILLS: Skill[] = [...CAREER_SKILLS, ...HR_SKILLS];

export const SKILL_MAP: Record<string, Skill> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s.id, s])
);

export function getSkill(id: string): Skill | undefined {
  return SKILL_MAP[id];
}
