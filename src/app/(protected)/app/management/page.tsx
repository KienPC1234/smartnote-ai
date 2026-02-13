"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { 
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown, 
    Trash2, Pencil, Search, ArrowLeft, CheckSquare, Square,
    AlertTriangle, Loader2, Filter, Archive, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
    id: string;
    title: string;
    folderId: string | null;
    updatedAt: string;
}

interface Folder {
    id: string;
    name: string;
    notes: Note[];
}

export default function ManagementPage() {
    const { t } = useTranslation();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [unassignedNotes, setUnassignedNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    
    const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notes/management");
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();
            setFolders(data.folders);
            setUnassignedNotes(data.unassignedNotes);
        } catch (e) {
            toast.error("Signal lost. Could not retrieve nodes.");
        } finally {
            setIsLoading(false);
        }
    }

    const toggleFolder = (id: string) => {
        const next = new Set(expandedFolders);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedFolders(next);
    };

    const toggleNoteSelection = (id: string) => {
        const next = new Set(selectedNotes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedNotes(next);
    };

    const toggleFolderSelection = (folderId: string, folderNotes: Note[]) => {
        const nextF = new Set(selectedFolders);
        const nextN = new Set(selectedNotes);
        
        if (nextF.has(folderId)) {
            nextF.delete(folderId);
            folderNotes.forEach(n => nextN.delete(n.id));
        } else {
            nextF.add(folderId);
            folderNotes.forEach(n => nextN.add(n.id));
        }
        
        setSelectedFolders(nextF);
        setSelectedNotes(nextN);
    };

    const handleDeleteBatch = async () => {
        startTransition(async () => {
            try {
                const res = await fetch("/api/notes/batch-delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        noteIds: Array.from(selectedNotes),
                        folderIds: Array.from(selectedFolders)
                    })
                });
                if (!res.ok) throw new Error("Batch deletion failed");
                toast.success("Nodes purged from system.");
                setSelectedNotes(new Set());
                setSelectedFolders(new Set());
                fetchData();
            } catch (e) {
                toast.error("Purge failed. System error.");
            } finally {
                setShowDeleteAlert(false);
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4 pt-10">
            {/* Header - Balanced Spacing & Sizes */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-4 border-border pb-8 relative">
                <div className="space-y-6 w-full">
                    <Link href="/app" className="block">
                        <Button variant="outline" size="sm" className="font-bold border-2 border-border text-foreground bg-background shadow-[4px_4px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all h-10 px-4 text-xs">
                            <ArrowLeft className="w-4 h-4 mr-2" /> {t.common.back}
                        </Button>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold uppercase italic tracking-tighter text-foreground leading-none">
                            Note <span className="text-purple drop-shadow-[2px_2px_0px_var(--shadow)]">Management</span>
                        </h1>
                        <p className="text-foreground/50 font-bold uppercase text-[10px] tracking-[0.2em] italic">Neural Archive & Control Center</p>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto shrink-0">
                    {(selectedNotes.size > 0 || selectedFolders.size > 0) && (
                        <Button 
                            onClick={() => setShowDeleteAlert(true)}
                            className="h-16 px-8 bg-red-500 text-white font-bold border-4 border-border shadow-[6px_6px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all animate-in zoom-in-95"
                        >
                            <Trash2 className="mr-3 w-6 h-6" />
                            PURGE ({selectedNotes.size + selectedFolders.size})
                        </Button>
                    )}
                </div>
            </div>

            {/* TreeView Container */}
            <Card className="border-4 border-border shadow-[10px_10px_0px_0px_var(--shadow)] bg-background overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b-4 border-border bg-secondary-background flex items-center gap-4">
                        <div className="p-2 bg-foreground text-background border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow)]">
                            <Search className="w-5 h-5" />
                        </div>
                        <input 
                            placeholder="FILTER ARCHIVE NODES..." 
                            className="bg-transparent border-none outline-none font-bold text-xl uppercase w-full placeholder:opacity-20 text-foreground tracking-tight"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="p-6 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={3} />
                                <p className="font-bold uppercase text-xs tracking-[0.3em] opacity-40">Accessing Neural Archive...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Folders */}
                                {folders.map(folder => (
                                    <div key={folder.id} className="space-y-2">
                                        <div className={cn(
                                            "flex items-center gap-4 p-4 border-2 border-border transition-all shadow-[4px_4px_0px_0px_var(--shadow)]",
                                            selectedFolders.has(folder.id) ? "bg-accent" : "bg-background hover:bg-secondary-background"
                                        )}>
                                            <button 
                                                onClick={() => toggleFolderSelection(folder.id, folder.notes)} 
                                                className={cn(
                                                    "w-8 h-8 border-2 border-border flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_var(--shadow)]",
                                                    selectedFolders.has(folder.id) ? "bg-foreground text-background" : "bg-background text-foreground"
                                                )}
                                            >
                                                {selectedFolders.has(folder.id) ? <CheckSquare className="w-4 h-4" strokeWidth={3} /> : <Square className="w-4 h-4" strokeWidth={3} />}
                                            </button>
                                            <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-3 flex-1 text-left text-foreground group">
                                                <div className="transition-transform group-hover:scale-110">
                                                    {expandedFolders.has(folder.id) ? <ChevronDown className="w-6 h-6" strokeWidth={3} /> : <ChevronRight className="w-6 h-6" strokeWidth={3} />}
                                                </div>
                                                <FolderIcon className="w-6 h-6 text-primary" fill="currentColor" fillOpacity={0.1} strokeWidth={2} />
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase text-lg italic tracking-tight leading-none">{folder.name}</span>
                                                    <span className="text-[9px] font-bold opacity-40 tracking-widest mt-1 italic">{folder.notes.length} NODES</span>
                                                </div>
                                            </button>
                                        </div>

                                        {expandedFolders.has(folder.id) && (
                                            <div className="pl-12 space-y-2 border-l-4 border-border/10 ml-8 py-1 animate-in slide-in-from-left-4">
                                                {folder.notes.map(note => (
                                                    <div key={note.id} className={cn(
                                                        "flex items-center gap-4 p-3 border-2 border-border transition-all shadow-[3px_3px_0px_0px_var(--shadow)]",
                                                        selectedNotes.has(note.id) ? "bg-primary/90 text-white" : "bg-background text-foreground hover:bg-secondary-background"
                                                    )}>
                                                        <button 
                                                            onClick={() => toggleNoteSelection(note.id)}
                                                            className={cn(
                                                                "w-6 h-6 border-2 border-border flex items-center justify-center transition-colors shadow-[1px_1px_0px_0px_var(--shadow)]",
                                                                selectedNotes.has(note.id) ? "bg-white text-primary" : "bg-background text-foreground"
                                                            )}
                                                        >
                                                            {selectedNotes.has(note.id) ? <CheckSquare className="w-3 h-3" strokeWidth={3} /> : <Square className="w-3 h-3" strokeWidth={3} />}
                                                        </button>
                                                        <FileText className="w-5 h-5 opacity-40 shrink-0" strokeWidth={2} />
                                                        <span className="font-semibold uppercase text-sm flex-1 truncate italic tracking-tight">{note.title}</span>
                                                        <div className="hidden sm:flex items-center gap-2 opacity-30 italic">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Unassigned Notes */}
                                {unassignedNotes.length > 0 && (
                                    <div className="space-y-2 pt-8">
                                        <div className="flex items-center gap-3 px-2 mb-4">
                                            <Archive className="w-5 h-5 text-orange" strokeWidth={2} />
                                            <h3 className="text-sm font-bold uppercase italic tracking-tighter text-foreground">UNASSIGNED NODES</h3>
                                            <div className="h-0.5 flex-1 bg-border/5 rounded-full"></div>
                                        </div>
                                        <div className="space-y-2">
                                            {unassignedNotes.map(note => (
                                                <div key={note.id} className={cn(
                                                    "flex items-center gap-4 p-4 border-2 border-border transition-all shadow-[4px_4px_0px_0px_var(--shadow)]",
                                                    selectedNotes.has(note.id) ? "bg-primary/90 text-white" : "bg-background text-foreground hover:bg-secondary-background"
                                                )}>
                                                    <button 
                                                        onClick={() => toggleNoteSelection(note.id)}
                                                        className={cn(
                                                            "w-8 h-8 border-2 border-border flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_var(--shadow)]",
                                                            selectedNotes.has(note.id) ? "bg-white text-primary" : "bg-background text-foreground"
                                                        )}
                                                    >
                                                        {selectedNotes.has(note.id) ? <CheckSquare className="w-4 h-4" strokeWidth={3} /> : <Square className="w-4 h-4" strokeWidth={3} />}
                                                    </button>
                                                    <FileText className="w-6 h-6 opacity-40 shrink-0" strokeWidth={2} />
                                                    <span className="font-bold uppercase text-lg flex-1 truncate italic tracking-tighter">{note.title}</span>
                                                    <div className="flex items-center gap-3 opacity-30 italic">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent className="border-4 border-border shadow-[15px_15px_0px_0px_var(--shadow)] bg-background rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-3xl font-bold uppercase italic flex items-center gap-4 text-red-500 tracking-tighter leading-none">
                            <AlertTriangle className="w-10 h-10" strokeWidth={2} />
                            SYSTEM PURGE
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-lg text-foreground/70 leading-relaxed mt-6 italic">
                            CRITICAL ACTION: Permanently erase <span className="text-foreground underline decoration-red-500">{selectedNotes.size} nodes</span> and <span className="text-foreground underline decoration-red-500">{selectedFolders.size} structures</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-4 mt-8">
                        <AlertDialogCancel asChild>
                            <Button variant="outline" className="h-14 px-6 border-2 border-border font-bold text-lg text-foreground bg-background uppercase hover:bg-secondary-background">
                                ABORT
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button 
                                onClick={handleDeleteBatch}
                                disabled={isPending}
                                className="h-14 px-6 bg-red-500 text-white border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow)] font-bold text-lg uppercase"
                            >
                                {isPending ? "PURGING..." : "CONFIRM PURGE"}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
