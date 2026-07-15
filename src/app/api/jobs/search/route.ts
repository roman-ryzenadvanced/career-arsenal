/**
 * PATCH /api/jobs/search
 *
 * Searches for jobs using the z-ai-web-dev-sdk web_search function.
 * Queries LinkedIn, Indeed, and other job boards via web search.
 * Returns structured job results with title, company, location, url, snippet.
 *
 * Body: { query: string, location?: string, remote?: boolean }
 * Returns: { jobs: JobSearchResult[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface JobSearchResult {
  title: string;
  company: string;
  location: string;
  url: string;
  snippet: string;
  source: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query || '';
    const location: string = body.location || '';
    const remote: boolean = body.remote ?? false;

    if (!query.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    // Build search queries for multiple sources
    const searchQueries = [
      `${query} ${location} site:linkedin.com/jobs`,
      `${query} ${location} site:indeed.com`,
      `${query} ${remote ? 'remote' : location} site:glassdoor.com`,
      `${query} ${location} ${remote ? 'remote' : ''} jobs hiring`,
    ];

    const zai = await ZAI.create();
    const allResults: JobSearchResult[] = [];

    // Execute searches in parallel
    const searchPromises = searchQueries.map(async (sq, idx) => {
      try {
        const results = await zai.functions.invoke('web_search', {
          query: sq,
          num: 8,
          recency_days: 30,
        });

        // SDK returns results in different formats — handle both
        let rawResults: any[] = [];
        if (Array.isArray(results)) {
          rawResults = results;
        } else if (results?.data?.results && Array.isArray(results.data.results)) {
          rawResults = results.data.results;
        } else if (results?.data && Array.isArray(results.data)) {
          rawResults = results.data;
        }

        return rawResults.map((r: any) => ({
          title: r.title || r.name || 'Untitled',
          company: extractCompany(r.title || r.name || '', r.url || '', idx),
          location: location || extractLocation(r.snippet || ''),
          url: r.url || r.link || '',
          snippet: r.snippet || r.description || '',
          source: extractSource(r.url || '', idx),
        }));
      } catch (err) {
        console.error(`Search query ${idx} failed:`, err);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    for (const results of searchResults) {
      allResults.push(...results);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allResults.filter((j) => {
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    // Sort by relevance (simple: put linkedin first, then indeed, then others)
    const sourceOrder: Record<string, number> = { linkedin: 0, indeed: 1, glassdoor: 2, web: 3 };
    unique.sort((a, b) => (sourceOrder[a.source] ?? 9) - (sourceOrder[b.source] ?? 9));

    return NextResponse.json({
      ok: true,
      jobs: unique.slice(0, 30),
      totalFound: unique.length,
    });
  } catch (err: any) {
    console.error('Job search error:', err);
    return NextResponse.json(
      { error: 'Job search failed.', detail: err?.message },
      { status: 500 }
    );
  }
}

function extractCompany(title: string, url: string, queryIdx: number): string {
  // Try to extract company from title patterns like "Senior Engineer - Google"
  const parts = title.split(/[-–|·]/);
  if (parts.length > 1) {
    // Usually company is the last part or the part after the dash
    return parts[parts.length - 1].trim().replace(/\(.*\)/g, '').trim();
  }
  // Fallback: extract from URL domain
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0];
  } catch {
    return 'Unknown';
  }
}

function extractLocation(snippet: string): string {
  // Look for common location patterns
  const locMatch = snippet.match(/(?:in|at|location:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})/);
  if (locMatch) return locMatch[1];
  const remoteMatch = snippet.match(/remote/i);
  if (remoteMatch) return 'Remote';
  return '';
}

function extractSource(url: string, queryIdx: number): string {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('indeed.com')) return 'indeed';
  if (url.includes('glassdoor.com')) return 'glassdoor';
  if (url.includes('angel.co') || url.includes('wellfound.com')) return 'wellfound';
  if (url.includes('remoteok.com')) return 'remoteok';
  if (url.includes('lever.co') || url.includes('greenhouse.io')) return 'ats';
  return 'web';
}
