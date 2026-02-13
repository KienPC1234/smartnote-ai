import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, Sparkles, Clock, LayoutDashboard, Settings, User as UserIcon, ShieldCheck, Folder } from "lucide-react";
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

  const analyzedNotesCount = notes.filter(n => n.generations.length > 0).length;
  const totalGenerations = notes.reduce((acc, note) => acc + note.generations.length, 0);

  return (
    <div className="space-y-8 relative pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="relative z-10 space-y-10">
        {/* Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b-4 border-border pb-8 relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] bg-background border-2 border-border px-2 py-0.5 w-fit shadow-[2px_2px_0px_0px_var(--shadow)] mb-3">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t.dashboard.student_dashboard}
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase text-foreground italic tracking-tighter leading-none flex items-center flex-nowrap whitespace-nowrap overflow-visible">
                    {t.dashboard.welcome},&nbsp;<span className="text-primary drop-shadow-[4px_4px_0px_var(--shadow)]">{session.user?.name?.split(' ')[0] || "Student"}</span>
                </h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm font-bold text-foreground/60 italic">
                    <span className="flex items-center gap-2 underline decoration-2 decoration-primary/20 underline-offset-4">
                        <FileText className="w-4 h-4" /> {t.dashboard.notes_count.replace("{count}", notes.length.toString())}
                    </span>
                    <span className="flex items-center gap-2 underline decoration-2 decoration-purple/20 underline-offset-4">
                        <Sparkles className="w-4 h-4" /> {analyzedNotesCount} AI Optimized
                    </span>
                    <span className="flex items-center gap-2 underline decoration-2 decoration-green/20 underline-offset-4">
                        <Folder className="w-4 h-4" /> {folders.length} Collections
                    </span>
                </div>
            </div>
            
            <Link href="/app/new" className="relative z-10 shrink-0">
                <Button size="lg" className="h-20 px-10 text-2xl font-black border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-orange text-white hover:bg-orange transition-all">
                    <Plus className="mr-3 w-8 h-8" strokeWidth={4} />
                    {t.dashboard.create_btn}
                </Button>
            </Link>
        </div>

        {/* Stats Grid - Smaller & Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: t.dashboard.stats_notes, value: notes.length, color: 'var(--blue)' },
                { label: t.dashboard.stats_ai, value: totalGenerations, color: 'var(--purple)' },
                { label: t.dashboard.stats_gaps, value: analyzedNotesCount, color: 'var(--green)' },
                { label: t.nav.profile, value: session.user?.name?.split(' ')[0], color: 'var(--accent)', icon: UserIcon, href: "/app/profile" }
            ].map((stat, i) => (
                stat.href ? (
                    <Link key={i} href={stat.href} className="p-4 border-4 border-border bg-accent text-foreground shadow-[4px_4px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group">
                        <p className="text-[10px] font-black uppercase opacity-70 mb-1 tracking-widest">{stat.label}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-xl font-black italic truncate uppercase">{stat.value}</p>
                            {stat.icon && <stat.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        </div>
                    </Link>
                ) : (
                    <div key={i} className="p-4 border-4 border-border bg-background shadow-[4px_4px_0px_0px_stat.color]" style={{ boxShadow: `4px 4px 0px 0px ${stat.color}` }}>
                        <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-black italic text-foreground">{stat.value}</p>
                    </div>
                )
            ))}
        </div>

        {/* Folders Section */}
        <div className="space-y-4">
            <h2 className="text-xl font-black uppercase italic border-l-4 border-primary pl-4 text-foreground tracking-tighter">{t.dashboard.folders_title}</h2>
            <FolderList folders={folders} />
        </div>

        {/* Notes Section */}
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b-2 border-border/10 pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase italic border-l-4 border-primary pl-4 text-foreground tracking-tighter">{t.dashboard.recent_materials}</h2>
                    <Link href="/app/management" className="p-2 border-2 border-border bg-background hover:bg-secondary-background shadow-[2px_2px_0px_0px_var(--shadow)] transition-all group">
                        <Settings className="w-4 h-4 text-foreground group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchInput />
                    <SortSelect />
                </div>
            </div>

            {notes.length === 0 ? (
                <Card className="text-center py-20 border-4 border-dashed border-border/30 bg-background shadow-none">
                <CardContent className="flex flex-col items-center">
                    <FileText className="w-16 h-16 text-foreground/10 mb-6" />
                    <h3 className="text-3xl font-black uppercase text-foreground/30 mb-2 italic tracking-tighter">{t.dashboard.empty_title}</h3>
                    <p className="text-foreground/50 font-bold mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                        {searchQuery || folderId ? t.dashboard.empty_search : t.dashboard.empty_desc}
                    </p>
                </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
