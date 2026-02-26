'use client';

import { useEffect, useState } from 'react';
import { upsertNode } from '@/lib/vector-service';
import { toast } from 'sonner';

interface VectorIndexerProps {
    notes: any[];
}

export function VectorIndexer({ notes }: VectorIndexerProps) {
    const [progress, setProgress] = useState(0);
    const [isIndexing, setIsIndexing] = useState(false);

    useEffect(() => {
        const indexNotes = async () => {
            if (!notes || notes.length === 0) return;
            
            // Basic check to see if we should index (could use localStorage to avoid re-indexing unchanged notes)
            const lastIndexed = localStorage.getItem('last_indexed_count');
            if (lastIndexed === notes.length.toString()) {
                console.log("[VectorIndexer] Notes count match, skipping index.");
                return;
            }

            setIsIndexing(true);
            let count = 0;
            for (const note of notes) {
                await upsertNode({
                    id: note.id,
                    title: note.title,
                    content: note.sourceText,
                    updatedAt: note.updatedAt.toString()
                });
                count++;
                setProgress(Math.round((count / notes.length) * 100));
            }
            
            localStorage.setItem('last_indexed_count', notes.length.toString());
            setIsIndexing(false);
            console.log("[VectorIndexer] Finished indexing", count, "notes.");
        };

        indexNotes();
    }, [notes]);

    if (!isIndexing) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 bg-background border-2 border-foreground p-3 shadow-[4px_4px_0px_0px_var(--shadow)] animate-in slide-in-from-right-10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Neural Indexing...</p>
                    <p className="text-[8px] font-bold text-muted-foreground">{progress}% Complete</p>
                </div>
            </div>
        </div>
    );
}
