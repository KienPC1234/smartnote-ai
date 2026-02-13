"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { 
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown, 
    Trash2, Pencil, Search, ArrowLeft, CheckSquare, Square,
    AlertTriangle, Loader2, Filter
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
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black dark:border-white pb-8">
                <div className="space-y-2">
                    <Link href="/app">
                        <Button variant="neutral" size="sm" className="h-8 px-3 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground mb-2">
                            <ArrowLeft className="w-3 h-3 mr-1" /> {t.common.back}
                        </Button>
                    </Link>
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter text-foreground leading-none">Note <span className="text-[var(--primary)]">Management</span></h1>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Neural Archive & Control Center</p>
                </div>

                <div className="flex gap-4">
                    {selectedNotes.size > 0 || selectedFolders.size > 0 ? (
                        <Button 
                            onClick={() => setShowDeleteAlert(true)}
                            className="h-14 px-8 bg-red-500 text-white font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                        >
                            <Trash2 className="mr-2 w-5 h-5" />
                            PURGE SELECTED ({selectedNotes.size + selectedFolders.size})
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* TreeView */}
            <Card className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
                <CardContent className="p-0">
                    <div className="p-6 border-b-4 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 flex items-center gap-4">
                        <Search className="w-6 h-6 opacity-40 text-foreground" />
                        <input 
                            placeholder="FILTER ARCHIVE NODES..." 
                            className="bg-transparent border-none outline-none font-black text-xl uppercase w-full placeholder:opacity-20 text-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)]" />
                                <p className="font-black uppercase text-xs tracking-[0.3em] opacity-40">Accessing Neural Archive...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Folders */}
                                {folders.map(folder => (
                                    <div key={folder.id} className="space-y-2">
                                        <div className={cn(
                                            "flex items-center gap-4 p-4 border-2 border-black dark:border-white group transition-all",
                                            selectedFolders.has(folder.id) ? "bg-[var(--accent)]" : "bg-background hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        )}>
                                            <button onClick={() => toggleFolderSelection(folder.id, folder.notes)} className="text-foreground">
                                                {selectedFolders.has(folder.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-3 flex-1 text-left text-foreground">
                                                {expandedFolders.has(folder.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                <FolderIcon className="w-6 h-6 text-[var(--primary)]" />
                                                <span className="font-black uppercase text-lg italic">{folder.name}</span>
                                                <span className="text-[10px] font-bold opacity-40">({folder.notes.length} NODES)</span>
                                            </button>
                                        </div>

                                        {expandedFolders.has(folder.id) && (
                                            <div className="pl-12 space-y-2 border-l-4 border-black/10 dark:border-white/10 ml-6">
                                                {folder.notes.map(note => (
                                                    <div key={note.id} className={cn(
                                                        "flex items-center gap-4 p-3 border-2 border-black dark:border-white transition-all",
                                                        selectedNotes.has(note.id) ? "bg-[var(--primary)] text-white" : "bg-background text-foreground"
                                                    )}>
                                                        <button onClick={() => toggleNoteSelection(note.id)}>
                                                            {selectedNotes.has(note.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                        <FileText className="w-4 h-4 opacity-40" />
                                                        <span className="font-bold flex-1 truncate">{note.title}</span>
                                                        <span className="text-[9px] font-black opacity-40 uppercase">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Unassigned Notes */}
                                {unassignedNotes.length > 0 && (
                                    <div className="space-y-2 pt-4">
                                        <h3 className="text-xs font-black uppercase opacity-40 tracking-widest pl-4 mb-4 text-foreground">UNASSIGNED NODES</h3>
                                        {unassignedNotes.map(note => (
                                            <div key={note.id} className={cn(
                                                "flex items-center gap-4 p-4 border-2 border-black dark:border-white group transition-all",
                                                selectedNotes.has(note.id) ? "bg-[var(--primary)] text-white" : "bg-background text-foreground"
                                            )}>
                                                <button onClick={() => toggleNoteSelection(note.id)}>
                                                    {selectedNotes.has(note.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                </button>
                                                <FileText className="w-6 h-6 opacity-40" />
                                                <span className="font-black uppercase text-lg flex-1 truncate">{note.title}</span>
                                                <span className="text-[10px] font-bold opacity-40 uppercase">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-3xl font-black uppercase italic flex items-center gap-3 text-red-500">
                            <AlertTriangle className="w-8 h-8" />
                            CRITICAL PURGE
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-zinc-600 dark:text-zinc-400 text-foreground">
                            You are about to permanently delete {selectedNotes.size} nodes and {selectedFolders.size} structures. 
                            This action is irreversible and will erase all associated neural mappings. Proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel asChild>
                            <Button variant="neutral" className="border-2 border-black dark:border-white font-bold text-foreground bg-background">
                                {t.common.cancel}
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button 
                                onClick={handleDeleteBatch}
                                disabled={isPending}
                                className="bg-red-500 text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black"
                            >
                                {isPending ? t.common.loading : "CONFIRM PURGE"}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
