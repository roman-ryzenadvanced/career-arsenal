'use client';

import { useState } from 'react';
import { Mail, Loader2, Download, FileText, Code, FileCode, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';

interface CoverLetterBuilderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CoverLetterBuilderDialog({ open, onOpenChange }: CoverLetterBuilderDialogProps) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [jobPosting, setJobPosting] = useState('');
  const [companyResearch, setCompanyResearch] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [format, setFormat] = useState<'text' | 'html' | 'pdf'>('html');
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const generate = async () => {
    if (!jobPosting.trim()) return;
    setGenerating(true);
    setContent('');
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-language': locale },
        body: JSON.stringify({ jobPosting, companyResearch, format, customInstructions }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: 'Server error' }; }

      if (!res.ok) {
        toast({ title: t('coverLetter.generateFailed'), description: data.error, variant: 'destructive' });
        return;
      }

      setContent(data.content);
      toast({ title: t('coverLetter.generated'), description: t('coverLetter.generatedDesc') });
    } catch (e: any) {
      toast({ title: t('coverLetter.generateFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadContent = (asFormat: 'txt' | 'html' | 'pdf') => {
    if (!content) return;
    let blob: Blob;
    let filename: string;

    if (asFormat === 'txt') {
      // Strip HTML if present
      const text = format === 'text' ? content : content.replace(/<[^>]+>/g, '').trim();
      blob = new Blob([text], { type: 'text/plain' });
      filename = 'cover_letter.txt';
    } else if (asFormat === 'html') {
      const html = format === 'html' || format === 'pdf'
        ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cover Letter</title></head><body>${content}</body></html>`
        : `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cover Letter</title></head><body><pre>${content}</pre></body></html>`;
      blob = new Blob([html], { type: 'text/html' });
      filename = 'cover_letter.html';
    } else {
      // PDF — open print dialog
      const html = format === 'text'
        ? `<pre style="font-family:Georgia,serif;font-size:14px;line-height:1.6;padding:40px;">${content}</pre>`
        : content;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Cover Letter</title></head><body>${html}</body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up" style={{ display: open ? 'flex' : 'none' }}>
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('coverLetter.builderTitle')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Inputs */}
          <div className="lg:w-[400px] lg:border-r overflow-y-auto p-4 space-y-4">
            <div>
              <Label className="text-xs font-medium">{t('coverLetter.jobPosting')} <span className="text-destructive">*</span></Label>
              <Textarea
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                placeholder={t('coverLetter.jobPostingPlaceholder')}
                className="mt-1 min-h-[100px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{t('coverLetter.companyResearch')}</Label>
              <Textarea
                value={companyResearch}
                onChange={(e) => setCompanyResearch(e.target.value)}
                placeholder={t('coverLetter.companyResearchPlaceholder')}
                className="mt-1 min-h-[80px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{t('coverLetter.format')}</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  onClick={() => setFormat('text')}
                  className={`flex flex-col items-center gap-1 p-2 rounded border text-xs transition-all ${
                    format === 'text' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>{t('coverLetter.formatText')}</span>
                </button>
                <button
                  onClick={() => setFormat('html')}
                  className={`flex flex-col items-center gap-1 p-2 rounded border text-xs transition-all ${
                    format === 'html' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <FileCode className="h-4 w-4" />
                  <span>{t('coverLetter.formatHTML')}</span>
                </button>
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center gap-1 p-2 rounded border text-xs transition-all ${
                    format === 'pdf' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  <span>{t('coverLetter.formatPDF')}</span>
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">{t('coverLetter.customInstructions')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={t('coverLetter.customInstructionsPlaceholder')}
                className="mt-1 min-h-[50px] text-sm"
              />
            </div>
            <Button onClick={generate} disabled={!jobPosting.trim() || generating} className="w-full">
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('coverLetter.generating')}</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> {t('coverLetter.generate')}</>
              )}
            </Button>
            {generating && <PugLoader message={t('pug.thinking')} size="sm" />}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {content ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <Badge variant="outline" className="text-xs">
                    {format === 'text' ? t('coverLetter.formatText') : format === 'html' ? t('coverLetter.formatHTML') : t('coverLetter.formatPDF')}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant={viewMode === 'preview' ? 'default' : 'ghost'} onClick={() => setViewMode('preview')} className="h-7 text-xs">
                      Preview
                    </Button>
                    <Button size="sm" variant={viewMode === 'code' ? 'default' : 'ghost'} onClick={() => setViewMode('code')} className="h-7 text-xs">
                      Code
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 bg-gray-100 dark:bg-gray-900">
                  <div className="p-4 sm:p-8 flex justify-center">
                    {viewMode === 'preview' ? (
                      format === 'text' ? (
                        <div className="bg-white shadow-lg p-8 max-w-[700px] w-full">
                          <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{content}</pre>
                        </div>
                      ) : (
                        <div
                          className="bg-white shadow-lg max-w-[700px] w-full"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      )
                    ) : (
                      <pre className="text-xs bg-background p-4 rounded border overflow-x-auto max-w-full">
                        <code>{content}</code>
                      </pre>
                    )}
                  </div>
                </ScrollArea>
                {/* Download bar */}
                <div className="flex gap-2 px-4 py-3 border-t bg-muted/30">
                  <Button onClick={() => downloadContent('txt')} variant="outline" className="flex-1" size="sm">
                    <FileText className="h-3.5 w-3.5 mr-1" /> TXT
                  </Button>
                  <Button onClick={() => downloadContent('html')} variant="outline" className="flex-1" size="sm">
                    <FileCode className="h-3.5 w-3.5 mr-1" /> HTML
                  </Button>
                  <Button onClick={() => downloadContent('pdf')} className="flex-1" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-3">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('coverLetter.emptyPreview')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
