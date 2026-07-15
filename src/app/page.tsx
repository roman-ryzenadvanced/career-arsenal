'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Upload, FileText, Sparkles, Moon, Sun, Loader2, Check, AlertCircle,
  RefreshCw, History, Copy, Download, ChevronRight, Target, X, Github,
  Menu, Trash2, FileUp, MessageCircle, Mail, ExternalLink, Zap, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { ALL_SKILLS, CAREER_SKILLS, HR_SKILLS, type Skill } from '@/lib/skills';
import { useI18n } from '@/lib/i18n-context';
import { LOCALES } from '@/lib/i18n';
import { PugLoader } from '@/components/pug-loader';
import { HRChatButton } from '@/components/hr-chat-button';
import { ResumeBuilderDialog } from '@/components/resume-builder-dialog';
import { CoverLetterBuilderDialog } from '@/components/cover-letter-builder-dialog';
import { JobFinderDialog } from '@/components/job-finder-dialog';
import { FileText as ResumeIcon, Mail as CoverLetterIcon, Sparkles as SparklesIcon, Briefcase as JobFinderIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface ProfileInfo {
  id: string;
  fullName?: string | null;
  sourceKind: string;
  fileName?: string | null;
  textPreview: string;
  textLength: number;
  targetRole?: string | null;
  targetContext?: string | null;
  createdAt: string;
  counts?: { skillRuns: number; uploads: number };
}

interface RunInfo {
  id: string;
  skillId: string;
  skillName: string;
  output: string;
  modelUsed?: string | null;
  createdAt: string;
}

// ─── Icon resolver ─────────────────────────────────────────────────────────
import {
  Compass, FileText as FileTextIcon, Linkedin, Mic, DollarSign,
  TrendingUp, Crosshair, FileSignature, Users, ClipboardCheck, Gift,
  Rocket, GitBranch, ShieldCheck, HeartHandshake,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  Compass, FileText: FileTextIcon, Mail, Linkedin, Mic, DollarSign,
  TrendingUp, Crosshair, FileSignature, Users, ClipboardCheck, Gift,
  Rocket, GitBranch, ShieldCheck, HeartHandshake,
};

function SkillIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon className={className} />;
}

// ─── Defensive JSON parser ─────────────────────────────────────────────────────
// Returns `{ error: string }` when the response isn't valid JSON (e.g. empty 502
// body, HTML error page from a proxy, gateway timeout). This prevents the
// frontend from crashing with "JSON.parse: unexpected end of data".
async function safeJson(res: Response, fallbackError = 'Request failed.'): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return { error: res.status === 502
      ? 'Server is temporarily unreachable (502). Please wait a few seconds and try again.'
      : `Server returned an empty response (HTTP ${res.status}).` };
  }
  try {
    return JSON.parse(text);
  } catch {
    // Response is HTML or some other non-JSON body (typical for 502/500 error pages)
    return { error: res.status === 502
      ? 'Server is temporarily unreachable (502). Please wait a few seconds and try again.'
      : `Server error (HTTP ${res.status}). Please try again.` };
  }
}

// ─── Theme toggle ──────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  /* eslint-disable react-hooks/set-state-in-effect */
  const [mounted, setMounted] = useState(false);
  // next-themes recommends this mounted-guard pattern to avoid hydration
  // mismatch when reading the resolved theme on the client.
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  if (!mounted) return <div className="h-9 w-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="h-9 w-9"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

