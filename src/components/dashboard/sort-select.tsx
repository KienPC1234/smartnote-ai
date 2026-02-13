'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";

export function SortSelect() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const { t } = useTranslation();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    replace(`/app?${params.toString()}`);
  };

  return (
    <Select
      defaultValue={searchParams.get('sort')?.toString() || "newest"}
      onValueChange={handleSort}
    >
      <SelectTrigger className="w-[180px] h-10 border-2 border-black dark:border-white font-bold uppercase bg-background text-foreground focus:ring-0">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent className="border-2 border-black dark:border-white font-bold bg-background text-foreground">
        <SelectItem value="newest" className="font-medium">{t.dashboard.sort_latest}</SelectItem>
        <SelectItem value="oldest" className="font-medium">{t.dashboard.sort_oldest}</SelectItem>
        <SelectItem value="name_asc" className="font-medium">{t.dashboard.sort_az}</SelectItem>
        <SelectItem value="name_desc" className="font-medium">{t.dashboard.sort_za}</SelectItem>
      </SelectContent>
    </Select>
  );
}
