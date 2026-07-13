'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Upload, FileText, Sparkles, Moon, Sun, Loader2, Check, AlertCircle,
  RefreshCw, History, Copy, Download, ChevronRight, Target, X, Github,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  Compass, FileText as FileTextIcon, Mail, Linkedin, Mic, DollarSign,
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

// ─── Upload Zone ────────────────────────────────────────────────────────────
function UploadZone({ onUploaded, onProfileLoaded }: {
  onUploaded: (p: ProfileInfo) => void;
  onProfileLoaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Profile ready',
        description: `Parsed ${data.profile.textLength.toLocaleString()} chars from ${data.profile.fileName}.`,
      });
      onUploaded(data.profile);
      onProfileLoaded();
    } catch (e: any) {
      setError(e?.message || 'Network error during upload.');
      toast({ title: 'Upload failed', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [onUploaded, onProfileLoaded, toast]);

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
        className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.04]">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm font-medium">
          {uploading ? 'Parsing your profile…' : 'Drop your resume or LinkedIn export here'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports PDF, DOCX, TXT — we extract the text locally and store it on this device only.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <FileText className="mr-2 h-4 w-4" />
          Choose file
        </Button>
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

// ─── Profile Panel ──────────────────────────────────────────────────────────
function ProfilePanel({ profile, onChanged }: {
  profile: ProfileInfo;
  onChanged: () => void;
}) {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast({ title: 'Profile updated' });
      setEditing(false);
      onChanged();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
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
                {fullName || 'Your profile'}
              </CardTitle>
              <CardDescription className="truncate text-xs">
                {profile.fileName} · {profile.textLength.toLocaleString()} chars ·{' '}
                <Badge variant="secondary" className="ml-0.5 px-1 py-0 text-[10px]">
                  {profile.sourceKind === 'linkedin' ? 'LinkedIn' : 'Resume'}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!editing ? (
          <>
            {targetRole && (
              <div className="text-sm">
                <span className="text-muted-foreground">Target role: </span>
                <span className="font-medium">{targetRole}</span>
              </div>
            )}
            {targetContext && (
              <div className="text-sm">
                <span className="text-muted-foreground">Context: </span>
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
  return (
    <Card className="group flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => onRun(skill)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${skill.color}`}>
            <SkillIcon name={skill.icon} className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="text-sm mt-2">{skill.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{skill.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <Badge variant="outline" className="text-[10px]">
          {skill.category === 'career' ? 'Career' : 'HR / Hiring'}
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
      const res = await fetch(`/api/skills/${skill.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: inputValues }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Run failed.');
        return;
      }
      setResult(data.output);
      setModelUsed(data.modelUsed);
      onSaved();
      toast({ title: `${skill.name} complete`, description: 'Output is ready below.' });
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

  const download = () => {
    if (!result || !skill) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.id}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {skill && (
              <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${skill.color}`}>
                <SkillIcon name={skill.icon} className="h-3.5 w-3.5" />
              </div>
            )}
            {skill?.name}
          </DialogTitle>
          <DialogDescription>{skill?.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Inputs */}
            <div className="space-y-3">
              {skill?.inputs.map((inp) => (
                <div key={inp.key}>
                  <Label htmlFor={`inp-${inp.key}`} className="text-xs">
                    {inp.label}
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
                      placeholder={inp.placeholder}
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
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`inp-${inp.key}`}
                      type={inp.type === 'number' ? 'number' : 'text'}
                      value={inputValues[inp.key] || ''}
                      onChange={(e) => setInputValues((p) => ({ ...p, [inp.key]: e.target.value }))}
                      placeholder={inp.placeholder}
                      className="mt-1 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Run failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Generated via {modelUsed || 'GLM'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={copy} className="h-7 text-xs">
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={download} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      .md
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
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={run} disabled={running || !skill}>
            {running ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running on GLM…</>
            ) : result ? (
              <><RefreshCw className="mr-2 h-4 w-4" /> Re-run</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Run with GLM</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────
function HistoryPanel({ runs, onClear }: { runs: RunInfo[]; onClear: () => void }) {
  if (runs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No runs yet. Pick a skill to get started.
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

// ─── Main Page ────────────────────────────────────────────────────────────
export default function Home() {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [tab, setTab] = useState<'all' | 'career' | 'hr'>('all');

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/upload', { cache: 'no-store' });
      const data = await res.json();
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
      const data = await res.json();
      setRuns(data.runs || []);
    } catch {
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadRuns();
  }, [loadProfile, loadRuns]);

  const openSkill = (s: Skill) => {
    setActiveSkill(s);
    setDialogOpen(true);
  };

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
                <span className="font-semibold text-sm sm:text-base truncate">Career Arsenal</span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground">
                  powered by GLM · 16 AI skills
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
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-10">
        {!profile && !loadingProfile && (
          /* Empty state — upload flow */
          <div className="max-w-2xl mx-auto py-8 sm:py-14">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Free LLM access via Z.ai GLM
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                All 16 Career Arsenal skills.<br className="hidden sm:block" /> One platform.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                Upload your resume or LinkedIn export. Then run any of the 16 skills — resume rewrites,
                cover letters, interview prep, salary negotiation, LinkedIn optimization, and 11 more —
                all powered by GLM, free.
              </p>
            </div>
            <UploadZone onUploaded={setProfile} onProfileLoaded={loadRuns} />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              {[
                { label: 'Career planning', icon: 'Compass' },
                { label: 'Resume rewrite', icon: 'FileText' },
                { label: 'Cover letters', icon: 'Mail' },
                { label: 'Interview prep', icon: 'Mic' },
                { label: 'Salary scripts', icon: 'DollarSign' },
                { label: 'LinkedIn opt', icon: 'Linkedin' },
                { label: 'Job hunt plan', icon: 'Crosshair' },
                { label: '+ 9 more', icon: 'Sparkles' },
              ].map((x) => (
                <div key={x.label} className="flex items-center gap-1.5 px-3 py-2 rounded-md border">
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
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Left: profile + history */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1">
              <ProfilePanel profile={profile} onChanged={loadProfile} />

              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <History className="h-3.5 w-3.5" />
                    Recent runs
                  </div>
                  {runs.length > 0 && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setRuns([])}>
                      <X className="h-3 w-3 mr-1" /> Hide
                    </Button>
                  )}
                </div>
                <HistoryPanel runs={runs} onClear={() => setRuns([])} />
              </Card>

              <div className="text-[11px] text-muted-foreground px-1">
                <p>Replace your profile anytime by uploading a new file. Skill runs are stored locally.</p>
              </div>
            </aside>

            {/* Right: skill grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Skills</h2>
                  <p className="text-xs text-muted-foreground">Click any card to run it with GLM.</p>
                </div>
                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs px-3 h-6">All ({ALL_SKILLS.length})</TabsTrigger>
                    <TabsTrigger value="career" className="text-xs px-3 h-6">Career ({CAREER_SKILLS.length})</TabsTrigger>
                    <TabsTrigger value="hr" className="text-xs px-3 h-6">Hiring ({HR_SKILLS.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} onRun={openSkill} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Built on</span>
            <a href="https://chat.z.ai" target="_blank" rel="noreferrer" className="font-medium hover:text-foreground">
              Z.ai GLM
            </a>
            <span>·</span>
            <span>Career Arsenal · 16 skills</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Local-first · your data stays on this device</span>
          </div>
        </div>
      </footer>

      <SkillRunDialog
        skill={activeSkill}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={loadRuns}
      />
      <Toaster />
    </div>
  );
}
