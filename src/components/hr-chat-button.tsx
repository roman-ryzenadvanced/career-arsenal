'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Sparkles, User, Zap, Target, Play, FileText, Mail, Mic, DollarSign, Linkedin, Crosshair, Compass, ClipboardCheck, Gift, Rocket, GitBranch, ShieldCheck, HeartHandshake, FileSignature, Users, TrendingUp, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';
import ReactMarkdown from 'react-markdown';

interface ChatAction {
  type: 'run_skill' | 'update_target_role' | 'generate_file';
  skillId?: string;
  value?: string;
  fileName?: string;
  fileType?: string;
  content?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

const PERSONAS = [
  { id: 'recruiter', nameKey: 'persona.recruiter.name', roleKey: 'persona.recruiter.role', icon: '🎯', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  { id: 'compensation', nameKey: 'persona.compensation.name', roleKey: 'persona.compensation.role', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900' },
  { id: 'career_coach', nameKey: 'persona.career_coach.name', roleKey: 'persona.career_coach.role', icon: '🧭', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900' },
  { id: 'hr_legal', nameKey: 'persona.hr_legal.name', roleKey: 'persona.hr_legal.role', icon: '⚖️', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { id: 'culture', nameKey: 'persona.culture.name', roleKey: 'persona.culture.role', icon: '🌟', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' },
  { id: 'founder', nameKey: 'persona.founder.name', roleKey: 'persona.founder.role', icon: '🚀', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
  { id: 'negotiator', nameKey: 'persona.negotiator.name', roleKey: 'persona.negotiator.role', icon: '🤝', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900' },
];

const SKILL_ICONS: Record<string, any> = {
  Compass, FileText, Mail, Linkedin, Mic, DollarSign, TrendingUp, Crosshair,
  FileSignature, Users, ClipboardCheck, Gift, Rocket, GitBranch, ShieldCheck, HeartHandshake,
};

interface HRChatButtonProps {
  onRunSkill?: (skillId: string) => void;
  onUpdateTargetRole?: (role: string) => void;
}

export function HRChatButton({ onRunSkill, onUpdateTargetRole }: HRChatButtonProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('recruiter');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/hr-chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-language': locale,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          persona: selectedPersona,
        }),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: 'Server returned an invalid response.' }; }

      if (!res.ok) {
        toast({ title: t('toast.chatFailed'), description: data.error, variant: 'destructive' });
        return;
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.reply,
        actions: data.actions || [],
      }]);
    } catch (e: any) {
      toast({ title: t('toast.chatFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, selectedPersona, toast, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.type === 'run_skill' && action.skillId && onRunSkill) {
      onRunSkill(action.skillId);
      toast({
        title: t('chat.actionTriggered'),
        description: t('chat.openingSkill'),
      });
      setOpen(false);
    } else if (action.type === 'update_target_role' && action.value && onUpdateTargetRole) {
      onUpdateTargetRole(action.value);
      toast({
        title: t('chat.targetRoleUpdated'),
        description: action.value,
      });
    } else if (action.type === 'generate_file' && action.fileName && action.content) {
      const ft = action.fileType || 'txt';

      if (ft === 'pdf') {
        // PDF = open print dialog with styled HTML (user saves as PDF from browser)
        // If content is markdown, convert to HTML first
        let htmlContent = action.content;
        if (!htmlContent.trim().startsWith('<') && !htmlContent.trim().startsWith('<!DOCTYPE')) {
          // It's markdown — wrap in styled HTML
          htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${action.fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
@page { margin: 1.5cm; }
body { font-family: Georgia, serif; max-width: 210mm; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1a1a1a; }
h1 { font-size: 22pt; border-bottom: 2px solid #333; padding-bottom: 4px; }
h2 { font-size: 14pt; margin-top: 1.2em; text-transform: uppercase; letter-spacing: 1px; }
h3 { font-size: 12pt; }
ul, ol { padding-left: 1.5em; }
li { margin: 3px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 6px; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
@media print { body { max-width: none; } }
</style>
</head><body><div id="content"></div>
<script>
document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(action.content)});
setTimeout(function() { window.print(); }, 300);
</script>
</body></html>`;
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({ title: 'Please allow popups to generate PDF' });
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        toast({ title: '📄 PDF ready', description: 'Use your browser\'s Print → Save as PDF' });
        return;
      }

      // For all other types — download as file
      const mime = ft === 'html' || ft === 'slides' || ft === 'code'
        ? 'text/html'
        : ft === 'md'
        ? 'text/markdown'
        : 'text/plain';

      // Fix filename extension if it doesn't match the type
      let fileName = action.fileName;
      const ext = ft === 'html' || ft === 'slides' || ft === 'code' ? '.html' : ft === 'md' ? '.md' : '.txt';
      if (!fileName.endsWith(ext) && !fileName.endsWith('.html') && !fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
        fileName = fileName + ext;
      }

      // If content is markdown but type is html, convert to HTML
      let content = action.content;
      if ((ft === 'html' || ft === 'slides' || ft === 'code') && !content.trim().startsWith('<') && !content.trim().startsWith('<!DOCTYPE')) {
        // Content is markdown but supposed to be HTML — wrap it
        content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#1a1a1a}h1{border-bottom:2px solid #333}h2{margin-top:1.2em}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:12px;border-radius:6px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}</style>
</head><body><div id="content"></div>
<script>document.getElementById('content').innerHTML=marked.parse(${JSON.stringify(content)})</script>
</body></html>`;
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: '📄 File downloaded',
        description: fileName,
      });
    }
  };

  const previewFile = (action: ChatAction) => {
    if (action.type !== 'generate_file' || !action.content) return;
    const ft = action.fileType || 'txt';
    // Open preview in new tab
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    if (ft === 'pdf') {
      // PDF preview = styled HTML with print button
      let htmlContent = action.content;
      if (!htmlContent.trim().startsWith('<') && !htmlContent.trim().startsWith('<!DOCTYPE')) {
        htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${action.fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
@page { margin: 1.5cm; }
body { font-family: Georgia, serif; max-width: 210mm; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1a1a1a; }
h1 { font-size: 22pt; border-bottom: 2px solid #333; padding-bottom: 4px; }
h2 { font-size: 14pt; margin-top: 1.2em; text-transform: uppercase; letter-spacing: 1px; }
h3 { font-size: 12pt; }
ul, ol { padding-left: 1.5em; }
li { margin: 3px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 6px; }
</style>
</head><body><div id="content"></div>
<div style="text-align:center;padding:20px;"><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer;">🖨️ Save as PDF</button></div>
<script>document.getElementById('content').innerHTML=marked.parse(${JSON.stringify(action.content)});</script>
</body></html>`;
      }
      previewWindow.document.write(htmlContent);
    } else if (ft === 'html' || ft === 'slides' || ft === 'code') {
      // If content is actually markdown (not HTML), wrap it
      if (action.content.trim().startsWith('<') || action.content.trim().startsWith('<!DOCTYPE')) {
        previewWindow.document.write(action.content);
      } else {
        previewWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${action.fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#1a1a1a}h1{border-bottom:2px solid #333}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}</style>
</head><body><div id="content"></div>
<script>document.getElementById('content').innerHTML=marked.parse(${JSON.stringify(action.content)});</script>
</body></html>`);
      }
    } else if (ft === 'md') {
      previewWindow.document.write(`
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${action.fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#1a1a1a}h1{border-bottom:2px solid #333}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}</style>
</head><body><div id="content"></div>
<script>document.getElementById('content').innerHTML=marked.parse(${JSON.stringify(action.content)});</script>
</body></html>`);
    } else {
      previewWindow.document.write(`<pre style="font-family:monospace;padding:20px;white-space:pre-wrap;">${action.content.replace(/</g, '&lt;')}</pre>`);
    }
    previewWindow.document.close();
  };

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all animate-fade-in-up p-0"
          size="icon"
          aria-label={t('chat.title')}
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {!open && messages.length === 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            {t('chat.title')}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{t('chat.subtitlePortalAware')}</p>
        </SheetHeader>

        {/* Persona selector */}
        <div className="px-3 py-2 border-b overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPersona(p.id);
                  setMessages([]);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all whitespace-nowrap ${
                  p.id === selectedPersona
                    ? p.color + ' ring-1 ring-foreground/20'
                    : 'bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-sm">{p.icon}</span>
                <span>{t(p.nameKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-2 ${currentPersona.color}`}>
                  <span className="text-2xl">{currentPersona.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t(currentPersona.nameKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(currentPersona.roleKey)}</p>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {t('chat.welcomePortalAware')}
                </p>
                {/* Suggested questions */}
                <div className="space-y-1.5 max-w-xs mx-auto">
                  {getSuggestedQuestions(selectedPersona).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} w-full`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : currentPersona.color
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-sm">{currentPersona.icon}</span>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-muted'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Action buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-9 w-full">
                    {msg.actions.map((action, ai) => (
                      <ActionBadge key={ai} action={action} onClick={() => handleAction(action)} onPreview={() => previewFile(action)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-2">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${currentPersona.color}`}>
                  <span className="text-sm">{currentPersona.icon}</span>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <PugLoader size="sm" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-3 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={sending}
          />
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px]">
              {currentPersona.icon} {t(currentPersona.nameKey)}
            </Badge>
            <Button
              size="sm"
              onClick={send}
              disabled={!input.trim() || sending}
              className="h-8"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {t('chat.send')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Action badge component — renders as a clickable button or file card
function ActionBadge({ action, onClick, onPreview }: { action: ChatAction; onClick: () => void; onPreview?: () => void }) {
  const { t } = useI18n();

  if (action.type === 'run_skill' && action.skillId) {
    const Icon = SKILL_ICONS[getSkillIconName(action.skillId)] || Play;
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-foreground/5 hover:bg-foreground/10 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{t('chat.runSkill')}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{action.skillId}</span>
      </button>
    );
  }

  if (action.type === 'update_target_role' && action.value) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-foreground/5 hover:bg-foreground/10 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Target className="h-3.5 w-3.5" />
        <span>{t('chat.updateTargetRole')}</span>
        <span className="text-muted-foreground truncate max-w-[120px]">{action.value}</span>
      </button>
    );
  }

  // File card — shows file icon, name, type, preview + download buttons
  if (action.type === 'generate_file' && action.fileName) {
    const fileIcon = action.fileType === 'slides' ? '📊' :
                     action.fileType === 'code' ? '💻' :
                     action.fileType === 'html' ? '🌐' :
                     action.fileType === 'md' ? '📄' : '📎';
    const fileSize = action.content ? Math.round(action.content.length / 1024 * 10) / 10 : 0;
    return (
      <div className="rounded-lg border bg-foreground/[0.03] overflow-hidden max-w-full">
        {/* File header */}
        <div className="flex items-center gap-2 p-2.5 border-b bg-foreground/[0.02]">
          <span className="text-lg shrink-0">{fileIcon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{action.fileName}</p>
            <p className="text-[10px] text-muted-foreground">
              {action.fileType?.toUpperCase()} · {fileSize} KB
            </p>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-1 p-2">
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-all"
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          )}
          <button
            onClick={onClick}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function getSkillIconName(skillId: string): string {
  const iconMap: Record<string, string> = {
    'career-gps': 'Compass',
    'resume-architect': 'FileText',
    'cover-letter-craft': 'Mail',
    'linkedin-optimizer': 'Linkedin',
    'interview-commander': 'Mic',
    'salary-negotiator': 'DollarSign',
    'job-switch-advisor': 'TrendingUp',
    'jobhunter-master': 'Crosshair',
    'hr-job-description-forge': 'FileSignature',
    'hr-candidate-hunter': 'Users',
    'hr-interview-designer': 'ClipboardCheck',
    'hr-offer-architect': 'Gift',
    'hr-onboarding-commander': 'Rocket',
    'hr-talent-pipeline': 'GitBranch',
    'hr-retention-radar': 'ShieldCheck',
    'hr-culture-architect': 'HeartHandshake',
  };
  return iconMap[skillId] || 'Play';
}

function getSuggestedQuestions(persona: string): string[] {
  const questions: Record<string, string[]> = {
    recruiter: [
      'Review my resume and tell me what to improve',
      'What skills should I highlight for my target role?',
      'Run the Resume Architect skill for me',
    ],
    compensation: [
      'Based on my resume, what salary should I target?',
      'Run the Salary Negotiator skill for me',
      'How do I evaluate my current compensation?',
    ],
    career_coach: [
      'Looking at my resume, what career gaps do you see?',
      'Run Career GPS to plan my next 3 years',
      'Should I switch jobs based on my profile?',
    ],
    hr_legal: [
      'Review my employment situation from my resume',
      'What clauses should I watch for in a new contract?',
      'Run the Salary Negotiator for my offer review',
    ],
    culture: [
      'Based on my background, what company cultures fit me?',
      'Run the Cover Letter Craft for a culture-focused application',
      'How do I assess culture fit in interviews?',
    ],
    founder: [
      'Based on my resume, am I suited for a startup?',
      'Run the JobHunter Master to find startup opportunities',
      'What equity should I expect given my experience?',
    ],
  };
  return questions[persona] || questions.recruiter;
}
