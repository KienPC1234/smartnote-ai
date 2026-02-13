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
    <div className="flex gap-4 overflow-x-auto pb-8 pt-2 items-center no-scrollbar">
      <Button
        variant={!currentFolderId ? "default" : "outline"}
        className={`shrink-0 font-black h-14 px-8 border-4 transition-all shadow-[6px_6px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none
            ${!currentFolderId 
                ? 'bg-primary text-main-foreground border-border shadow-secondary' 
                : 'bg-background border-border text-foreground'
            }
            ${dragOverFolder === "all" ? "bg-primary text-white scale-105" : ""}
        `}
        onClick={() => navigateToFolder(null)}
        onDragOver={(e) => onDragOver(e, "all")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, null)}
      >
        <FolderOpen className="w-6 h-6 mr-3" />
        {t.dashboard.all_notes}
      </Button>

      {folders.map((folder) => (
        <div 
            key={folder.id} 
            className="relative group shrink-0 transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        >
            <Button
            variant={currentFolderId === folder.id ? "default" : "outline"}
            className={`font-black h-14 px-8 pr-14 border-4 transition-all shadow-[6px_6px_0px_0px_var(--shadow)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none
                ${currentFolderId === folder.id 
                    ? 'bg-primary text-main-foreground border-border shadow-secondary' 
                    : 'bg-background border-border text-foreground'
                }
                ${dragOverFolder === folder.id ? "bg-accent text-black scale-105" : ""}
            `}
            onClick={() => navigateToFolder(folder.id)}
            onDragOver={(e) => onDragOver(e, folder.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, folder.id)}
            >
            <FolderIcon className="w-6 h-6 mr-3" />
            <span className="truncate max-w-[120px]">{folder.name}</span>
            </Button>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-foreground/10 rounded-full transition-colors text-foreground outline-none">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-4 border-border font-black bg-background text-foreground shadow-[4px_4px_0px_0px_var(--shadow)]">
                        <DropdownMenuItem className="p-3 focus:bg-primary focus:text-white" onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setRenameName(folder.name); }}>
                            <Pencil className="w-5 h-5 mr-3" /> {t.folder.rename}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 text-red-500 focus:text-white focus:bg-red-500" onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder.id); }}>
                            <Trash2 className="w-5 h-5 mr-3" /> {t.folder.delete}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      ))}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 w-14 h-14 border-dashed border-4 border-border hover:bg-foreground/5 transition-colors bg-background text-foreground shadow-[6px_6px_0px_0px_var(--shadow)]">
            <Plus className="w-8 h-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="border-8 border-border rounded-none bg-background shadow-[15px_15px_0px_0px_var(--shadow)]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic text-foreground tracking-tighter">{t.folder.create_title}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Input
                placeholder={t.folder.placeholder}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-16 border-4 border-border font-black text-xl bg-background text-foreground focus-visible:ring-0 focus-visible:border-primary shadow-[4px_4px_0px_0px_var(--shadow)]"
            />
          </div>
          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="h-14 border-4 border-border font-black text-xl text-foreground bg-background uppercase">{t.common.cancel}</Button>
            <Button onClick={handleCreateFolder} disabled={isPending} className="h-14 bg-primary text-white border-4 border-border font-black text-xl shadow-[6px_6px_0px_0px_var(--shadow)] uppercase">
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
