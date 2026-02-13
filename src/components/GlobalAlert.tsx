"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { create } from "zustand";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "./LanguageProvider";

interface AlertStore {
  isOpen: boolean;
  title: string;
  description: string;
  variant: "info" | "success" | "error";
  showAlert: (title: string, description: string, variant?: "info" | "success" | "error") => void;
  closeAlert: () => void;
}

export const useAlert = create<AlertStore>((set) => ({
  isOpen: false,
  title: "",
  description: "",
  variant: "info",
  showAlert: (title, description, variant = "info") => set({ isOpen: true, title, description, variant }),
  closeAlert: () => set({ isOpen: false }),
}));

export function GlobalAlert() {
  const { isOpen, title, description, variant, closeAlert } = useAlert();
  const { t } = useTranslation();

  const icons = {
    info: <Info className="w-8 h-8 text-[var(--secondary)]" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
    error: <AlertCircle className="w-8 h-8 text-[var(--primary)]" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeAlert}>
      <DialogContent className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 border-2 border-black dark:border-white rounded-full bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            {icons[variant]}
          </div>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-foreground">{title}</DialogTitle>
          <DialogDescription className="font-bold text-zinc-600 dark:text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={closeAlert} className="px-8 font-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-background text-foreground">
            {t.common.understood}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
