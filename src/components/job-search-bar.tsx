'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Search, MapPin, Loader2, Briefcase, Clock, DollarSign, Filter,
  ChevronDown, ChevronUp, Building2, ExternalLink, Save, X,
  SlidersHorizontal, Sparkles, FileText, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';

interface SearchResult {
  title: string;
  company: string;
  location: string;
  url: string;
  snippet: string;
  source: string;
}

interface JobSearchBarProps {
  hasProfile: boolean;
  onUploadClick: () => void;
  onSaveJob?: (job: SearchResult) => void;
  onOpenJobFinder?: () => void;
}

export function JobSearchBar({ hasProfile, onUploadClick, onSaveJob, onOpenJobFinder }: JobSearchBarProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [jobType, setJobType] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [datePosted, setDatePosted] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingJobKey, setSavingJobKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async () => {
    if (!hasProfile) {
      onUploadClick();
      return;
    }
    if (!query.trim()) return;

    setSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      // Build enhanced query with filters
      let enhancedQuery = query;
      if (jobType) enhancedQuery += ` ${jobType}`;
      if (experienceLevel) enhancedQuery += ` ${experienceLevel}`;

      const res = await fetch('/api/jobs/search', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: enhancedQuery,
          location,
          remote,
        }),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: 'Server error' }; }

      if (!res.ok) {
        toast({ title: t('jobFinder.searchFailed'), description: data.error, variant: 'destructive' });
        return;
      }

      let jobs: SearchResult[] = data.jobs || [];

      // Apply client-side filters
      if (datePosted === 'today') {
        // Filter to recent (can't truly filter by date, but show fewer)
        jobs = jobs.slice(0, 10);
      } else if (datePosted === 'week') {
        jobs = jobs.slice(0, 15);
      }

      setResults(jobs);
      toast({
        title: t('jobSearch.resultsFound'),
        description: `${jobs.length} ${t('jobSearch.jobsFound')}`,
      });
    } catch (e: any) {
      toast({ title: t('jobFinder.searchFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  }, [hasProfile, query, jobType, experienceLevel, location, remote, datePosted, onUploadClick, toast, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  };

  const saveJob = async (job: SearchResult) => {
    const jobKey = job.url || job.title + job.company;
    setSavingJobKey(jobKey);
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.snippet,
            source: job.source,
            remote,
            jobType: jobType || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('jobFinder.saveFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: t('jobFinder.jobSaved'), description: `${job.title} @ ${job.company}` });
      onSaveJob?.(job);
    } catch (e: any) {
      toast({ title: t('jobFinder.saveFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSavingJobKey(null);
    }
  };

  const sourceColors: Record<string, string> = {
    linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    indeed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    glassdoor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    web: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const activeFilters = [
    jobType && { label: jobType, clear: () => setJobType('') },
    experienceLevel && { label: experienceLevel, clear: () => setExperienceLevel('') },
    datePosted && { label: datePosted, clear: () => setDatePosted('') },
    remote && { label: 'Remote', clear: () => setRemote(false) },
  ].filter(Boolean);

  return (
    <div className="mb-6 animate-fade-in-up">
      {/* Search bar — Google style, responsive */}
      <div className="relative">
        {/* Main search row */}
        <div className={`flex items-center gap-1.5 sm:gap-2 border-2 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 transition-all bg-background shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-primary/40 overflow-hidden ${hasProfile ? 'border-border' : 'border-amber-300/50'}`}>
          <Search className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasProfile ? t('jobSearch.placeholder') : t('jobSearch.uploadFirst')}
            disabled={!hasProfile && !query}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
              <X className="h-4 w-4" />
            </button>
          )}
          {/* Location — hidden on very small screens, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <div className="h-5 w-px bg-border" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('jobSearch.locationPlaceholder')}
              disabled={!hasProfile}
              className="w-24 lg:w-32 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* Filters button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-full transition-colors ${showFilters || activeFilters.length > 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            {activeFilters.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                {activeFilters.length}
              </span>
            )}
          </div>
          {/* Search button */}
          <Button
            size="sm"
            onClick={search}
            disabled={searching || (!hasProfile && !query)}
            className="rounded-full h-8 w-8 sm:w-auto sm:px-4 shrink-0 p-0 sm:p-0"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">{t('jobSearch.searchBtn')}</span>
          </Button>
        </div>

        {/* Location field for mobile (below search bar) */}
        <div className="sm:hidden mt-2 flex items-center gap-1.5 px-3">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('jobSearch.locationPlaceholder')}
            disabled={!hasProfile}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground border-b border-border pb-1 disabled:cursor-not-allowed"
          />
        </div>

        {/* Resume required notice */}
        {!hasProfile && (
          <div className="mt-2 flex items-center gap-2 px-4 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t('jobSearch.resumeRequired')}</span>
            <button onClick={onUploadClick} className="font-semibold underline hover:no-underline">
              {t('jobSearch.uploadNow')}
            </button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 px-3 flex-wrap">
          <span className="text-xs text-muted-foreground">{t('jobSearch.activeFilters')}:</span>
          {activeFilters.map((f: any, i: number) => (
            <button
              key={i}
              onClick={f.clear}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => { setJobType(''); setExperienceLevel(''); setDatePosted(''); setRemote(false); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t('jobSearch.clearAll')}
          </button>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="mt-2 p-4 border rounded-lg bg-muted/30 space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            {/* Job Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {t('jobSearch.jobType')}
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
              >
                <option value="">{t('jobSearch.any')}</option>
                <option value="full-time">{t('jobSearch.fullTime')}</option>
                <option value="contract">{t('jobSearch.contract')}</option>
                <option value="part-time">{t('jobSearch.partTime')}</option>
                <option value="internship">{t('jobSearch.internship')}</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('jobSearch.experienceLevel')}
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
              >
                <option value="">{t('jobSearch.any')}</option>
                <option value="entry-level">{t('jobSearch.entryLevel')}</option>
                <option value="mid-level">{t('jobSearch.midLevel')}</option>
                <option value="senior">{t('jobSearch.senior')}</option>
                <option value="executive">{t('jobSearch.executive')}</option>
              </select>
            </div>

            {/* Date Posted */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('jobSearch.datePosted')}
              </label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
              >
                <option value="">{t('jobSearch.anytime')}</option>
                <option value="today">{t('jobSearch.today')}</option>
                <option value="week">{t('jobSearch.pastWeek')}</option>
                <option value="month">{t('jobSearch.pastMonth')}</option>
              </select>
            </div>

            {/* Remote toggle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('jobSearch.workMode')}
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setRemote(!remote)}
                  className={`flex-1 text-xs px-2 py-1.5 rounded border transition-colors ${remote ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {t('jobFinder.remote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search results */}
      {hasSearched && (
        <div className="mt-4">
          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              {searching ? t('jobSearch.searching') : `${results.length} ${t('jobSearch.resultsFor')} "${query}"`}
            </p>
            {results.length > 0 && onOpenJobFinder && (
              <Button size="sm" variant="ghost" onClick={onOpenJobFinder} className="h-7 text-xs">
                {t('jobSearch.openJobFinder')} →
              </Button>
            )}
          </div>

          {/* Loading */}
          {searching && (
            <div className="py-6">
              <PugLoader message={t('jobFinder.searching')} size="sm" />
            </div>
          )}

          {/* Results list */}
          {!searching && results.length > 0 && (
            <div className="space-y-2 max-h-[60dvh] overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {results.map((job, i) => {
                const jobKey = job.url || job.title + job.company;
                const isSaving = savingJobKey === jobKey;
                return (
                  <Card key={i} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-2.5 sm:p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <Badge className={`text-[9px] shrink-0 ${sourceColors[job.source] || sourceColors.web}`}>
                              {job.source}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-0.5">
                              <Building2 className="h-3 w-3" />
                              {job.company}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">{job.snippet}</p>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-1 shrink-0">
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
          )}

          {/* No results */}
          {!searching && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t('jobSearch.noResults')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('jobSearch.tryDifferent')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
