'use client';

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Clock, ArrowUpRight, Zap } from "lucide-react";
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
      className="block group relative h-full outline-none"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("noteId", note.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <Card 
        className={`h-full border-[3px] border-foreground flex flex-col transition-all duration-300
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        group-hover:-translate-y-1 group-hover:translate-x-[-2px]
        group-hover:shadow-[8px_8px_0px_0px_var(--primary)]
        bg-background overflow-hidden relative
        `}
      >
        {/* Icon mũi tên tinh tế hơn ở góc */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
            <ArrowUpRight className="w-5 h-5 text-primary" strokeWidth={3} />
        </div>

        <CardHeader className="pb-4 pt-6 px-6 relative border-b-[3px] border-foreground/5">
          <div className="space-y-3">
            {/* Badge trạng thái nhỏ phía trên */}
            <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-tighter rounded">
                  {note.generations.length > 0 ? 'AI Enhanced' : 'Raw Note'}
                </span>
                <div className="h-[2px] flex-1 bg-foreground/10" />
            </div>

            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-xl font-black leading-tight group-hover:text-primary transition-colors text-foreground tracking-tight line-clamp-2">
                {note.title || "Untitled Note"}
              </CardTitle>
              
              {note.generations.length > 0 && (
                <div className="bg-yellow-400 border-2 border-foreground p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-foreground" fill="currentColor" />
                </div>
              )}
            </div>
          </div>
          
          {/* Nút Action tách biệt rõ ràng */}
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <NoteCardActions noteId={note.id} folders={folders} />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-6 bg-background/50">
          <div className="flex-1 mb-8">
            <p className="text-foreground/80 text-sm line-clamp-3 font-medium leading-relaxed italic border-l-4 border-primary/20 pl-3">
              "{note.sourceText}"
            </p>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t-2 border-foreground/5">
            <div className="flex items-center gap-1.5 text-foreground/60">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {note.generations.length > 0 ? (
              <div className="flex items-center gap-1 text-green-600">
                <Zap className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.note_actions.analyzed}</span>
              </div>
            ) : (
              <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">{t.note_actions.raw_data}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}