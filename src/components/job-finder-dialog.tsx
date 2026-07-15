'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search, MapPin, Building2, ExternalLink, Save, Loader2, X,
  CheckCircle2, FileText, Mail, Download, Sparkles, Briefcase,
  TrendingUp, Clock, ChevronRight, Star, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  title: string;
  company: string;
  location: string;
  url: string;
  snippet: string;
  source: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  description: string | null;
  source: string;
  matchScore: number | null;
  matchReason: string | null;
  status: string;
  remote: boolean;
  applicationCount: number;
  createdAt: string;
}

interface Application {
  id: string;
  tailoredResume: string;
  coverLetter: string;
  coverLetterFormat: string;
  status: string;
}

interface JobFinderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function JobFinderDialog({ open, onOpenChange }: JobFinderDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [applying, setApplying] = useState(false);
  const [clFormat, setClFormat] = useState<'text' | 'html' | 'pdf'>('html');
  const [viewMode, setViewMode] = useState<'resume' | 'coverLetter'>('resume');

  // Load saved jobs on open
  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs', { cache: 'no-store' });
      const data = await res.json();
      setSavedJobs(data.jobs || []);
    } catch {
      setSavedJobs([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadJobs();
  }, [open, loadJobs]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, remote }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('jobFinder.searchFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      setSearchResults(data.jobs || []);
      toast({ title: t('jobFinder.resultsFound'), description: `${data.totalFound || 0} ${t('jobFinder.jobsFound')}` });
    } catch (e: any) {
      toast({ title: t('jobFinder.searchFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const saveJob = async (result: SearchResult) => {
    const jobKey = result.url || result.title + result.company;
    setSavingId(jobKey);
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: result.title,
            company: result.company,
            location: result.location,
            url: result.url,
            description: result.snippet,
            source: result.source,
            remote,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('jobFinder.saveFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: t('jobFinder.jobSaved'), description: `${result.title} @ ${result.company}` });
      await loadJobs();
      setActiveTab('saved');
    } catch (e: any) {
      toast({ title: t('jobFinder.saveFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const autoApply = async (job: SavedJob) => {
    setSelectedJob(job);
    setApplying(true);
    setApplication(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetterFormat: clFormat }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('jobFinder.applyFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      setApplication(data.application);
      toast({ title: t('jobFinder.materialsReady'), description: t('jobFinder.materialsReadyDesc') });
      await loadJobs();
    } catch (e: any) {
      toast({ title: t('jobFinder.applyFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  const updateStatus = async (jobId: string, status: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJobs({ ...selectedJob, status });
      }
    } catch {}
  };

  const setSelectedJobs = (job: SavedJob) => setSelectedJob(job);

  const downloadContent = (content: string, filename: string, type: 'md' | 'html' | 'pdf' | 'doc') => {
    if (type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
      return;
    }
    const mime = type === 'md' ? 'text/markdown' : type === 'html' ? 'text/html' : 'application/msword';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      indeed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      glassdoor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      web: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[source] || colors.web;
  };

  const statusColors: Record<string, string> = {
    saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    interviewing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[95dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('jobFinder.title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b px-4 pt-2 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9">
              <TabsTrigger value="search" className="text-xs sm:text-sm">
                <Search className="h-3.5 w-3.5 mr-1" />
                {t('jobFinder.search')}
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-xs sm:text-sm">
                <Star className="h-3.5 w-3.5 mr-1" />
                {t('jobFinder.saved')} ({savedJobs.length})
              </TabsTrigger>
              {selectedJob && (
                <TabsTrigger value="application" className="text-xs sm:text-sm">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  {t('jobFinder.application')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-0">
              <div className="flex flex-col h-full">
                {/* Search bar */}
                <div className="flex flex-col sm:flex-row gap-2 p-4 border-b">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder={t('jobFinder.searchPlaceholder')}
                    className="flex-1"
                  />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder={t('jobFinder.locationPlaceholder')}
                    className="sm:w-40"
                  />
                  <Button
                    variant={remote ? 'default' : 'outline'}
                    onClick={() => setRemote(!remote)}
                    className="shrink-0"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {t('jobFinder.remote')}
                  </Button>
                  <Button onClick={search} disabled={searching || !query.trim()} className="shrink-0">
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(95dvh - 220px)' }}>
                  {searching && (
                    <div className="py-8">
                      <PugLoader message={t('jobFinder.searching')} size="md" />
                    </div>
                  )}

                  {!searching && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">{t('jobFinder.searchHint')}</p>
                    </div>
                  )}

                  <div className="space-y-2 p-4">
                    {searchResults.map((job, i) => {
                      const jobKey = job.url || job.title + job.company;
                      const isSaving = savingId === jobKey;
                      return (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                                  <Badge className={`text-[10px] ${sourceBadge(job.source)}`}>{job.source}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {job.company}
                                  </span>
                                  {job.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {job.location}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{job.snippet}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                {job.url && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => window.open(job.url, '_blank')}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => saveJob(job)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                  {t('jobFinder.save')}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Saved Jobs Tab */}
            <TabsContent value="saved" className="mt-0">
              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(95dvh - 180px)' }}>
                {savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">{t('jobFinder.noSavedJobs')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {savedJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm">{job.title}</h3>
                                <Badge className={`text-[10px] ${statusColors[job.status] || statusColors.saved}`}>
                                  {t(`jobFinder.status.${job.status}`)}
                                </Badge>
                                {job.matchScore !== null && (
                                  <Badge className={`text-[10px] ${job.matchScore >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : job.matchScore >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {job.matchScore}% {t('jobFinder.match')}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {job.company}
                                </span>
                                {job.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.location}
                                  </span>
                                )}
                                {job.remote && <Badge variant="outline" className="text-[10px]">Remote</Badge>}
                              </div>
                              {job.matchReason && (
                                <p className="text-xs text-muted-foreground italic mb-2">{job.matchReason}</p>
                              )}
                              {job.applicationCount > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t('jobFinder.materialsGenerated')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              {job.url && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(job.url!, '_blank')}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={() => autoApply(job)}
                                disabled={applying}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                {job.applicationCount > 0 ? t('jobFinder.viewMaterials') : t('jobFinder.autoApply')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Application Tab — shows generated resume + cover letter */}
            {selectedJob && (
              <TabsContent value="application" className="mt-0">
                <div className="flex flex-col" style={{ maxHeight: 'calc(95dvh - 180px)' }}>
                  {applying && (
                    <div className="py-8">
                      <PugLoader message={t('jobFinder.generatingMaterials')} size="md" />
                    </div>
                  )}

                  {!applying && application && (
                    <>
                      {/* Application header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b shrink-0">
                        <div>
                          <h3 className="font-semibold text-sm">{selectedJob.title} @ {selectedJob.company}</h3>
                          <p className="text-xs text-muted-foreground">{t('jobFinder.applicationReady')}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={viewMode === 'resume' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('resume')}
                            className="h-7 text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {t('jobFinder.resume')}
                          </Button>
                          <Button
                            size="sm"
                            variant={viewMode === 'coverLetter' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('coverLetter')}
                            className="h-7 text-xs"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            {t('jobFinder.coverLetter')}
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {viewMode === 'resume' && application.tailoredResume && (
                          <div className="bg-white dark:bg-muted rounded-lg border p-6 max-w-[800px] mx-auto">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{application.tailoredResume}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                        {viewMode === 'coverLetter' && application.coverLetter && (
                          <div className="max-w-[700px] mx-auto">
                            {application.coverLetterFormat === 'text' ? (
                              <div className="bg-white dark:bg-muted rounded-lg border p-6">
                                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{application.coverLetter}</pre>
                              </div>
                            ) : (
                              <div
                                className="bg-white shadow-lg rounded-lg overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: application.coverLetter }}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Export bar */}
                      <div className="flex flex-wrap gap-2 p-3 border-t shrink-0 bg-muted/30">
                        <span className="text-xs text-muted-foreground self-center mr-2">{t('jobFinder.export')}:</span>
                        {viewMode === 'resume' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(application.tailoredResume, `${selectedJob.company}-resume.md`, 'md')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> MD
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(`<html><body>${application.tailoredResume}</body></html>`, `${selectedJob.company}-resume.html`, 'html')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> HTML
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(application.tailoredResume, `${selectedJob.company}-resume.doc`, 'doc')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> DOC
                            </Button>
                          </>
                        )}
                        {viewMode === 'coverLetter' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(application.coverLetter, `${selectedJob.company}-cover-letter.txt`, 'md')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> TXT
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(application.coverLetter, `${selectedJob.company}-cover-letter.html`, 'html')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> HTML
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadContent(application.coverLetter, `${selectedJob.company}-cover-letter.pdf`, 'pdf')} className="h-7 text-xs">
                              <Download className="h-3 w-3 mr-1" /> PDF
                            </Button>
                          </>
                        )}
                        <Separator orientation="vertical" className="h-7" />
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateStatus(selectedJob.id, 'applied')}
                          className="h-7 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('jobFinder.markApplied')}
                        </Button>
                      </div>
                    </>
                  )}

                  {!applying && !application && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">{t('jobFinder.noMaterialsYet')}</p>
                      <Button onClick={() => autoApply(selectedJob)} disabled={applying}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('jobFinder.generateMaterials')}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
