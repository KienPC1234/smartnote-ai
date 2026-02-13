'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "@/components/LanguageProvider";

export function SearchInput() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const { t } = useTranslation();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`/app?${params.toString()}`);
  }, 300);

  return (
    <div className="relative w-full max-w-xs hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <Input
        type="text"
        placeholder={t.dashboard.search_placeholder}
        className="w-full h-10 pl-10 pr-4 bg-background border-2 border-black dark:border-white text-xs font-bold uppercase focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400 text-foreground"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
      />
    </div>
  );
}
