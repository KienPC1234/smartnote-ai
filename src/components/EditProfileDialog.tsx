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
import { useAlert } from "@/components/GlobalAlert";

export function EditProfileDialog({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const { showAlert } = useAlert();
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
        showAlert("Identity Synchronized", "Your profile has been updated in the neural network.", "success");
        setOpen(false);
      } else {
        showAlert("Sync Error", "Failed to update profile details.", "error");
      }
    } catch (error) {
      showAlert("Critical Error", "System connection failure.", "error");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Edit Profile</DialogTitle>
            <DialogDescription className="font-bold text-zinc-500">
              Make changes to your identity here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-black">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-2 border-black dark:border-white font-bold text-lg"
                placeholder="Enter your name..."
              />
            </div>
            <div className="grid gap-2 opacity-50">
              <Label className="text-[10px]">Registry ID</Label>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs truncate">
                {session?.user?.email}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <DialogClose asChild>
              <Button type="button" variant="neutral" className="border-2 border-black font-bold">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isUpdating || name === session?.user?.name}
              className="bg-[var(--primary)] text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] font-black uppercase"
            >
              {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
