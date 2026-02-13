'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, FolderInput, AlertTriangle } from "lucide-react";
import { deleteNote, moveNote } from "@/actions/notes";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { useTranslation } from "@/components/LanguageProvider";

interface Folder {
  id: string;
  name: string;
}

interface NoteCardActionsProps {
  noteId: string;
  folders: Folder[];
}

export function NoteCardActions({ noteId, folders }: NoteCardActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (result.success) {
        toast.success(t.note_actions.toast_deleted);
        setShowDeleteAlert(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleMove = async (folderId: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-10 bg-background/50 hover:bg-background border border-black/10 dark:border-white/10 shadow-sm text-black dark:text-white"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px] border-2 border-black dark:border-white font-bold bg-background text-black dark:text-white">
            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                    <FolderInput className="w-4 h-4 mr-2" />
                    {t.note_actions.move_to}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-2 border-black dark:border-white font-bold bg-background text-black dark:text-white">
                        <DropdownMenuItem onClick={(e) => handleMove(null, e)} className="cursor-pointer">
                            {t.note_actions.no_folder}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                        {folders.map(folder => (
                            <DropdownMenuItem key={folder.id} onClick={(e) => handleMove(folder.id, e)} className="cursor-pointer">
                                {folder.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
            <DropdownMenuItem 
                onSelect={(e) => { e.preventDefault(); setShowDeleteAlert(true); }}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
            >
            <Trash2 className="w-4 h-4 mr-2" />
            {t.note_actions.delete}
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-3xl font-black uppercase italic flex items-center gap-3 text-foreground">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        {t.note_actions.delete}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-zinc-600 dark:text-zinc-400 text-foreground">
                        {t.note_actions.delete_confirm}
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
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-red-500 text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black"
                        >
                            {isPending ? t.common.loading : t.note_actions.delete}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
