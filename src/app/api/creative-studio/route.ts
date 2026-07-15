/**
 * POST /api/creative-studio
 *
 * Generates creative content (presentations, landing pages, mini apps, slides,
 * portfolio sites, documents) using GLM.
 *
 * Body: { type: 'slides'|'landing'|'app'|'doc'|'portfolio', prompt: string, customInstructions?: string }
 * Returns: { content, fileName, fileType, mimeType, typeLabel, preview, size }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 120;

const TYPE_CONFIG: Record<string, { systemPrompt: string; ext: string; mime: string; label: string }> = {
  slides: {
    ext: 'html', mime: 'text/html', label: 'Presentation',
    systemPrompt: `You are a world-class presentation designer. Generate a COMPLETE, standalone HTML presentation (slide deck).

Requirements:
- Single HTML file with inline CSS and JavaScript
- Modern, clean design with smooth transitions
- Keyboard navigation (arrow keys between slides)
- Each slide full-screen (100vw x 100vh)
- Title slide, content slides, closing slide
- Professional typography (Google Fonts via CDN)
- Subtle animations (fade-in, slide-up)
- Slide counter (e.g., "3 / 8")
- Responsive and mobile-friendly
- Cohesive color scheme

Return ONLY the HTML code — no markdown fences, no explanation.`,
  },
  landing: {
    ext: 'html', mime: 'text/html', label: 'Landing Page',
    systemPrompt: `You are a world-class landing page designer. Generate a COMPLETE, standalone HTML landing page.

Requirements:
- Single HTML file with inline CSS
- Modern, conversion-focused design
- Hero section with compelling headline
- Features/benefits section
- Call-to-action buttons
- Professional typography (Google Fonts via CDN)
- Responsive and mobile-friendly
- Smooth scroll animations

Return ONLY the HTML code — no markdown fences, no explanation.`,
  },
  app: {
    ext: 'html', mime: 'text/html', label: 'Mini App',
    systemPrompt: `You are a world-class frontend developer. Generate a COMPLETE, standalone HTML mini-app.

Requirements:
- Single HTML file with inline CSS and JavaScript
- Fully functional — no placeholders
- Clean, modern UI
- Interactive elements (buttons, forms, etc.)
- Responsive and mobile-friendly

Return ONLY the HTML code — no markdown fences, no explanation.`,
  },
  doc: {
    ext: 'md', mime: 'text/markdown', label: 'Document',
    systemPrompt: `You are a world-class document writer. Generate a professional markdown document with clear headings, bullet points, and professional tone. Return ONLY the markdown — no code fences.`,
  },
  portfolio: {
    ext: 'html', mime: 'text/html', label: 'Portfolio Site',
    systemPrompt: `You are a world-class portfolio website designer. Generate a COMPLETE, standalone HTML portfolio website.

Requirements:
- Single HTML file with inline CSS and JavaScript
- Hero section with name and title
- About section, Experience timeline, Skills showcase
- Projects/achievements section, Contact section
- Modern design with animations
- Dark mode toggle
- Responsive and mobile-friendly

Return ONLY the HTML code — no markdown fences, no explanation.`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const userLang = req.headers.get("x-user-language") || "en";
    const body = await req.json();
    const type: string = body.type || 'slides';
    const prompt: string = body.prompt || '';
    const customInstructions: string = body.customInstructions || '';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Please describe what you want to create.' }, { status: 400 });
    }

    const config = TYPE_CONFIG[type];
    if (!config) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const profile = await db.profile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const resumeContext = profile?.rawText
      ? `\n\n=== USER'S RESUME ===\n${profile.rawText.substring(0, 2000)}\n=== END RESUME ===\n`
      : '\n\n(No resume uploaded — create generic content.)\n';

    const targetRoleContext = profile?.targetRole ? `\nTarget role: ${profile.targetRole}\n` : '';

    const userPrompt = `${resumeContext}${targetRoleContext}

Create: ${config.label}
Request: ${prompt}
${customInstructions ? `Instructions: ${customInstructions}\n` : ''}
Generate the complete ${config.label} now. Return ONLY the code/content.`;

    let content = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      });
      content = completion.choices?.[0]?.message?.content || '';
    } catch (llmErr: any) {
      return NextResponse.json({ error: 'AI service unavailable.', detail: llmErr?.message }, { status: 502 });
    }

    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    if (!content) {
      return NextResponse.json({ error: 'Empty content. Try again.' }, { status: 502 });
    }

    const safePrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${type}-${safePrompt}-${Date.now()}.${config.ext}`;

    return NextResponse.json({
      ok: true,
      content,
      fileName,
      fileType: config.ext,
      mimeType: config.mime,
      typeLabel: config.label,
      preview: content.substring(0, 500),
      size: Math.round(content.length / 1024 * 10) / 10,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed.', detail: err?.message }, { status: 500 });
  }
}
