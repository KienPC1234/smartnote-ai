'use client';

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { NoteCardActions } from "./note-card-actions";
import { useTranslation } from "@/components/LanguageProvider";

interface NoteCardProps {
  note: any;
  folders: any[];
}

export function NoteCard({ note, folders }: NoteCardProps) {
  const { t } = useTranslation();

  return (
    <Link 
      href={`/app/n/${note.id}`} 
      className="block group relative h-full"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("noteId", note.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <Card 
        className={`h-full border-4 border-black dark:border-white flex flex-col transition-all duration-300
        shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]
        group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] group-hover:shadow-[12px_12px_0px_0px_var(--secondary)]
        bg-background
        `}
      >
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white/20 bg-background relative pr-12">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl font-black leading-tight line-clamp-2 uppercase group-hover:text-[var(--primary)] transition-colors text-foreground">
              {note.title}
            </CardTitle>
            {note.generations.length > 0 && (
              <div className="bg-[var(--accent)] border-2 border-black dark:border-white p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-12 transition-transform">
                <Sparkles className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
            )}
          </div>
          <NoteCardActions noteId={note.id} folders={folders} />
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col pt-6 bg-background">
          <div className="flex-1 mb-8 relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" 
              style={{ backgroundImage: 'linear-gradient(var(--foreground) 95%, transparent 95%)', backgroundSize: '100% 28px' }}>
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
              <span className="text-[var(--secondary)] bg-[var(--secondary)]/10 px-2 py-0.5 rounded border border-[var(--secondary)]/20">{t.note_actions.analyzed}</span>
            ) : (
              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-foreground/60">{t.note_actions.raw_data}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
