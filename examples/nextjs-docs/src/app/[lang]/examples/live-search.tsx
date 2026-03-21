'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { SmartRouter } from '@van1s1mys/ai-router';
import type { SearchResult } from '@van1s1mys/ai-router';
import { routes } from 'virtual:ai-router';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';

interface LiveSearchProps {
  lang: string;
  dict: {
    liveSearchTitle: string;
    liveSearchDesc: string;
    tryThese: string;
    query1: string;
    query2: string;
    query3: string;
    query4: string;
    resultPath: string;
    resultScore: string;
    noResult: string;
    loading: string;
  };
}

export function LiveSearch({ lang, dict }: LiveSearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const routerRef = useRef<SmartRouter | null>(null);

  useEffect(() => {
    console.log('[ai-router] Initializing SmartRouter with routes:', routes);
    const sr = new SmartRouter({ routes: routes, threshold: 0.1, model: 'Xenova/multilingual-e5-small' });
    routerRef.current = sr;

    sr.ready
      .then(() => {
        console.log('[ai-router] Model loaded, ready to search');
        setIsReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[ai-router] Init failed:', err);
        setIsLoading(false);
      });

    return () => sr.destroy();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    console.log('[ai-router] doSearch called:', { q, isReady, hasRouter: !!routerRef.current });
    if (!routerRef.current || !isReady) return;
    setQuery(q);
    setIsSearching(true);
    setSearched(true);
    try {
      const res = await routerRef.current.search(q);
      console.log('[ai-router] Search result:', res);
      setResult(res);
    } catch (err) {
      console.error('[ai-router] Search error:', err);
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [isReady]);

  const suggestions = [dict.query1, dict.query2, dict.query3, dict.query4];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.liveSearchTitle}</CardTitle>
        <CardDescription>{dict.liveSearchDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {dict.loading}
          </div>
        )}

        {!isLoading && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
                  placeholder="Search..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button onClick={() => doSearch(query)} disabled={!query.trim()}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{dict.tryThese}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => doSearch(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {searched && !isSearching && result && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dict.resultPath}</span>
                  <code className="text-sm">/{lang}{result.path}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dict.resultScore}</span>
                  <Badge variant={result.score > 0.7 ? 'default' : 'secondary'}>
                    {Math.round(result.score * 100)}%
                  </Badge>
                </div>
              </div>
            )}

            {searched && !isSearching && !result && (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                {dict.noResult}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