// ─── Language switcher ─────────────────────────────────────────────────────
function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2" aria-label="Language">
          <Globe className="h-4 w-4" />
          <span className="text-base leading-none">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`cursor-pointer gap-2 ${l.code === locale ? 'font-semibold bg-accent' : ''}`}
          >
            <span className="text-base">{l.flag}</span>
            <span>{l.label}</span>
            {l.code === locale && <Check className="h-3.5 w-3.5 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Upload hook (reusable file-picker logic) ─────────────────────────────────
function useFileUpload(
  onSuccess: (p: ProfileInfo) => void,
  onRunsReload: () => void,
) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      // Parse the file CLIENT-SIDE (in the browser) to avoid the edge layer's
      // body size limit and multipart corruption. Only the extracted text
      // (typically 5-15KB) is sent to the server.
      //
      // PDF/DOCX parsing libraries are loaded from CDN (not bundled) to avoid
      // worker resolution issues with Next.js/Turbopack.
      const lowerName = file.name.toLowerCase();
      let extractedText = '';

      if (lowerName.endsWith('.pdf')) {
        // Load pdfjs v3 from CDN
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load PDF parser from CDN'));
            document.head.appendChild(s);
          });
        }
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), isEvalSupported: false, useWorkerFetch: false });
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => item.str || '').join(' ') + '\n\n';
        }
        try { await pdf.destroy(); } catch {}
      } else if (lowerName.endsWith('.docx')) {
        // Load mammoth from CDN
        if (!(window as any).mammoth) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load DOCX parser from CDN'));
            document.head.appendChild(s);
          });
        }
        const mammoth = (window as any).mammoth;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value || '';
      } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
      }

      extractedText = extractedText.trim();
      if (extractedText.length < 50) {
        throw new Error('The file appears to be empty or could not be parsed (text too short).');
      }

      const sourceKind = lowerName.includes('linkedin') ? 'linkedin' : 'resume';

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: {
            text: extractedText,
            sourceKind,
            fileName: file.name,
            fileSize: file.size,
          },
        }),
      });
      const data = await safeJson(res, 'Upload failed.');
      if (!res.ok) {
        setError(data.error || t('error.uploadFailed'));
        toast({ title: t('toast.uploadFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: t('toast.profileReady'),
        description: t('toast.profileReadyDesc', { count: data.profile.textLength.toLocaleString(), file: data.profile.fileName }),
      });
      onSuccess(data.profile);
      onRunsReload();
    } catch (e: any) {
      setError(e?.message || 'Network error during upload.');
      toast({ title: t('toast.uploadFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [onSuccess, onRunsReload, toast]);

  return { uploading, error, handleFile };
}

// ─── Upload Zone (landing state) ────────────────────────────────────────────────
function UploadZone({ onUploaded, onProfileLoaded }: {
  onUploaded: (p: ProfileInfo) => void;
  onProfileLoaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploading, error, handleFile } = useFileUpload(onUploaded, onProfileLoaded);
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`upload-zone relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          dragging ? 'border-foreground/60 bg-foreground/[0.03]' : 'border-border'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <PugLoader message={t('pug.parsing')} size="md" />
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.04]">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {t('hero.dropHere')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('hero.supports')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('hero.chooseFile')}
            </Button>
          </>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── Compact Replace / Clear buttons (used in ProfilePanel) ─────────────────────
function ProfileActions({ onUploaded, onProfileLoaded, onCleared }: {
  onUploaded: (p: ProfileInfo) => void;
  onProfileLoaded: () => void;
  onCleared: () => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [clearing, setClearing] = useState(false);
  const { uploading, handleFile } = useFileUpload(onUploaded, onProfileLoaded);
  const { toast } = useToast();

  const clearProfile = async () => {
    if (!confirm(t('profile.clearConfirm'))) return;
    setClearing(true);
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE' });
      const data = await safeJson(res, t('error.clearFailed'));
      if (!res.ok) throw new Error(data.error || t('error.clearFailed'));
      toast({ title: t('toast.profileCleared'), description: t('toast.profileClearedDesc') });
      onCleared();
    } catch (e: any) {
      toast({ title: t('toast.clearFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || clearing}
      >
        {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileUp className="h-3 w-3 mr-1" />}
        {uploading ? '…' : t('profile.replaceCV')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-muted-foreground hover:text-destructive"
        onClick={clearProfile}
        disabled={uploading || clearing}
      >
        {clearing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
        {t('profile.clear')}
      </Button>
    </div>
  );
}

// ─── Profile Panel ──────────────────────────────────────────────────────────
function ProfilePanel({ profile, onChanged, onCleared }: {
  profile: ProfileInfo;
  onChanged: () => void;
  onCleared: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [targetRole, setTargetRole] = useState(profile.targetRole || '');
  const [targetContext, setTargetContext] = useState(profile.targetContext || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFullName(profile.fullName || '');
    setTargetRole(profile.targetRole || '');
    setTargetContext(profile.targetContext || '');
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, targetRole, targetContext }),
      });
      const data = await safeJson(res, 'Save failed.');
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast({ title: t('toast.profileUpdated') });
      setEditing(false);
      onChanged();
    } catch (e: any) {
      toast({ title: t('toast.saveFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {fullName || t('profile.yourProfile')}
              </CardTitle>
              <CardDescription className="truncate text-xs">
                {profile.fileName} · {profile.textLength.toLocaleString()} chars ·{' '}
                <Badge variant="secondary" className="ml-0.5 px-1 py-0 text-[10px]">
                  {profile.sourceKind === 'linkedin' ? 'LinkedIn' : 'Resume'}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)} className="h-7 text-xs">
            {editing ? t('profile.cancel') : t('profile.edit')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!editing ? (
          <>
            {targetRole && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('profile.targetRole')} </span>
                <span className="font-medium">{targetRole}</span>
              </div>
            )}
            {targetContext && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('profile.context')} </span>
                <span className="text-muted-foreground">{targetContext}</span>
              </div>
            )}
            {profile.counts && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{profile.counts.skillRuns} skill run{profile.counts.skillRuns !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{profile.counts.uploads} upload{profile.counts.uploads !== 1 ? 's' : ''}</span>
              </div>
            )}
            <ProfileActions
              onUploaded={(p) => { onChanged(); }}
              onProfileLoaded={() => {}}
              onCleared={onCleared}
            />
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="fullName" className="text-xs">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="targetRole" className="text-xs">Target role / direction</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. COO at Series A Web3 startup"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="targetContext" className="text-xs">Additional context (optional)</Label>
              <Textarea
                id="targetContext"
                value={targetContext}
                onChange={(e) => setTargetContext(e.target.value)}
                placeholder="Anything else skills should know — target companies, constraints, goals..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skill Card ────────────────────────────────────────────────────────────
function SkillCard({ skill, onRun }: { skill: Skill; onRun: (s: Skill) => void }) {
  const { t } = useI18n();
  return (
    <Card className="group flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => onRun(skill)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${skill.color}`}>
            <SkillIcon name={skill.icon} className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="text-sm mt-2">{skill.nameKey ? t(skill.nameKey) : skill.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{skill.taglineKey ? t(skill.taglineKey) : skill.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <Badge variant="outline" className="text-[10px]">
          {skill.category === 'career' ? t('skill.category.career') : t('skill.category.hr')}
        </Badge>
      </CardContent>
    </Card>
  );
}

// ─── Skill Run Dialog ────────────────────────────────────────────────────────
function SkillRunDialog({ skill, open, onOpenChange, onSaved }: {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Reset inputs/result when skill changes
  useEffect(() => {
    if (skill) {
      const defaults: Record<string, string> = {};
      skill.inputs.forEach((i) => {
        if (i.defaultValue) defaults[i.key] = i.defaultValue;
      });
      setInputValues(defaults);
      setResult(null);
      setError(null);
      setModelUsed(null);
    }
  }, [skill]);

  const run = async () => {
    if (!skill) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/runs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id, inputs: inputValues }),
      });
      const data = await safeJson(res, 'Run failed.');
      if (!res.ok) {
        setError(data.error || 'Run failed.');
        return;
      }
      setResult(data.output);
      setModelUsed(data.modelUsed);
      onSaved();
      toast({ title: t('toast.skillComplete', { skill: skill.nameKey ? t(skill.nameKey) : skill.name }), description: t('toast.skillCompleteDesc') });
    } catch (e: any) {
      setError(e?.message || 'Network error.');
    } finally {
      setRunning(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = (format: 'md' | 'html' | 'pdf' | 'doc') => {
    if (!result || !skill) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const skillName = skill.nameKey ? t(skill.nameKey) : skill.name;

    if (format === 'md') {
      const blob = new Blob([result], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.id}-${dateStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'html') {
      // Wrap markdown in a styled HTML document
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${skillName} — ${dateStr}</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 1.8em; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 1.4em; margin-top: 1.5em; }
  h3 { font-size: 1.2em; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 4px 0; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f4f4f4; }
  blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #666; font-style: italic; }
</style>
</head>
<body>
<h1>${skillName}</h1>
<div id="content"></div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(result)});
</script>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.id}-${dateStr}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Open print dialog with styled HTML
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${skillName}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 40px; line-height: 1.7; color: #000; }
  h1 { font-size: 1.8em; border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2 { font-size: 1.4em; margin-top: 1.5em; }
  h3 { font-size: 1.2em; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 4px 0; }
  code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
  pre { background: #f0f0f0; padding: 12px; border-radius: 6px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #999; padding: 8px; }
  @media print { body { max-width: none; padding: 20px; } }
</style>
</head><body>
<div id="content"></div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(result)});
  setTimeout(function() { window.print(); }, 500);
</script>
</body></html>`;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(html);
      printWindow.document.close();
    } else if (format === 'doc') {
      // DOC format — HTML with Word-compatible MIME type
      const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${skillName}</title>
<style>
  body { font-family: 'Calibri', sans-serif; font-size: 12pt; line-height: 1.5; }
  h1 { font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 4px; }
  h2 { font-size: 14pt; margin-top: 1.2em; }
  h3 { font-size: 12pt; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 3px 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #999; padding: 6px; }
</style>
</head><body>
<div id="content"></div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(result)});
</script>
</body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.id}-${dateStr}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92dvh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {skill && (
              <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${skill.color}`}>
                <SkillIcon name={skill.icon} className="h-3.5 w-3.5" />
              </div>
            )}
            {skill?.nameKey ? t(skill.nameKey) : skill?.name}
          </DialogTitle>
          <DialogDescription>{skill?.descriptionKey ? t(skill.descriptionKey) : skill?.description}</DialogDescription>
        </DialogHeader>

        {/* Native scrollable area — works on all browsers + mobile */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-4 pb-2">
            {/* Inputs */}
            <div className="space-y-3">
              {skill?.inputs.map((inp) => (
                <div key={inp.key}>
                  <Label htmlFor={`inp-${inp.key}`} className="text-xs">
                    {inp.labelKey ? t(inp.labelKey) : inp.label}
                    {inp.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {inp.helpText && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{inp.helpText}</p>
                  )}
                  {inp.type === 'textarea' ? (
                    <Textarea
                      id={`inp-${inp.key}`}
                      value={inputValues[inp.key] || ''}
                      onChange={(e) => setInputValues((p) => ({ ...p, [inp.key]: e.target.value }))}
                      placeholder={inp.placeholderKey ? t(inp.placeholderKey) : inp.placeholder}
                      className="mt-1 min-h-[100px] text-sm"
                    />
                  ) : inp.type === 'select' ? (
                    <Select
                      value={inputValues[inp.key] || inp.defaultValue || ''}
                      onValueChange={(v) => setInputValues((p) => ({ ...p, [inp.key]: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inp.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.labelKey ? t(opt.labelKey) : opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`inp-${inp.key}`}
                      type={inp.type === 'number' ? 'number' : 'text'}
                      value={inputValues[inp.key] || ''}
                      onChange={(e) => setInputValues((p) => ({ ...p, [inp.key]: e.target.value }))}
                      placeholder={inp.placeholderKey ? t(inp.placeholderKey) : inp.placeholder}
                      className="mt-1 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('error.runFailed')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {running && (
              <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
                <PugLoader message={t('pug.thinking')} size="lg" />
              </div>
            )}

            {!running && result && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {t('skill.dialog.generated')} {modelUsed || 'GLM'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={copy} className="h-7 text-xs">
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? t('skill.dialog.copied') : t('skill.dialog.copy')}
                    </Button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <Button size="sm" variant="ghost" onClick={() => download('md')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      {t('skill.dialog.exportMD')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => download('html')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      {t('skill.dialog.exportHTML')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => download('pdf')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      {t('skill.dialog.exportPDF')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => download('doc')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      {t('skill.dialog.exportDOC')}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('skill.dialog.close')}</Button>
          <Button onClick={run} disabled={running || !skill}>
            {running ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('skill.dialog.running')}</>
            ) : result ? (
              <><RefreshCw className="mr-2 h-4 w-4" /> {t('skill.dialog.rerun')}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> {t('skill.dialog.runWithGLM')}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────
function HistoryPanel({ runs, onClear }: { runs: RunInfo[]; onClear: () => void }) {
  const { t } = useI18n();
  if (runs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
        {t('history.empty')}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {runs.map((r) => (
        <Card key={r.id} className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{r.skillId}</Badge>
                <span className="font-medium text-sm">{r.skillName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.output.slice(0, 200)}…</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(r.createdAt).toLocaleString()} · {r.modelUsed}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Top promo banner (GLM 5.2 + Telegram) ───────────────────────────────────
function PromoBanner() {
  const { t } = useI18n();
  return (
    <div className="border-b bg-gradient-to-r from-foreground/[0.03] via-foreground/[0.05] to-foreground/[0.03] animate-fade-in-up">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs">
        <a
          href="https://z.ai/subscribe?ic=ROK78RJKNW"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>{t('banner.glm')}</span>
          <span className="text-muted-foreground">— {t('banner.glmDesc')}</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
        <span className="hidden sm:inline text-muted-foreground/60">·</span>
        <a
          href="https://t.me/VibeCodePrompterSystem"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5 text-sky-500" />
          <span>{t('banner.telegram')}</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </div>
    </div>
  );
}

// ─── Bottom author footer ────────────────────────────────────────────────────
function AuthorFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t mt-auto bg-gradient-to-b from-transparent to-foreground/[0.02]">
      {/* Top promo banner (mirrored at bottom for visibility) */}
      <div className="border-b bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <a
            href="https://z.ai/subscribe?ic=ROK78RJKNW"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{t('banner.glm')} · {t('banner.glmDesc')}</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <span className="hidden sm:inline text-muted-foreground/60">·</span>
          <a
            href="https://t.me/VibeCodePrompterSystem"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-sky-500" />
            <span>{t('banner.telegram')}</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Author row */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{t('footer.author')}</span>
            <a
              href="https://www.rommark.dev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rommark.Dev
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{t('footer.connect')}</span>
            <a
              href="mailto:rommark@gmx.com"
              className="inline-flex items-center gap-1.5 font-medium hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              rommark@gmx.com
            </a>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-center text-[11px] text-muted-foreground">
          {t('footer.tagline')}
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);
  const [coverLetterBuilderOpen, setCoverLetterBuilderOpen] = useState(false);
  const [jobFinderOpen, setJobFinderOpen] = useState(false);
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [tab, setTab] = useState<'all' | 'career' | 'hr'>('all');

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await safeJson(res);
      setProfile(data.profile || null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/runs', { cache: 'no-store' });
      const data = await safeJson(res);
      setRuns(data.runs || []);
    } catch {
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadRuns();
  }, [loadProfile, loadRuns]);

  const clearProfile = useCallback(async () => {
    setProfile(null);
    setRuns([]);
    await loadProfile();
    await loadRuns();
  }, [loadProfile, loadRuns]);

  const openSkill = (s: Skill) => {
    setActiveSkill(s);
    setDialogOpen(true);
  };

  // Open a skill by ID (used by HR chat actions)
  const openSkillById = useCallback((skillId: string) => {
    const skill = ALL_SKILLS.find((s) => s.id === skillId);
    if (skill) {
      setActiveSkill(skill);
      setDialogOpen(true);
    } else {
      console.warn('Skill not found:', skillId);
    }
  }, []);

  // Update target role from chat action
  const updateTargetRoleFromChat = useCallback(async (role: string) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role }),
      });
      if (res.ok) {
        await loadProfile();
      }
    } catch (e) {
      console.error('Failed to update target role from chat:', e);
    }
  }, [loadProfile]);

  const filteredSkills = tab === 'all' ? ALL_SKILLS : tab === 'career' ? CAREER_SKILLS : HR_SKILLS;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-semibold text-sm sm:text-base truncate">{t('app.title')}</span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground">
                  {t('app.subtitle')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={() => {
                  loadProfile();
                  loadRuns();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t('nav.refresh')}
              </Button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Top promo banner */}
      <PromoBanner />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-10">
        {!profile && !loadingProfile && (
          /* Empty state — upload flow */
          <div className="max-w-2xl mx-auto py-8 sm:py-14 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t('hero.title1')}<br className="hidden sm:block" /> {t('hero.title2')}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                {t('hero.desc')}
              </p>
            </div>
            <UploadZone onUploaded={setProfile} onProfileLoaded={loadRuns} />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              {[
                { label: t('hero.quickAction.career'), icon: 'Compass' },
                { label: t('hero.quickAction.resume'), icon: 'FileText' },
                { label: t('hero.quickAction.cover'), icon: 'Mail' },
                { label: t('hero.quickAction.interview'), icon: 'Mic' },
                { label: t('hero.quickAction.salary'), icon: 'DollarSign' },
                { label: t('hero.quickAction.linkedin'), icon: 'Linkedin' },
                { label: t('hero.quickAction.hunt'), icon: 'Crosshair' },
                { label: t('hero.quickAction.more'), icon: 'Sparkles' },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-md border stagger-card" style={{ animationDelay: `${i * 50}ms` }}>
                  <SkillIcon name={x.icon} className="h-3.5 w-3.5" />
                  <span>{x.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingProfile && (
          <div className="max-w-2xl mx-auto py-12 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {profile && !loadingProfile && (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6 animate-fade-in-up">
            {/* Left: profile + history */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1">
              <ProfilePanel profile={profile} onChanged={loadProfile} onCleared={clearProfile} />

              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <History className="h-3.5 w-3.5" />
                    {t('history.title')}
                  </div>
                  {runs.length > 0 && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setRuns([])}>
                      <X className="h-3 w-3 mr-1" /> {t('history.hide')}
                    </Button>
                  )}
                </div>
                <HistoryPanel runs={runs} onClear={() => setRuns([])} />
              </Card>

              <div className="text-[11px] text-muted-foreground px-1">
                <p>{t('profile.hint')}</p>
              </div>
            </aside>

            {/* Right: skill grid */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{t('skills.title')}</h2>
                  <p className="text-xs text-muted-foreground">{t('skills.subtitle')}</p>
                </div>
                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs px-3 h-6">{t('skills.all')} ({ALL_SKILLS.length})</TabsTrigger>
                    <TabsTrigger value="career" className="text-xs px-3 h-6">{t('skills.career')} ({CAREER_SKILLS.length})</TabsTrigger>
                    <TabsTrigger value="hr" className="text-xs px-3 h-6">{t('skills.hiring')} ({HR_SKILLS.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Quick Action Builders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setResumeBuilderOpen(true)}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
                    <ResumeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t('resume.builderTitle')}</p>
                    <p className="text-xs text-muted-foreground truncate">20 templates · Surprise Me · PDF/HTML</p>
                  </div>
                  <SparklesIcon className="h-4 w-4 text-primary shrink-0" />
                </button>
                <button
                  onClick={() => setCoverLetterBuilderOpen(true)}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
                    <CoverLetterIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t('coverLetter.builderTitle')}</p>
                    <p className="text-xs text-muted-foreground truncate">Text · HTML · PDF formats</p>
                  </div>
                  <SparklesIcon className="h-4 w-4 text-primary shrink-0" />
                </button>
                <button
                  onClick={() => setJobFinderOpen(true)}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-left group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white group-hover:scale-110 transition-transform">
                    <JobFinderIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t('jobFinder.title')}</p>
                    <p className="text-xs text-muted-foreground truncate">LinkedIn · Indeed · Auto-Apply</p>
                  </div>
                  <SparklesIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                </button>
              </div>

              <div className="skills-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSkills.map((skill, i) => (
                  <div key={skill.id} className="stagger-card" style={{ animationDelay: `${i * 40}ms` }}>
                    <SkillCard skill={skill} onRun={openSkill} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer / author badge */}
      <AuthorFooter />

      <HRChatButton
        onRunSkill={openSkillById}
        onUpdateTargetRole={updateTargetRoleFromChat}
      />

      <SkillRunDialog
        skill={activeSkill}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={loadRuns}
      />

      <ResumeBuilderDialog
        open={resumeBuilderOpen}
        onOpenChange={setResumeBuilderOpen}
      />

      <CoverLetterBuilderDialog
        open={coverLetterBuilderOpen}
        onOpenChange={setCoverLetterBuilderOpen}
      />

      <JobFinderDialog
        open={jobFinderOpen}
        onOpenChange={setJobFinderOpen}
      />

      <Toaster />
    </div>
  );
}
