import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, Sparkles, Clock, LayoutDashboard, Settings, User as UserIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { generations: { select: { id: true } } }
  });

  const totalGenerations = notes.reduce((acc, note) => acc + note.generations.length, 0);

  return (
    <div className="space-y-10 relative pb-20">
       {/* Background Pattern */}
       <div className="absolute inset-0 z-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black dark:border-white pb-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-black uppercase tracking-widest text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    Student Dashboard
                </div>
                <h1 className="text-5xl font-black uppercase text-foreground italic tracking-tighter leading-none">
                    Hello, <span className="text-[var(--primary)]">{session.user?.name || session.user?.email?.split('@')[0]}</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold max-w-md">
                    You have <span className="text-foreground dark:text-white underline">{notes.length} notes</span> and <span className="text-foreground dark:text-white underline">{totalGenerations} AI study sets</span> ready.
                </p>
            </div>
            
            <Link href="/app/new">
                <Button size="lg" className="h-16 px-8 text-xl font-black border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-[var(--accent)] text-black hover:bg-[var(--accent)]">
                    <Plus className="mr-2 w-7 h-7" strokeWidth={3} />
                    CREATE NEW NOTE
                </Button>
            </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--secondary)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1">Total Notes</p>
                <p className="text-3xl font-black italic">{notes.length}</p>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--primary)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1">AI Study Sets</p>
                <p className="text-3xl font-black italic">{totalGenerations}</p>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--accent)]">
                <p className="text-xs font-black uppercase opacity-50 mb-1">Knowledge Gaps</p>
                <p className="text-3xl font-black italic">{notes.filter(n => n.generations.length > 0).length}</p>
            </div>
            <Link href="/app/profile" className="p-6 border-2 border-black dark:border-white bg-[var(--purple)] text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                <p className="text-xs font-black uppercase opacity-70 mb-1">Account</p>
                <div className="flex justify-between items-center">
                    <p className="text-xl font-black italic truncate">Settings</p>
                    <Settings className="w-6 h-6" />
                </div>
            </Link>
        </div>

        {/* Notes Section */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase italic border-l-4 border-[var(--primary)] pl-4">Recent Materials</h2>
                <div className="relative w-full max-w-xs hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="SEARCH NOTES..." 
                        className="w-full h-10 pl-10 pr-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white text-xs font-bold uppercase focus:outline-none"
                    />
                </div>
            </div>

            {notes.length === 0 ? (
                <Card className="text-center py-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none">
                <CardContent className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
                        <FileText className="w-12 h-12 text-zinc-400" />
                    </div>
                    <h3 className="text-3xl font-black uppercase text-zinc-400 mb-3 italic">Empty Library</h3>
                    <p className="text-zinc-500 font-bold mb-10 max-w-sm mx-auto leading-relaxed">
                        Your study kingdom is waiting for its first scroll. Paste your notes to begin the AI transformation.
                    </p>
                    <Link href="/app/new">
                        <Button size="lg" className="h-14 px-10 text-xl font-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] bg-white dark:bg-zinc-800 text-black dark:text-white">
                        <Plus className="mr-2 w-6 h-6" strokeWidth={3} />
                        CREATE NOW
                        </Button>
                    </Link>
                </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {notes.map((note: any, idx: number) => (
                    <Link key={note.id} href={`/app/n/${note.id}`} className="block group">
                    <Card 
                        className={`h-full border-2 border-black dark:border-white flex flex-col transition-all duration-300
                        group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-[12px_12px_0px_0px_var(--secondary)]
                        dark:bg-zinc-900
                        `}
                    >
                        <CardHeader className="pb-3 border-b-2 border-black dark:border-white/20 bg-zinc-50 dark:bg-zinc-950">
                            <div className="flex justify-between items-start gap-4">
                                <CardTitle className="text-xl font-black leading-tight line-clamp-2 uppercase group-hover:text-[var(--primary)] transition-colors">
                                    {note.title}
                                </CardTitle>
                                {note.generations.length > 0 && (
                                    <div className="bg-[var(--accent)] border-2 border-black dark:border-white p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        <Sparkles className="w-4 h-4 text-black" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 flex flex-col pt-6">
                        <div className="flex-1 mb-8 relative">
                            <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" 
                                style={{ backgroundImage: 'linear-gradient(transparent 95%, #000 95%)', backgroundSize: '100% 28px' }}>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-5 font-medium leading-relaxed italic">
                                "{note.sourceText}"
                            </p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 mt-auto border-t-2 border-black dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </div>
                                {note.generations.length > 0 ? (
                                    <span className="text-[var(--secondary)] bg-[var(--secondary)]/10 px-2 py-0.5 rounded border border-[var(--secondary)]/20">Analyzed</span>
                                ) : (
                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Raw Data</span>
                                )}
                        </div>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
