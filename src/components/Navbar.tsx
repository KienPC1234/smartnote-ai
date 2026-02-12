"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Zap, Languages, User, Settings, LogOut, ChevronDown, AlertTriangle } from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EditProfileDialog } from "./EditProfileDialog";
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

export default function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useTranslation();

  return (
    <nav className="w-full border-b-2 border-black dark:border-white bg-white dark:bg-zinc-950 p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 transition-colors">
      <Link href={session ? "/app" : "/"} className="flex items-center gap-5 group">
        <div className="bg-[var(--primary)] p-2.5 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] group-hover:rotate-[15deg] transition-transform duration-300">
          <Zap className="w-6 h-6 text-white fill-current" />
        </div>
        <span className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase italic leading-none ml-1">
          Smart<span className="text-[var(--primary)]">Note</span>
        </span>
      </Link>

      <div className="flex gap-4 items-center">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="neutral"
                    size="sm"
                    className="border-2 border-black dark:border-white font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                >
                    <Languages className="w-4 h-4 mr-1" />
                    {lang === "en" ? "English" : "Tiếng Việt"}
                    <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="min-w-[150px] bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] p-1 z-50 animate-in fade-in slide-in-from-top-2"
                >
                    <DropdownMenu.Item asChild>
                        <button
                            onClick={() => setLang("en")}
                            className={`w-full flex items-center gap-3 p-3 font-bold hover:bg-[var(--primary)] hover:text-white dark:hover:text-black outline-none transition-colors border-b-2 border-black dark:border-white/20 uppercase text-xs ${lang === "en" ? "bg-[var(--primary)] text-white" : "text-black dark:text-white"}`}
                        >
                            🇺🇸 English
                        </button>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                        <button
                            onClick={() => setLang("vi")}
                            className={`w-full flex items-center gap-3 p-3 font-bold hover:bg-[var(--primary)] hover:text-white dark:hover:text-black outline-none transition-colors uppercase text-xs ${lang === "vi" ? "bg-[var(--primary)] text-white" : "text-black dark:text-white"}`}
                        >
                            🇻🇳 Tiếng Việt
                        </button>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <ThemeToggle />
        
        {session ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button 
                    className="flex items-center gap-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 px-4 py-2 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] outline-none transition-all"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="font-black text-sm uppercase max-w-[120px] truncate dark:text-white">
                        {session.user?.name || "Member"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content 
                    align="end" 
                    sideOffset={8}
                    className="min-w-[220px] bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] p-1 z-50 animate-in fade-in slide-in-from-top-2"
                >
                    <DropdownMenu.Item asChild>
                        <EditProfileDialog>
                            <button className="w-full flex items-center gap-3 p-4 font-bold hover:bg-[var(--accent)] hover:text-black dark:text-white dark:hover:text-black outline-none transition-colors border-b-2 border-black dark:border-white/20 uppercase text-xs">
                                <User className="w-5 h-5" />
                                Edit Profile
                            </button>
                        </EditProfileDialog>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item asChild>
                        <Link 
                            href="/app/profile" 
                            className="flex items-center gap-3 p-4 font-bold hover:bg-[var(--primary)] hover:text-white dark:text-white dark:hover:text-black outline-none transition-colors border-b-2 border-black dark:border-white/20 uppercase text-xs"
                        >
                            <Settings className="w-5 h-5" />
                            Security
                        </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                        <Link 
                            href="/app" 
                            className="flex items-center gap-3 p-4 font-bold hover:bg-[var(--secondary)] hover:text-black dark:text-white dark:hover:text-black outline-none transition-colors border-b-2 border-black dark:border-white/20 uppercase text-xs"
                        >
                            <Zap className="w-5 h-5" />
                            Dashboard
                        </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-1 bg-black dark:bg-white/20 my-1" />
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button 
                                className="w-full flex items-center gap-3 p-4 font-black text-red-500 hover:bg-red-500 hover:text-white outline-none transition-colors cursor-pointer uppercase text-xs"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff]">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-3xl font-black uppercase italic flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-[var(--primary)]" />
                                    Confirm Logout
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-bold text-zinc-600 dark:text-zinc-400">
                                    Are you sure you want to terminate your neural session?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                                <AlertDialogCancel asChild>
                                    <Button variant="neutral" className="border-2 border-black font-bold">CANCEL</Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button 
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_#000] font-black"
                                    >
                                        LOGOUT
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <div className="flex gap-3">
            <Link href="/auth/signin">
                <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white text-black dark:text-white">
                {t.nav.signIn}
                </Button>
            </Link>
            <Link href="/auth/signup">
                <Button variant="default" size="sm" className="font-bold border-2 border-black dark:border-white bg-[var(--secondary)] text-black shadow-[2px_2px_0px_0px_#000]">
                {t.nav.signUp}
                </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
