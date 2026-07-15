/**
 * 20 Beautiful Resume Design Templates
 *
 * Each template is a self-contained style configuration that takes structured
 * resume data (JSON) and renders it as a styled HTML resume. Templates are
 * designed to be ATS-friendly (single column, parseable text) while still
 * looking professional and distinctive.
 *
 * Inspired by: Zety, Novoresume, Canva, Flowcv, Standard Resume, Resume.io
 */

export interface ResumeData {
  fullName: string;
  title: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  skills: { category: string; items: string[] }[];
  experience: {
    company: string;
    title: string;
    dates: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    dates: string;
    details?: string;
  }[];
  certifications?: { name: string; issuer: string; date: string }[];
  languages?: { name: string; level: string }[];
}

export interface ResumeTemplate {
  id: string;
  name: string;
  category: 'modern' | 'classic' | 'creative' | 'minimal' | 'executive' | 'tech';
  description: string;
  accentColor: string;
  fontStack: string;
  // CSS classes applied to the resume container
  containerClass: string;
  // Renders the resume HTML from data
  render: (data: ResumeData) => string;
}

// ─── Helper: escape HTML ────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Helper: contact line ───────────────────────────────────────────────────
function contactLine(data: ResumeData): string {
  const parts: string[] = [];
  if (data.contact.email) parts.push(esc(data.contact.email));
  if (data.contact.phone) parts.push(esc(data.contact.phone));
  if (data.contact.location) parts.push(esc(data.contact.location));
  if (data.contact.linkedin) parts.push(esc(data.contact.linkedin));
  if (data.contact.github) parts.push(esc(data.contact.github));
  if (data.contact.website) parts.push(esc(data.contact.website));
  return parts.join(' · ');
}

// ─── 20 Templates ───────────────────────────────────────────────────────────

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  // 1. Modern Minimal
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'minimal',
    description: 'Clean lines, generous whitespace, subtle accent.',
    accentColor: '#2563eb',
    fontStack: "'Inter', -apple-system, sans-serif",
    containerClass: 'tpl-modern-minimal',
    render: (d) => `
<div class="resume tpl-modern-minimal" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:48px;color:#1a1a1a;background:#fff;">
  <header style="border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:24px;">
    <h1 style="font-size:32px;font-weight:700;margin:0;letter-spacing:-0.5px;">${esc(d.fullName)}</h1>
    <p style="font-size:16px;color:#2563eb;margin:4px 0 8px;font-weight:500;">${esc(d.title)}</p>
    <p style="font-size:13px;color:#666;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 8px;">Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 12px;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:8px;"><span style="font-weight:600;font-size:13px;">${esc(s.category)}:</span> <span style="font-size:13px;color:#555;">${s.items.map(esc).join(', ')}</span></div>`).join('')}</section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 16px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#2563eb;margin:2px 0 8px;font-weight:500;">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)}</p>${e.details ? `<p style="font-size:12px;color:#888;margin:2px 0 0;">${esc(e.details)}</p>` : ''}</div>`).join('')}</section>` : ''}
</div>`,
  },

  // 2. Executive Dark Accent
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    category: 'executive',
    description: 'Bold header, dark accents, senior-level presence.',
    accentColor: '#1e293b',
    fontStack: "'Georgia', serif",
    containerClass: 'tpl-executive-dark',
    render: (d) => `
