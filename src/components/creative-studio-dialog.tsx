'use client';

import { useState, useRef } from 'react';
import {
  Palette, X, Loader2, Download, Eye, Sparkles, Presentation,
  Layout, Code2, FileText, Globe, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';

interface CreativeStudioDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CREATION_TYPES = [
  { id: 'slides', label: 'Presentation', labelKey: 'creative.slides', icon: Presentation, color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900', placeholder: 'e.g. A 10-slide pitch deck for my COO candidacy at a Web3 startup' },
  { id: 'landing', label: 'Landing Page', labelKey: 'creative.landing', icon: Layout, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900', placeholder: 'e.g. A personal brand landing page showcasing my blockchain operations expertise' },
  { id: 'app', label: 'Mini App', labelKey: 'creative.app', icon: Code2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900', placeholder: 'e.g. A job application tracker with add/edit/delete functionality' },
  { id: 'portfolio', label: 'Portfolio', labelKey: 'creative.portfolio', icon: Globe, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900', placeholder: 'e.g. A professional portfolio site based on my resume' },
  { id: 'doc', label: 'Document', labelKey: 'creative.doc', icon: FileText, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900', placeholder: 'e.g. A 90-day onboarding plan for my new COO role' },
];

export function CreativeStudioDialog({ open, onOpenChange }: CreativeStudioDialogProps) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState('slides');
  const [prompt, setPrompt] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ content: string; fileName: string; fileType: string; typeLabel: string; size: number } | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/creative-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-language': locale },
        body: JSON.stringify({ type: selectedType, prompt, customInstructions }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('creative.failed'), description: data.error, variant: 'destructive' });
        return;
      }
      setResult({
        content: data.content,
        fileName: data.fileName,
        fileType: data.fileType,
        typeLabel: data.typeLabel,
        size: data.size,
      });
      toast({ title: t('creative.generated'), description: `${data.typeLabel} · ${data.size} KB` });
    } catch (e: any) {
      toast({ title: t('creative.failed'), description: e?.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: result.fileType === 'html' ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPreview = () => {
    if (!result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    if (result.fileType === 'html') {
      w.document.write(result.content);
    } else {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7}</style></head><body><div id="c"></div><script>document.getElementById('c').innerHTML=marked.parse(${JSON.stringify(result.content)})</script></body></html>`);
    }
    w.document.close();
  };

  const currentType = CREATION_TYPES.find(t => t.id === selectedType) || CREATION_TYPES[0];

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[95dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">{t('creative.title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: inputs */}
          <div className="lg:w-[400px] lg:border-r overflow-y-auto p-4 space-y-4">
            {/* Type selector */}
            <div>
              <Label className="text-xs font-medium mb-2 block">{t('creative.chooseType')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {CREATION_TYPES.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedType(tp.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      selectedType === tp.id
                        ? tp.color + ' ring-1 ring-foreground/20'
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <tp.icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{tp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <Label className="text-xs font-medium">{t('creative.prompt')} <span className="text-destructive">*</span></Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentType.placeholder}
                className="mt-1 min-h-[80px] text-sm"
              />
            </div>

            {/* Custom instructions */}
            <div>
              <Label className="text-xs font-medium">{t('creative.customInstructions')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
              <Input
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={t('creative.customPlaceholder')}
                className="mt-1 text-sm"
              />
            </div>

            <Button onClick={generate} disabled={generating || !prompt.trim()} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {t('creative.generate')}
            </Button>

            {generating && <PugLoader message={t('creative.generating')} size="sm" />}

            {/* Previous results quick info */}
            {result && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{result.typeLabel}</Badge>
                  <span className="text-xs text-muted-foreground">{result.size} KB</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{result.fileName}</p>
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {result ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{result.typeLabel}</Badge>
                    <span className="text-xs text-muted-foreground">{result.size} KB</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant={viewMode === 'preview' ? 'default' : 'ghost'} onClick={() => setViewMode('preview')} className="h-7 text-xs">
                      <Eye className="h-3 w-3 mr-1" /> {t('creative.preview')}
                    </Button>
                    <Button size="sm" variant={viewMode === 'code' ? 'default' : 'ghost'} onClick={() => setViewMode('code')} className="h-7 text-xs">
                      <Code2 className="h-3 w-3 mr-1" /> Code
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                  {viewMode === 'preview' ? (
                    <iframe
                      ref={previewRef}
                      srcDoc={result.fileType === 'html' ? result.content : `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#1a1a1a}</style></head><body><div id="c"></div><script>document.getElementById('c').innerHTML=marked.parse(${JSON.stringify(result.content)})</script></body></html>`}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <pre className="text-xs bg-background p-4 overflow-auto h-full">
                      <code>{result.content}</code>
                    </pre>
                  )}
                </div>
                <div className="flex gap-2 p-3 border-t shrink-0 bg-muted/30">
                  <Button onClick={openPreview} variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3.5 w-3.5 mr-1" /> {t('creative.openNewTab')}
                  </Button>
                  <Button onClick={download} size="sm" className="flex-1">
                    <Download className="h-3.5 w-3.5 mr-1" /> {t('creative.download')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-3">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('creative.empty')}</p>
                  <p className="text-xs text-muted-foreground max-w-sm">{t('creative.emptyDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
