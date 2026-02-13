import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, Sparkles, Clock, LayoutDashboard, Settings, User as UserIcon } from "lucide-react";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { FolderList } from "@/components/dashboard/folder-list";
import { NoteCard } from "@/components/dashboard/note-card";
import { Prisma } from "@prisma/client";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    folder?: string;
    lang?: string;
  }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const lang = (searchParams.lang as "en" | "vi") || "en";
  const t = dictionaries[lang];

  const { q: searchQuery, sort: sortOrder, folder: folderId } = searchParams;

  // Build where clause
  const where: Prisma.NoteWhereInput = {
    userId: session.user.id,
    ...(searchQuery && {
      title: { contains: searchQuery },
    }),
    ...(folderId && {
        folderId: folderId
    })
  };

  // Build orderBy clause
  let orderBy: Prisma.NoteOrderByWithRelationInput = { updatedAt: "desc" };
  if (sortOrder === "oldest") orderBy = { updatedAt: "asc" };
  if (sortOrder === "name_asc") orderBy = { title: "asc" };
  if (sortOrder === "name_desc") orderBy = { title: "desc" };

  const [notes, folders] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy,
      include: { generations: { select: { id: true } } }
    }),
    prisma.folder.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" }
    })
  ]);

  const totalGenerations = notes.reduce((acc, note) => acc + note.generations.length, 0);

  return (
    <div className="space-y-10 relative pb-20">
      <div className="relative z-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black dark:border-white pb-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-black uppercase tracking-widest text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    {t.dashboard.student_dashboard}
                </div>
                <h1 className="text-5xl font-black uppercase text-foreground italic tracking-tighter leading-none">
                    {t.dashboard.welcome}, <span className="text-[var(--primary)]">{session.user?.name || session.user?.email?.split('@')[0]}</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold max-w-md">
                    {t.dashboard.notes_count.replace("{count}", notes.length.toString())}{" "}
                    {t.dashboard.ai_sets_count.replace("{count}", totalGenerations.toString())}
                </p>
            </div>
            
            <Link href="/app/new">
                <Button size="lg" className="h-16 px-8 text-xl font-black border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-[var(--accent)] text-black hover:bg-[var(--accent)] transition-all">
                    <Plus className="mr-2 w-7 h-7" strokeWidth={3} />
                    {t.dashboard.create_btn}
                </Button>
            </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border-2 border-black dark:border-white bg-background shadow-[4px_4px_0px_0px_var(--secondary)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1 text-foreground">{t.dashboard.stats_notes}</p>
                <p className="text-3xl font-black italic text-foreground">{notes.length}</p>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-background shadow-[4px_4px_0px_0px_var(--primary)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1 text-foreground">{t.dashboard.stats_ai}</p>
                <p className="text-3xl font-black italic text-foreground">{totalGenerations}</p>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-background shadow-[4px_4px_0px_0px_var(--accent)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1 text-foreground">{t.dashboard.stats_gaps}</p>
                <p className="text-3xl font-black italic text-foreground">{notes.filter(n => n.generations.length > 0).length}</p>
            </div>
            <Link href="/app/management" className="p-6 border-2 border-black dark:border-white bg-[var(--purple)] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                <p className="text-xs font-black uppercase opacity-70 mb-1">{t.nav.management}</p>
                <div className="flex justify-between items-center">
                    <p className="text-xl font-black italic truncate">{t.nav.management}</p>
                    <Settings className="w-6 h-6" />
                </div>
            </Link>
        </div>

        {/* Folders Section */}
        <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic border-l-4 border-[var(--primary)] pl-4 text-black dark:text-white">{t.dashboard.folders_title}</h2>
            <FolderList folders={folders} />
        </div>

        {/* Notes Section */}
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-black uppercase italic border-l-4 border-[var(--primary)] pl-4 text-black dark:text-white">{t.dashboard.recent_materials}</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <SearchInput />
                    <SortSelect />
                </div>
            </div>

            {notes.length === 0 ? (
                <Card className="text-center py-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-background shadow-none">
                <CardContent className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                        <FileText className="w-12 h-12 text-zinc-400" />
                    </div>
                    <h3 className="text-3xl font-black uppercase text-zinc-400 mb-3 italic">{t.dashboard.empty_title}</h3>
                    <p className="text-zinc-500 font-bold mb-10 max-w-sm mx-auto leading-relaxed">
                        {searchQuery || folderId 
                            ? t.dashboard.empty_search 
                            : t.dashboard.empty_desc}
                    </p>
                    {!searchQuery && !folderId && (
                        <Link href="/app/new">
                            <Button size="lg" className="h-14 px-10 text-xl font-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-background text-foreground">
                            <Plus className="mr-2 w-6 h-6" strokeWidth={3} />
                            {t.dashboard.create_btn}
                            </Button>
                        </Link>
                    )}
                </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {notes.map((note: any) => (
                    <NoteCard key={note.id} note={note} folders={folders} />
                ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