<div class="resume tpl-executive-dark" style="font-family:Georgia,serif;max-width:800px;margin:0 auto;background:#fff;color:#1e293b;">
  <header style="background:#1e293b;color:#fff;padding:32px 48px;">
    <h1 style="font-size:34px;font-weight:700;margin:0;letter-spacing:-0.5px;">${esc(d.fullName)}</h1>
    <p style="font-size:16px;color:#94a3b8;margin:4px 0 12px;font-style:italic;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#cbd5e1;margin:0;">${contactLine(d)}</p>
  </header>
  <div style="padding:32px 48px;">
  ${d.summary ? `<section style="margin-bottom:28px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:4px;margin:0 0 12px;">Executive Summary</h2><p style="font-size:14px;line-height:1.7;color:#334155;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:4px;margin:0 0 16px;">Professional Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:15px;font-weight:700;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#64748b;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#1e293b;margin:2px 0 10px;font-weight:600;">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</p><ul style="margin:0;padding-left:18px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.6;color:#475569;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:4px;margin:0 0 12px;">Core Competencies</h2>${d.skills.map(s => `<div style="margin-bottom:6px;"><span style="font-weight:700;font-size:13px;">${esc(s.category)}:</span> <span style="font-size:13px;color:#475569;">${s.items.map(esc).join(', ')}</span></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:4px;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:700;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;color:#64748b;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#475569;margin:2px 0 0;">${esc(e.school)}</p></div>`).join('')}</section>` : ''}
  </div>
</div>`,
  },

  // 3. Creative Sidebar
  {
    id: 'creative-sidebar',
    name: 'Creative Sidebar',
    category: 'creative',
    description: 'Colored sidebar with skills, main content for experience.',
    accentColor: '#7c3aed',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-creative-sidebar',
    render: (d) => `
<div class="resume tpl-creative-sidebar" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;display:flex;background:#fff;color:#1a1a1a;">
  <aside style="width:35%;background:#7c3aed;color:#fff;padding:32px 24px;">
    <h1 style="font-size:26px;font-weight:700;margin:0 0 4px;line-height:1.2;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;color:#ddd6fe;margin:0 0 24px;">${esc(d.title)}</p>
    <div style="margin-bottom:24px;">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;color:#ddd6fe;">Contact</h2>
      <p style="font-size:12px;line-height:1.6;margin:0;">${contactLine(d).split(' · ').join('<br>')}</p>
    </div>
    ${d.skills.length ? `<div style="margin-bottom:24px;"><h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;color:#ddd6fe;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:10px;"><p style="font-size:12px;font-weight:600;margin:0 0 4px;">${esc(s.category)}</p>${s.items.map(item => `<span style="display:inline-block;font-size:11px;background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:4px;margin:2px 2px 2px 0;">${esc(item)}</span>`).join('')}</div>`).join('')}</div>` : ''}
    ${d.languages && d.languages.length ? `<div><h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;color:#ddd6fe;">Languages</h2>${d.languages.map(l => `<p style="font-size:12px;margin:2px 0;">${esc(l.name)} — ${esc(l.level)}</p>`).join('')}</div>` : ''}
  </aside>
  <main style="flex:1;padding:32px 32px;">
    ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin:0 0 8px;">About</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
    ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin:0 0 16px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;border-left:3px solid #7c3aed;padding-left:16px;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><p style="font-size:13px;color:#7c3aed;margin:2px 0;font-weight:500;">${esc(e.company)}</p><p style="font-size:11px;color:#999;margin:0 0 8px;">${esc(e.dates)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:3px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
    ${d.education.length ? `<section><h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
  </main>
</div>`,
  },

  // 4. Classic Professional
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    category: 'classic',
    description: 'Traditional serif, centered header, timeless format.',
    accentColor: '#000000',
    fontStack: "'Times New Roman', serif",
    containerClass: 'tpl-classic',
    render: (d) => `
<div class="resume tpl-classic" style="font-family:'Times New Roman',serif;max-width:800px;margin:0 auto;padding:48px;color:#000;background:#fff;">
  <header style="text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="font-size:30px;font-weight:700;margin:0;letter-spacing:1px;text-transform:uppercase;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;margin:4px 0 8px;font-style:italic;">${esc(d.title)}</p>
    <p style="font-size:12px;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:700;text-transform:uppercase;text-align:center;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:4px;margin:0 0 12px;">Summary</h2><p style="font-size:14px;line-height:1.7;text-align:justify;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:700;text-transform:uppercase;text-align:center;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:4px;margin:0 0 16px;">Professional Experience</h2>${d.experience.map(e => `<div style="margin-bottom:16px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:700;margin:0;text-transform:uppercase;">${esc(e.title)}</h3><span style="font-size:12px;font-style:italic;">${esc(e.dates)}</span></div><p style="font-size:13px;margin:2px 0 8px;font-style:italic;">${esc(e.company)}${e.location ? ', ' + esc(e.location) : ''}</p><ul style="margin:0;padding-left:20px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.6;margin-bottom:3px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:700;text-transform:uppercase;text-align:center;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:4px;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:700;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;font-style:italic;">${esc(e.dates)}</span></div><p style="font-size:13px;margin:2px 0 0;font-style:italic;">${esc(e.school)}</p></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section><h2 style="font-size:16px;font-weight:700;text-transform:uppercase;text-align:center;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:4px;margin:0 0 12px;">Skills</h2>${d.skills.map(s => `<p style="font-size:13px;margin:4px 0;"><strong>${esc(s.category)}:</strong> ${s.items.map(esc).join(', ')}</p>`).join('')}</section>` : ''}
</div>`,
  },

  // 5. Tech Modern
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    category: 'tech',
    description: 'Monospace accents, green highlights, developer-friendly.',
    accentColor: '#10b981',
    fontStack: "'JetBrains Mono', 'Courier New', monospace",
    containerClass: 'tpl-tech-modern',
    render: (d) => `
<div class="resume tpl-tech-modern" style="font-family:'JetBrains Mono','Courier New',monospace;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fff;">
  <header style="margin-bottom:24px;">
    <h1 style="font-size:28px;font-weight:700;margin:0;color:#10b981;">$ ${esc(d.fullName)}</h1>
    <p style="font-size:14px;color:#666;margin:4px 0 8px;"># ${esc(d.title)}</p>
    <p style="font-size:12px;color:#999;margin:0;font-family:monospace;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;border-left:3px solid #10b981;padding-left:16px;"><h2 style="font-size:13px;text-transform:uppercase;color:#10b981;margin:0 0 8px;">// Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:13px;text-transform:uppercase;color:#10b981;margin:0 0 12px;">// Tech Stack</h2>${d.skills.map(s => `<div style="margin-bottom:8px;"><span style="font-size:13px;color:#10b981;font-weight:600;">${esc(s.category)}:</span> <span style="font-size:13px;color:#444;">[${s.items.map(i => `"${esc(i)}"`).join(', ')}]</span></div>`).join('')}</section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:13px;text-transform:uppercase;color:#10b981;margin:0 0 16px;">// Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#10b981;margin:2px 0 8px;">@ ${esc(e.company)}</p><ul style="margin:0;padding-left:16px;list-style:none;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">→ ${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:13px;text-transform:uppercase;color:#10b981;margin:0 0 12px;">// Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 6. Warm Elegant
  {
    id: 'warm-elegant',
    name: 'Warm Elegant',
    category: 'classic',
    description: 'Warm tones, serif typography, sophisticated.',
    accentColor: '#b45309',
    fontStack: "'Crimson Text', Georgia, serif",
    containerClass: 'tpl-warm-elegant',
    render: (d) => `
