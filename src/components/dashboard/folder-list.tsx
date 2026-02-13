'use client';

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Folder as FolderIcon, Plus, MoreVertical, Pencil, Trash2, FolderOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { createFolder, deleteFolder, updateFolder } from "@/actions/folders";
import { moveNote } from "@/actions/notes";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/components/LanguageProvider";

interface Folder {
  id: string;
  name: string;
}

interface FolderListProps {
  folders: Folder[];
}

export function FolderList({ folders }: FolderListProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("folder");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isPending, startTransition] = useTransition();

  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [renameName, setRenameName] = useState("");
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    startTransition(async () => {
      const result = await createFolder(newFolderName);
      if (result.success) {
        toast.success(t.folder.toast_created);
        setIsCreateOpen(false);
        setNewFolderName("");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRenameFolder = async () => {
      if (!editingFolder || !renameName.trim()) return;

      startTransition(async () => {
          const result = await updateFolder(editingFolder.id, renameName);
          if (result.success) {
              toast.success(t.folder.toast_renamed);
              setEditingFolder(null);
          } else {
              toast.error(result.error);
          }
      });
  }

  const handleDeleteFolder = async (id: string) => {
      startTransition(async () => {
          const result = await deleteFolder(id);
          if (result.success) {
              toast.success(t.folder.toast_deleted);
              if (currentFolderId === id) {
                  router.push("/app");
              }
              setFolderToDelete(null);
          } else {
              toast.error(result.error);
          }
      });
  }

  const navigateToFolder = (folderId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (folderId) {
      params.set("folder", folderId);
    } else {
      params.delete("folder");
    }
    router.push(`/app?${params.toString()}`);
  };

  const onDragOver = (e: React.DragEvent, folderId: string | null) => {
      e.preventDefault();
      setDragOverFolder(folderId);
  };

  const onDragLeave = () => {
      setDragOverFolder(null);
  };

  const onDrop = async (e: React.DragEvent, folderId: string | null) => {
      e.preventDefault();
      setDragOverFolder(null);
      const noteId = e.dataTransfer.getData("noteId");
      if (!noteId) return;

      startTransition(async () => {
          const result = await moveNote(noteId, folderId);
          if (result.success) {
              toast.success(folderId ? t.note_actions.toast_moved : t.note_actions.toast_removed);
          } else {
              toast.error(result.error);
          }
      });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-6 pt-2 items-center no-scrollbar">
      <Button
        variant={!currentFolderId ? "secondary" : "ghost"}
        className={`shrink-0 font-black h-12 px-6 border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none
            ${!currentFolderId 
                ? 'bg-[var(--primary)] text-white border-black dark:border-white' 
                : 'bg-background border-black dark:border-white text-black dark:text-white'
            }
            ${dragOverFolder === "all" ? "bg-[var(--primary)] text-white scale-105" : ""}
        `}
        onClick={() => navigateToFolder(null)}
        onDragOver={(e) => onDragOver(e, "all")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, null)}
      >
        <FolderOpen className="w-5 h-5 mr-2" />
        {t.dashboard.all_notes}
      </Button>

      {folders.map((folder) => (
        <div key={folder.id} className="relative group shrink-0">
            <Button
            variant={currentFolderId === folder.id ? "secondary" : "ghost"}
            className={`font-black h-12 px-6 pr-10 border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none
                ${currentFolderId === folder.id 
                    ? 'bg-[var(--primary)] text-white border-black dark:border-white' 
                    : 'bg-background border-black dark:border-white text-black dark:text-white'
                }
                ${dragOverFolder === folder.id ? "bg-[var(--accent)] text-black scale-105" : ""}
            `}
            onClick={() => navigateToFolder(folder.id)}
            onDragOver={(e) => onDragOver(e, folder.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, folder.id)}
            >
            <FolderIcon className="w-5 h-5 mr-2" />
            {folder.name}
            </Button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors z-10 text-foreground">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2 border-black dark:border-white font-bold bg-background text-foreground">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setRenameName(folder.name); }}>
                        <Pencil className="w-4 h-4 mr-2" /> {t.folder.rename}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder.id); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> {t.folder.delete}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      ))}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 w-12 h-12 border-dashed border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-background text-foreground">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="border-4 border-black dark:border-white rounded-none bg-background">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic text-foreground">{t.folder.create_title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
                placeholder={t.folder.placeholder}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-12 border-2 border-black dark:border-white font-bold text-lg focus-visible:ring-0 focus-visible:border-[var(--primary)] text-foreground bg-background"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-2 border-black dark:border-white font-black text-foreground bg-background">{t.common.cancel}</Button>
            <Button onClick={handleCreateFolder} disabled={isPending} className="bg-[var(--primary)] text-white border-2 border-black dark:border-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {isPending ? t.folder.creating : t.folder.create_btn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent className="border-4 border-black dark:border-white rounded-none bg-background">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic text-foreground">{t.folder.rename_title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Input
                    placeholder={t.folder.placeholder}
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="h-12 border-2 border-black dark:border-white font-bold text-lg focus-visible:ring-0 focus-visible:border-[var(--primary)] text-foreground bg-background"
                />
            </div>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditingFolder(null)} className="border-2 border-black dark:border-white font-black text-foreground bg-background">{t.common.cancel}</Button>
                <Button onClick={handleRenameFolder} disabled={isPending} className="bg-[var(--primary)] text-white border-2 border-black dark:border-white font-black shadow-[4px_4px_0px_0px_#000]">
                    {isPending ? t.folder.saving : t.folder.save_btn}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-3xl font-black uppercase italic flex items-center gap-3 text-foreground">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    {t.folder.delete}
                </AlertDialogTitle>
                <AlertDialogDescription className="font-bold text-zinc-600 dark:text-zinc-400 text-foreground">
                    {t.folder.delete_confirm}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
                <AlertDialogCancel asChild>
                    <Button variant="neutral" className="border-2 border-black dark:border-white font-bold text-foreground">
                        {t.common.cancel}
                    </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                    <Button 
                        onClick={() => folderToDelete && handleDeleteFolder(folderToDelete)}
                        className="bg-red-500 text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black"
                    >
                        {t.folder.delete}
                    </Button>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
