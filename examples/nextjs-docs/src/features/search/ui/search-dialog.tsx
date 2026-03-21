'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { SmartRouter } from 'ai-router';
import type { SearchResult } from 'ai-router';
import { routes } from 'virtual:ai-router';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/shared/ui/command';
import { Badge } from '@/shared/ui/badge';

interface SearchDialogProps {
  lang: string;
  placeholder: string;
  triggerText: string;
  loadingText: string;
  noResultText: string;
}

export function SearchDialog({ lang, placeholder, triggerText, loadingText, noResultText }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const routerRef = useRef<SmartRouter | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nextRouter = useRouter();

  useEffect(() => {
    if (!open) return;
    if (routerRef.current) return;

    setIsLoading(true);
    const sr = new SmartRouter({ routes, threshold: 0.1, model: 'Xenova/multilingual-e5-small' });
    routerRef.current = sr;

    sr.ready
      .then(() => {
        setIsReady(true);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    return () => {
      sr.destroy();
      routerRef.current = null;
    };
  }, [open]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim() || !routerRef.current || !isReady) {
        setResult(null);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await routerRef.current!.search(value);
          setResult(res);
        } catch {
          setResult(null);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [isReady]
  );

  const handleSelect = (path: string) => {
    setOpen(false);
    nextRouter.push(`/${lang}${path}`);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex">{triggerText}</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingText}
              </div>
            )}

            {!isLoading && !query && (
              <CommandGroup heading="Pages">
                {routes.map((route) => (
                  <CommandItem
                    key={route.path}
                    value={route.path}
                    onSelect={() => handleSelect(route.path)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {route.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading && query && !isSearching && !result && (
              <CommandEmpty>{noResultText}</CommandEmpty>
            )}

            {!isLoading && query && isSearching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {!isLoading && result && (
              <CommandGroup heading="Best match">
                <CommandItem
                  value={result.path}
                  onSelect={() => handleSelect(result.path)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {routes.find((r) => r.path === result.path)?.title || result.path}
                  </div>
                  <Badge variant="secondary">
                    {Math.round(result.score * 100)}%
                  </Badge>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