<div class="resume tpl-warm-elegant" style="font-family:'Crimson Text',Georgia,serif;max-width:800px;margin:0 auto;padding:48px;color:#1c1917;background:#fefefe;">
  <header style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:36px;font-weight:700;margin:0;color:#b45309;letter-spacing:-0.5px;">${esc(d.fullName)}</h1>
    <div style="width:60px;height:2px;background:#b45309;margin:12px auto;"></div>
    <p style="font-size:16px;color:#57534e;margin:0;font-style:italic;">${esc(d.title)}</p>
    <p style="font-size:13px;color:#78716c;margin:8px 0 0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:28px;"><h2 style="font-size:18px;color:#b45309;text-align:center;margin:0 0 12px;font-weight:600;">Summary</h2><p style="font-size:15px;line-height:1.8;text-align:center;color:#44403c;margin:0;font-style:italic;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:18px;color:#b45309;text-align:center;margin:0 0 20px;font-weight:600;border-bottom:1px solid #d6d3d1;padding-bottom:8px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:16px;font-weight:600;margin:0;color:#1c1917;">${esc(e.title)}</h3><span style="font-size:13px;color:#b45309;font-style:italic;">${esc(e.dates)}</span></div><p style="font-size:14px;color:#57534e;margin:4px 0 10px;">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</p><ul style="margin:0;padding-left:20px;">${e.bullets.map(b => `<li style="font-size:14px;line-height:1.7;color:#44403c;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:18px;color:#b45309;text-align:center;margin:0 0 12px;font-weight:600;">Skills</h2>${d.skills.map(s => `<p style="font-size:14px;margin:6px 0;text-align:center;"><strong style="color:#1c1917;">${esc(s.category)}:</strong> <span style="color:#57534e;">${s.items.map(esc).join(' · ')}</span></p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:18px;color:#b45309;text-align:center;margin:0 0 12px;font-weight:600;">Education</h2>${d.education.map(e => `<div style="text-align:center;margin-bottom:8px;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:14px;color:#57534e;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 7. Bold Red Accent
  {
    id: 'bold-red',
    name: 'Bold Red',
    category: 'modern',
    description: 'Strong red accent, impactful headers.',
    accentColor: '#dc2626',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-bold-red',
    render: (d) => `
<div class="resume tpl-bold-red" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fff;">
  <header style="background:#dc2626;color:#fff;padding:24px 32px;margin:-40px -40px 24px;">
    <h1 style="font-size:32px;font-weight:800;margin:0;text-transform:uppercase;letter-spacing:1px;">${esc(d.fullName)}</h1>
    <p style="font-size:16px;margin:4px 0 8px;color:#fecaca;">${esc(d.title)}</p>
    <p style="font-size:12px;margin:0;color:#fee2e2;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#dc2626;text-transform:uppercase;margin:0 0 8px;border-bottom:2px solid #dc2626;padding-bottom:4px;">Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#dc2626;text-transform:uppercase;margin:0 0 16px;border-bottom:2px solid #dc2626;padding-bottom:4px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;margin:0;color:#1a1a1a;">${esc(e.title)}</h3><div style="display:flex;justify-content:space-between;"><p style="font-size:14px;color:#dc2626;margin:2px 0 8px;font-weight:600;">${esc(e.company)}</p><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#dc2626;text-transform:uppercase;margin:0 0 12px;border-bottom:2px solid #dc2626;padding-bottom:4px;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:6px;"><span style="font-weight:700;font-size:13px;">${esc(s.category)}:</span> <span style="font-size:13px;color:#555;">${s.items.map(esc).join(', ')}</span></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:15px;font-weight:700;color:#dc2626;text-transform:uppercase;margin:0 0 12px;border-bottom:2px solid #dc2626;padding-bottom:4px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 8. Compact Two-Column
  {
    id: 'compact-twocol',
    name: 'Compact Two-Column',
    category: 'modern',
    description: 'Space-efficient, information-dense layout.',
    accentColor: '#0ea5e9',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-compact-twocol',
    render: (d) => `
<div class="resume tpl-compact-twocol" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:32px;color:#1a1a1a;background:#fff;">
  <header style="margin-bottom:20px;">
    <h1 style="font-size:28px;font-weight:700;margin:0;color:#0ea5e9;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;color:#666;margin:2px 0 4px;">${esc(d.title)}</p>
    <p style="font-size:11px;color:#999;margin:0;">${contactLine(d)}</p>
  </header>
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      ${d.summary ? `<section style="margin-bottom:16px;"><h2 style="font-size:13px;text-transform:uppercase;color:#0ea5e9;margin:0 0 6px;">Summary</h2><p style="font-size:13px;line-height:1.5;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
      ${d.experience.length ? `<section style="margin-bottom:16px;"><h2 style="font-size:13px;text-transform:uppercase;color:#0ea5e9;margin:0 0 12px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.title)}</h3><p style="font-size:12px;color:#0ea5e9;margin:1px 0 6px;">${esc(e.company)} · ${esc(e.dates)}</p><ul style="margin:0;padding-left:14px;">${e.bullets.map(b => `<li style="font-size:12px;line-height:1.4;color:#444;margin-bottom:2px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
    </div>
    <div>
      ${d.skills.length ? `<section style="margin-bottom:16px;"><h2 style="font-size:13px;text-transform:uppercase;color:#0ea5e9;margin:0 0 8px;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:6px;"><p style="font-size:11px;font-weight:600;margin:0 0 2px;">${esc(s.category)}</p><p style="font-size:11px;color:#555;margin:0;">${s.items.map(esc).join(', ')}</p></div>`).join('')}</section>` : ''}
      ${d.education.length ? `<section style="margin-bottom:16px;"><h2 style="font-size:13px;text-transform:uppercase;color:#0ea5e9;margin:0 0 8px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:6px;"><p style="font-size:12px;font-weight:600;margin:0;">${esc(e.degree)}</p><p style="font-size:11px;color:#666;margin:1px 0 0;">${esc(e.school)}</p><p style="font-size:11px;color:#999;margin:0;">${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
    </div>
  </div>
</div>`,
  },

  // 9. Gradient Header
  {
    id: 'gradient-header',
    name: 'Gradient Header',
    category: 'creative',
    description: 'Eye-catching gradient header, modern body.',
    accentColor: '#8b5cf6',
    fontStack: "'Poppins', sans-serif",
    containerClass: 'tpl-gradient-header',
    render: (d) => `
<div class="resume tpl-gradient-header" style="font-family:'Poppins',sans-serif;max-width:800px;margin:0 auto;background:#fff;color:#1a1a1a;">
  <header style="background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;padding:40px 48px;">
    <h1 style="font-size:34px;font-weight:700;margin:0;">${esc(d.fullName)}</h1>
    <p style="font-size:16px;margin:4px 0 12px;opacity:0.9;">${esc(d.title)}</p>
    <p style="font-size:12px;margin:0;opacity:0.8;">${contactLine(d)}</p>
  </header>
  <div style="padding:32px 48px;">
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 8px;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">About Me</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 16px;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#8b5cf6;margin:2px 0 8px;font-weight:500;">${esc(e.company)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 12px;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Skills</h2><div style="display:flex;flex-wrap:wrap;gap:8px;">${d.skills.flatMap(s => s.items).map(item => `<span style="font-size:12px;padding:4px 12px;background:#f3e8ff;color:#8b5cf6;border-radius:20px;font-weight:500;">${esc(item)}</span>`).join('')}</div></section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:16px;font-weight:600;margin:0 0 12px;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
  </div>
</div>`,
  },

  // 10. Minimal Line
  {
    id: 'minimal-line',
    name: 'Minimal Line',
    category: 'minimal',
    description: 'Ultra-clean, thin lines, lots of whitespace.',
    accentColor: '#000000',
    fontStack: "'Helvetica Neue', sans-serif",
    containerClass: 'tpl-minimal-line',
    render: (d) => `
<div class="resume tpl-minimal-line" style="font-family:'Helvetica Neue',sans-serif;max-width:700px;margin:0 auto;padding:60px 40px;color:#000;background:#fff;">
  <header style="margin-bottom:40px;">
    <h1 style="font-size:36px;font-weight:300;margin:0;letter-spacing:-1px;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;color:#999;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">${esc(d.title)}</p>
    <p style="font-size:11px;color:#ccc;margin:12px 0 0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:32px;"><p style="font-size:15px;line-height:1.8;color:#333;margin:0;font-weight:300;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:32px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin:0 0 24px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:24px;"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;"><h3 style="font-size:16px;font-weight:500;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#666;margin:0 0 12px;">${esc(e.company)}</p><ul style="margin:0;padding-left:16px;list-style:none;">${e.bullets.map(b => `<li style="font-size:14px;line-height:1.6;color:#444;margin-bottom:6px;font-weight:300;">— ${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:32px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin:0 0 16px;">Skills</h2>${d.skills.map(s => `<p style="font-size:14px;margin:4px 0;font-weight:300;"><span style="color:#999;">${esc(s.category)}:</span> ${s.items.map(esc).join(', ')}</p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin:0 0 16px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:500;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 11. Emerald Green
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    category: 'modern',
    description: 'Fresh green accent, clean and energetic.',
    accentColor: '#059669',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-emerald',
    render: (d) => `
<div class="resume tpl-emerald" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fff;">
  <header style="margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #059669;">
    <h1 style="font-size:30px;font-weight:700;margin:0;color:#059669;">${esc(d.fullName)}</h1>
    <p style="font-size:15px;color:#666;margin:4px 0 8px;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#999;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;color:#059669;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Profile</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;color:#059669;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;padding-left:16px;border-left:3px solid #059669;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><p style="font-size:13px;color:#059669;margin:2px 0 4px;font-weight:500;">${esc(e.company)} · ${esc(e.dates)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;color:#059669;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:8px;"><span style="font-weight:600;font-size:13px;color:#059669;">${esc(s.category)}:</span> <span style="font-size:13px;color:#444;">${s.items.map(esc).join(', ')}</span></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:14px;color:#059669;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 12. Corporate Blue
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'executive',
    description: 'Trust-building blue, perfect for enterprise roles.',
    accentColor: '#1e40af',
    fontStack: "'Calibri', sans-serif",
    containerClass: 'tpl-corporate-blue',
    render: (d) => `
<div class="resume tpl-corporate-blue" style="font-family:Calibri,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fff;">
  <header style="background:#1e40af;color:#fff;padding:24px 32px;margin:-40px -40px 24px;">
    <h1 style="font-size:28px;font-weight:700;margin:0;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;margin:4px 0 8px;color:#bfdbfe;">${esc(d.title)}</p>
    <p style="font-size:11px;margin:0;color:#dbeafe;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;">Professional Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:4px;margin:0 0 16px;text-transform:uppercase;">Work Experience</h2>${d.experience.map(e => `<div style="margin-bottom:18px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:700;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#666;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#1e40af;margin:2px 0 8px;font-weight:600;">${esc(e.company)}</p><ul style="margin:0;padding-left:18px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:3px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:15px;font-weight:700;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:4px;margin:0 0 12px;text-transform:uppercase;">Key Skills</h2>${d.skills.map(s => `<p style="font-size:13px;margin:4px 0;"><strong>${esc(s.category)}:</strong> ${s.items.map(esc).join(', ')}</p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:15px;font-weight:700;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:4px;margin:0 0 12px;text-transform:uppercase;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:700;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;color:#666;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 13. Creative Circles
  {
    id: 'creative-circles',
    name: 'Creative Circles',
    category: 'creative',
    description: 'Circle bullet points, playful but professional.',
    accentColor: '#f59e0b',
    fontStack: "'Quicksand', sans-serif",
    containerClass: 'tpl-creative-circles',
    render: (d) => `
<div class="resume tpl-creative-circles" style="font-family:'Quicksand',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fffbeb;">
  <header style="text-align:center;margin-bottom:28px;">
    <div style="width:80px;height:80px;background:#f59e0b;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:700;">${esc(d.fullName.charAt(0))}</div>
    <h1 style="font-size:28px;font-weight:700;margin:0;color:#92400e;">${esc(d.fullName)}</h1>
    <p style="font-size:15px;color:#f59e0b;margin:4px 0 8px;font-weight:500;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#78716c;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;text-align:center;"><p style="font-size:14px;line-height:1.6;color:#444;margin:0;max-width:600px;margin:0 auto;font-style:italic;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;color:#92400e;text-align:center;margin:0 0 16px;font-weight:600;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:16px;background:#fff;padding:16px;border-radius:12px;border:2px solid #fde68a;"><h3 style="font-size:15px;font-weight:700;margin:0;color:#92400e;">${esc(e.title)}</h3><p style="font-size:13px;color:#f59e0b;margin:2px 0 8px;font-weight:500;">${esc(e.company)} · ${esc(e.dates)}</p><ul style="margin:0;padding-left:20px;list-style:none;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">◯ ${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;color:#92400e;text-align:center;margin:0 0 12px;font-weight:600;">Skills</h2><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">${d.skills.flatMap(s => s.items).map(item => `<span style="font-size:12px;padding:6px 14px;background:#f59e0b;color:#fff;border-radius:20px;font-weight:500;">${esc(item)}</span>`).join('')}</div></section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:16px;color:#92400e;text-align:center;margin:0 0 12px;font-weight:600;">Education</h2>${d.education.map(e => `<div style="text-align:center;margin-bottom:8px;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#78716c;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 14. Stark Black & White
  {
    id: 'stark-bw',
    name: 'Stark Black & White',
    category: 'minimal',
    description: 'Maximum contrast, no color, pure typography.',
    accentColor: '#000000',
    fontStack: "'Helvetica', sans-serif",
    containerClass: 'tpl-stark-bw',
    render: (d) => `
<div class="resume tpl-stark-bw" style="font-family:Helvetica,sans-serif;max-width:750px;margin:0 auto;padding:48px;color:#000;background:#fff;">
  <header style="margin-bottom:32px;">
    <h1 style="font-size:42px;font-weight:900;margin:0;letter-spacing:-2px;line-height:1;">${esc(d.fullName).toUpperCase()}</h1>
    <p style="font-size:14px;margin:8px 0 4px;font-weight:700;letter-spacing:1px;">${esc(d.title).toUpperCase()}</p>
    <p style="font-size:11px;margin:0;color:#000;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:28px;"><h2 style="font-size:12px;font-weight:900;margin:0 0 8px;letter-spacing:2px;border-bottom:3px solid #000;padding-bottom:4px;">SUMMARY</h2><p style="font-size:14px;line-height:1.6;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:12px;font-weight:900;margin:0 0 16px;letter-spacing:2px;border-bottom:3px solid #000;padding-bottom:4px;">EXPERIENCE</h2>${d.experience.map(e => `<div style="margin-bottom:18px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:16px;font-weight:900;margin:0;">${esc(e.title).toUpperCase()}</h3><span style="font-size:11px;font-weight:700;">${esc(e.dates)}</span></div><p style="font-size:13px;margin:2px 0 10px;font-weight:700;">${esc(e.company).toUpperCase()}</p><ul style="margin:0;padding-left:16px;list-style:none;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;margin-bottom:4px;padding-left:12px;text-indent:-12px;">▪ ${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:12px;font-weight:900;margin:0 0 12px;letter-spacing:2px;border-bottom:3px solid #000;padding-bottom:4px;">SKILLS</h2>${d.skills.map(s => `<p style="font-size:13px;margin:4px 0;"><strong>${esc(s.category).toUpperCase()}:</strong> ${s.items.map(esc).join(', ')}</p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:12px;font-weight:900;margin:0 0 12px;letter-spacing:2px;border-bottom:3px solid #000;padding-bottom:4px;">EDUCATION</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:900;margin:0;">${esc(e.degree).toUpperCase()}</h3><span style="font-size:11px;font-weight:700;">${esc(e.dates)}</span></div><p style="font-size:13px;margin:2px 0 0;font-weight:700;">${esc(e.school).toUpperCase()}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 15. Soft Pastel
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    category: 'creative',
    description: 'Gentle pastel tones, approachable and friendly.',
    accentColor: '#a78bfa',
    fontStack: "'Nunito', sans-serif",
    containerClass: 'tpl-soft-pastel',
    render: (d) => `
<div class="resume tpl-soft-pastel" style="font-family:'Nunito',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#faf5ff;">
  <header style="background:#ede9fe;border-radius:16px;padding:24px 32px;margin-bottom:24px;">
    <h1 style="font-size:28px;font-weight:700;margin:0;color:#6d28d9;">${esc(d.fullName)}</h1>
    <p style="font-size:15px;color:#a78bfa;margin:4px 0 8px;font-weight:500;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#7c3aed;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:20px;background:#fff;padding:16px 20px;border-radius:12px;"><h2 style="font-size:14px;color:#6d28d9;margin:0 0 8px;font-weight:600;">About</h2><p style="font-size:14px;line-height:1.6;color:#444;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:20px;"><h2 style="font-size:16px;color:#6d28d9;margin:0 0 12px;font-weight:600;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:12px;background:#fff;padding:16px 20px;border-radius:12px;"><h3 style="font-size:15px;font-weight:700;margin:0;color:#1a1a1a;">${esc(e.title)}</h3><p style="font-size:13px;color:#a78bfa;margin:2px 0 8px;font-weight:500;">${esc(e.company)} · ${esc(e.dates)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:20px;background:#fff;padding:16px 20px;border-radius:12px;"><h2 style="font-size:14px;color:#6d28d9;margin:0 0 10px;font-weight:600;">Skills</h2><div style="display:flex;flex-wrap:wrap;gap:6px;">${d.skills.flatMap(s => s.items).map(item => `<span style="font-size:12px;padding:4px 12px;background:#ede9fe;color:#6d28d9;border-radius:16px;font-weight:500;">${esc(item)}</span>`).join('')}</div></section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:16px;color:#6d28d9;margin:0 0 12px;font-weight:600;">Education</h2>${d.education.map(e => `<div style="background:#fff;padding:12px 20px;border-radius:12px;margin-bottom:8px;"><h3 style="font-size:14px;font-weight:700;margin:0;">${esc(e.degree)}</h3><p style="font-size:13px;color:#a78bfa;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 16. Modern Grid
  {
    id: 'modern-grid',
    name: 'Modern Grid',
    category: 'modern',
    description: 'Card-based layout with clear visual separation.',
    accentColor: '#06b6d4',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-modern-grid',
    render: (d) => `
<div class="resume tpl-modern-grid" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#f8fafc;">
  <header style="background:#06b6d4;color:#fff;padding:24px 32px;border-radius:12px;margin-bottom:20px;">
    <h1 style="font-size:28px;font-weight:700;margin:0;">${esc(d.fullName)}</h1>
    <p style="font-size:14px;margin:4px 0 8px;opacity:0.9;">${esc(d.title)}</p>
    <p style="font-size:11px;margin:0;opacity:0.8;">${contactLine(d)}</p>
  </header>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
  ${d.summary ? `<section style="grid-column:1/-1;background:#fff;padding:20px;border-radius:12px;"><h2 style="font-size:13px;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="grid-column:1/-1;background:#fff;padding:20px;border-radius:12px;"><h2 style="font-size:13px;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:16px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:11px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#06b6d4;margin:2px 0 8px;font-weight:500;">${esc(e.company)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:3px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="background:#fff;padding:20px;border-radius:12px;"><h2 style="font-size:13px;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:8px;"><p style="font-size:12px;font-weight:600;margin:0 0 2px;">${esc(s.category)}</p><p style="font-size:12px;color:#555;margin:0;">${s.items.map(esc).join(', ')}</p></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section style="background:#fff;padding:20px;border-radius:12px;"><h2 style="font-size:13px;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:13px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:12px;color:#666;margin:2px 0 0;">${esc(e.school)}</p><p style="font-size:11px;color:#999;margin:0;">${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
  </div>
</div>`,
  },

  // 17. Elegant Serif
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    category: 'classic',
    description: 'Refined serif typography with sophisticated spacing.',
    accentColor: '#4338ca',
    fontStack: "'Playfair Display', Georgia, serif",
    containerClass: 'tpl-elegant-serif',
    render: (d) => `
<div class="resume tpl-elegant-serif" style="font-family:'Playfair Display',Georgia,serif;max-width:800px;margin:0 auto;padding:56px 48px;color:#1e1b4b;background:#fff;">
  <header style="text-align:center;margin-bottom:36px;">
    <h1 style="font-size:38px;font-weight:700;margin:0;color:#4338ca;letter-spacing:-0.5px;">${esc(d.fullName)}</h1>
    <div style="width:80px;height:1px;background:#4338ca;margin:16px auto;"></div>
    <p style="font-size:16px;color:#6366f1;margin:0;font-style:italic;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#9333ea;margin:8px 0 0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:28px;"><h2 style="font-size:16px;color:#4338ca;text-align:center;margin:0 0 12px;font-weight:600;letter-spacing:1px;">Summary</h2><p style="font-size:15px;line-height:1.8;color:#312e81;margin:0;text-align:justify;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:16px;color:#4338ca;text-align:center;margin:0 0 20px;font-weight:600;letter-spacing:1px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><h3 style="font-size:17px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:13px;color:#9333ea;font-style:italic;">${esc(e.dates)}</span></div><p style="font-size:14px;color:#6366f1;margin:4px 0 12px;font-style:italic;">${esc(e.company)}</p><ul style="margin:0;padding-left:20px;">${e.bullets.map(b => `<li style="font-size:14px;line-height:1.7;color:#312e81;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:16px;color:#4338ca;text-align:center;margin:0 0 12px;font-weight:600;letter-spacing:1px;">Skills</h2>${d.skills.map(s => `<p style="font-size:14px;margin:6px 0;text-align:center;"><strong style="color:#4338ca;">${esc(s.category)}:</strong> <span style="color:#312e81;">${s.items.map(esc).join(' · ')}</span></p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:16px;color:#4338ca;text-align:center;margin:0 0 12px;font-weight:600;letter-spacing:1px;">Education</h2>${d.education.map(e => `<div style="text-align:center;margin-bottom:8px;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:14px;color:#6366f1;margin:2px 0 0;font-style:italic;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 18. Split Color Block
  {
    id: 'split-color',
    name: 'Split Color Block',
    category: 'creative',
    description: 'Bold color block on left, content on right.',
    accentColor: '#db2777',
    fontStack: "'Inter', sans-serif",
    containerClass: 'tpl-split-color',
    render: (d) => `
<div class="resume tpl-split-color" style="font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;display:flex;background:#fff;color:#1a1a1a;">
  <div style="width:30%;background:#db2777;color:#fff;padding:32px 20px;">
    <h1 style="font-size:24px;font-weight:700;margin:0 0 4px;line-height:1.2;">${esc(d.fullName)}</h1>
    <p style="font-size:13px;opacity:0.9;margin:0 0 20px;">${esc(d.title)}</p>
    <div style="margin-bottom:20px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;opacity:0.8;">Contact</h2>
      <p style="font-size:11px;line-height:1.5;margin:0;">${contactLine(d).split(' · ').join('<br>')}</p>
    </div>
    ${d.skills.length ? `<div style="margin-bottom:20px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;opacity:0.8;">Skills</h2>${d.skills.map(s => `<p style="font-size:11px;margin:4px 0;"><strong>${esc(s.category)}:</strong> ${s.items.map(esc).join(', ')}</p>`).join('')}</div>` : ''}
    ${d.education.length ? `<div><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;opacity:0.8;">Education</h2>${d.education.map(e => `<p style="font-size:11px;margin:4px 0;"><strong>${esc(e.degree)}</strong><br>${esc(e.school)}<br>${esc(e.dates)}</p>`).join('')}</div>` : ''}
  </div>
  <main style="flex:1;padding:32px 32px;">
    ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:14px;color:#db2777;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Profile</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
    ${d.experience.length ? `<section><h2 style="font-size:14px;color:#db2777;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:11px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#db2777;margin:2px 0 8px;font-weight:500;">${esc(e.company)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  </main>
</div>`,
  },

  // 19. Underlined Headers
  {
    id: 'underlined-headers',
    name: 'Underlined Headers',
    category: 'modern',
    description: 'Clean underlines for each section, easy to scan.',
    accentColor: '#0369a1',
    fontStack: "'Segoe UI', sans-serif",
    containerClass: 'tpl-underlined',
    render: (d) => `
<div class="resume tpl-underlined" style="font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;background:#fff;">
  <header style="margin-bottom:28px;">
    <h1 style="font-size:30px;font-weight:700;margin:0;color:#0369a1;">${esc(d.fullName)}</h1>
    <p style="font-size:15px;color:#666;margin:4px 0 6px;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#999;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 8px;padding-bottom:4px;border-bottom:2px solid #0369a1;color:#0369a1;">Summary</h2><p style="font-size:14px;line-height:1.6;color:#333;margin:0;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 16px;padding-bottom:4px;border-bottom:2px solid #0369a1;color:#0369a1;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:18px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.title)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#0369a1;margin:2px 0 8px;font-weight:500;">${esc(e.company)}</p><ul style="margin:0;padding-left:16px;">${e.bullets.map(b => `<li style="font-size:13px;line-height:1.5;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:600;margin:0 0 12px;padding-bottom:4px;border-bottom:2px solid #0369a1;color:#0369a1;">Skills</h2>${d.skills.map(s => `<div style="margin-bottom:6px;"><span style="font-weight:600;font-size:13px;">${esc(s.category)}:</span> <span style="font-size:13px;color:#555;">${s.items.map(esc).join(', ')}</span></div>`).join('')}</section>` : ''}
  ${d.education.length ? `<section><h2 style="font-size:16px;font-weight:600;margin:0 0 12px;padding-bottom:4px;border-bottom:2px solid #0369a1;color:#0369a1;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><h3 style="font-size:14px;font-weight:600;margin:0;">${esc(e.degree)}</h3><span style="font-size:12px;color:#999;">${esc(e.dates)}</span></div><p style="font-size:13px;color:#666;margin:2px 0 0;">${esc(e.school)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },

  // 20. Bold Centered
  {
    id: 'bold-centered',
    name: 'Bold Centered',
    category: 'executive',
    description: 'Everything centered, commanding presence.',
    accentColor: '#7c2d12',
    fontStack: "'Cambria', serif",
    containerClass: 'tpl-bold-centered',
    render: (d) => `
<div class="resume tpl-bold-centered" style="font-family:Cambria,serif;max-width:800px;margin:0 auto;padding:48px;color:#1a1a1a;background:#fff;">
  <header style="text-align:center;margin-bottom:32px;border-bottom:4px double #7c2d12;padding-bottom:20px;">
    <h1 style="font-size:36px;font-weight:700;margin:0;color:#7c2d12;text-transform:uppercase;letter-spacing:2px;">${esc(d.fullName)}</h1>
    <p style="font-size:16px;color:#666;margin:8px 0 4px;font-style:italic;">${esc(d.title)}</p>
    <p style="font-size:12px;color:#999;margin:0;">${contactLine(d)}</p>
  </header>
  ${d.summary ? `<section style="margin-bottom:28px;text-align:center;"><h2 style="font-size:18px;color:#7c2d12;margin:0 0 12px;font-weight:600;">Summary</h2><p style="font-size:15px;line-height:1.8;color:#333;margin:0;max-width:600px;margin:0 auto;font-style:italic;">${esc(d.summary)}</p></section>` : ''}
  ${d.experience.length ? `<section style="margin-bottom:28px;"><h2 style="font-size:18px;color:#7c2d12;text-align:center;margin:0 0 20px;font-weight:600;">Experience</h2>${d.experience.map(e => `<div style="margin-bottom:18px;text-align:center;"><h3 style="font-size:16px;font-weight:700;margin:0;">${esc(e.title)}</h3><p style="font-size:14px;color:#7c2d12;margin:2px 0;font-weight:600;">${esc(e.company)}</p><p style="font-size:12px;color:#999;margin:0 0 8px;font-style:italic;">${esc(e.dates)}</p><ul style="margin:0;padding-left:20px;text-align:left;max-width:600px;margin:0 auto;">${e.bullets.map(b => `<li style="font-size:14px;line-height:1.6;color:#444;margin-bottom:4px;">${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>` : ''}
  ${d.skills.length ? `<section style="margin-bottom:28px;text-align:center;"><h2 style="font-size:18px;color:#7c2d12;margin:0 0 12px;font-weight:600;">Skills</h2>${d.skills.map(s => `<p style="font-size:14px;margin:6px 0;"><strong style="color:#7c2d12;">${esc(s.category)}:</strong> ${s.items.map(esc).join(' · ')}</p>`).join('')}</section>` : ''}
  ${d.education.length ? `<section style="text-align:center;"><h2 style="font-size:18px;color:#7c2d12;margin:0 0 12px;font-weight:600;">Education</h2>${d.education.map(e => `<div style="margin-bottom:8px;"><h3 style="font-size:15px;font-weight:600;margin:0;">${esc(e.degree)}</h3><p style="font-size:14px;color:#666;margin:2px 0 0;">${esc(e.school)} · ${esc(e.dates)}</p></div>`).join('')}</section>` : ''}
</div>`,
  },
];

export function getTemplate(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}

export function getRandomTemplate(): ResumeTemplate {
  return RESUME_TEMPLATES[Math.floor(Math.random() * RESUME_TEMPLATES.length)];
}

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'creative', label: 'Creative' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'executive', label: 'Executive' },
  { id: 'tech', label: 'Tech' },
];
