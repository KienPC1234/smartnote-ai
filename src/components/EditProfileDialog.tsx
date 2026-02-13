"use client";

import * as React from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import { toast } from "sonner";

export function EditProfileDialog({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const [name, setName] = useState(session?.user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name || name === session?.user?.name) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        await update({ name });
        toast.success(t.profile.toast_update_success);
        setOpen(false);
      } else {
        toast.error(t.common.error);
      }
    } catch (error) {
      toast.error(t.common.error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-foreground">{t.nav.edit_profile}</DialogTitle>
            <DialogDescription className="font-bold text-zinc-500">
              {t.nav.edit_profile_desc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-black text-foreground">{t.auth.name_label}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-2 border-black dark:border-white font-bold text-lg text-foreground bg-background"
                placeholder={t.auth.name_placeholder}
              />
            </div>
            <div className="grid gap-2 opacity-50">
              <Label className="text-[10px] text-foreground">{t.nav.registry_id}</Label>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs truncate text-foreground">
                {session?.user?.email}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <DialogClose asChild>
              <Button type="button" variant="neutral" className="border-2 border-black dark:border-white font-bold text-foreground">
                {t.common.cancel}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isUpdating || name === session?.user?.name}
              className="bg-[var(--primary)] text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase"
            >
              {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : t.nav.save_changes}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
