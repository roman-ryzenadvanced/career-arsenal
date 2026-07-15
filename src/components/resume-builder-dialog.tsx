'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Shuffle, Download, FileText, Eye, Code, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';
import { RESUME_TEMPLATES, TEMPLATE_CATEGORIES, getTemplate, getRandomTemplate, type ResumeData, type ResumeTemplate } from '@/lib/resume-templates';

interface ResumeBuilderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ResumeBuilderDialog({ open, onOpenChange }: ResumeBuilderDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [jobPosting, setJobPosting] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [format, setFormat] = useState('senior');
  const [generating, setGenerating] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('modern-minimal');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setGenerating(true);
    setResumeData(null);
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPosting, customInstructions, format }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: 'Server error' }; }

      if (!res.ok) {
        toast({ title: t('resume.generateFailed'), description: data.error, variant: 'destructive' });
        return;
      }

      setResumeData(data.resume);
      if (data.templateRecommendations?.length) {
        setRecommendations(data.templateRecommendations);
        setSelectedTemplateId(data.templateRecommendations[0]);
      }
      toast({ title: t('resume.generated'), description: t('resume.generatedDesc') });
    } catch (e: any) {
      toast({ title: t('resume.generateFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const surpriseMe = () => {
    const random = getRandomTemplate();
    setSelectedTemplateId(random.id);
    toast({ title: t('resume.surpriseMe'), description: random.name });
  };

  const downloadHTML = () => {
    if (!resumeData) return;
    const template = getTemplate(selectedTemplateId);
    if (!template) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${resumeData.fullName} — Resume</title>
<style>
  body { margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; }
  @media print { body { background: #fff; padding: 0; } }
</style>
</head>
<body>
${template.render(resumeData)}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.fullName.replace(/\s+/g, '_')}_Resume.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!resumeData) return;
    // Open print dialog with just the resume
    const template = getTemplate(selectedTemplateId);
    if (!template) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${resumeData.fullName} — Resume</title></head>
<body style="margin:0;padding:0;">${template.render(resumeData)}</body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredTemplates = templateCategory === 'all'
    ? RESUME_TEMPLATES
    : RESUME_TEMPLATES.filter(t => t.category === templateCategory);

  const selectedTemplate = getTemplate(selectedTemplateId);

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up" style={{ display: open ? 'flex' : 'none' }}>
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('resume.builderTitle')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Inputs + Template selector */}
          <div className="lg:w-[400px] lg:border-r overflow-y-auto p-4 space-y-4">
            {!resumeData ? (
              <>
                <div>
                  <Label className="text-xs font-medium">{t('resume.jobPosting')} <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={jobPosting}
                    onChange={(e) => setJobPosting(e.target.value)}
                    placeholder={t('resume.jobPostingPlaceholder')}
                    className="mt-1 min-h-[100px] text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t('resume.format')}</Label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { v: 'entry', l: t('resume.formatEntry') },
                      { v: 'mid', l: t('resume.formatMid') },
                      { v: 'senior', l: t('resume.formatSenior') },
                    ].map(f => (
                      <Button
                        key={f.v}
                        size="sm"
                        variant={format === f.v ? 'default' : 'outline'}
                        className="h-7 text-xs flex-1"
                        onClick={() => setFormat(f.v)}
                      >
                        {f.l}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">{t('resume.customInstructions')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder={t('resume.customInstructionsPlaceholder')}
                    className="mt-1 min-h-[60px] text-sm"
                  />
                </div>
                <Button
                  onClick={generate}
                  disabled={!jobPosting.trim() || generating}
                  className="w-full"
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('resume.generating')}</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> {t('resume.generate')}</>
                  )}
                </Button>
                {generating && <PugLoader message={t('pug.thinking')} size="sm" />}
              </>
            ) : (
              <>
                {/* Template selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{t('resume.chooseTemplate')}</h3>
                    <Button size="sm" variant="outline" onClick={surpriseMe} className="h-7 text-xs">
                      <Shuffle className="h-3 w-3 mr-1" /> {t('resume.surpriseMe')}
                    </Button>
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1 flex-wrap">
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setTemplateCategory(cat.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          templateCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Template grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {filteredTemplates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`text-left p-2 rounded border text-xs transition-all ${
                          selectedTemplateId === tpl.id
                            ? 'border-primary ring-1 ring-primary bg-primary/5'
                            : 'border-border hover:border-foreground/30'
                        } ${recommendations.includes(tpl.id) ? 'ring-1 ring-emerald-500' : ''}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ background: tpl.accentColor }} />
                          <span className="font-semibold truncate">{tpl.name}</span>
                          {recommendations.includes(tpl.id) && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-emerald-600 border-emerald-500">★</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[10px] line-clamp-2">{tpl.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Custom instructions for redesign */}
                  <div>
                    <Label className="text-xs font-medium">{t('resume.customInstructions')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
                    <Textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder={t('resume.customInstructionsPlaceholder')}
                      className="mt-1 min-h-[50px] text-sm"
                    />
                  </div>

                  <Button onClick={generate} disabled={generating} variant="outline" className="w-full" size="sm">
                    {generating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                    {t('resume.regenerate')}
                  </Button>

                  {/* Download buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button onClick={downloadHTML} variant="outline" className="flex-1" size="sm">
                      <Code className="h-3.5 w-3.5 mr-1" /> HTML
                    </Button>
                    <Button onClick={downloadPDF} className="flex-1" size="sm">
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {resumeData && selectedTemplate ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <div className="w-2 h-2 rounded-full mr-1" style={{ background: selectedTemplate.accentColor }} />
                      {selectedTemplate.name}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant={viewMode === 'preview' ? 'default' : 'ghost'} onClick={() => setViewMode('preview')} className="h-7 text-xs">
                      <Eye className="h-3 w-3 mr-1" /> {t('resume.preview')}
                    </Button>
                    <Button size="sm" variant={viewMode === 'html' ? 'default' : 'ghost'} onClick={() => setViewMode('html')} className="h-7 text-xs">
                      <Code className="h-3 w-3 mr-1" /> HTML
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 bg-gray-100 dark:bg-gray-900">
                  <div ref={previewRef} className="p-4 sm:p-8 flex justify-center">
                    {viewMode === 'preview' ? (
                      <div
                        className="bg-white shadow-lg"
                        style={{ maxWidth: '800px', width: '100%' }}
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.render(resumeData) }}
                      />
                    ) : (
                      <pre className="text-xs bg-background p-4 rounded border overflow-x-auto max-w-full">
                        <code>{selectedTemplate.render(resumeData)}</code>
                      </pre>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('resume.emptyPreview')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
