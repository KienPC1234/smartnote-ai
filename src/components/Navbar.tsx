'use client';

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Zap, Languages, User, Settings, LogOut, ChevronDown, AlertTriangle, BookOpen, Shield, Home } from "lucide-react";
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
    <nav className="w-full border-b-[3px] border-foreground bg-background px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors shadow-[0_4px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_4px_0_0_rgba(255,255,255,0.05)]">
      {/* Logo Section */}
      <div className="flex items-center gap-4">
        <Link href={session ? "/app" : "/"} className="flex items-center gap-3 group">
            <div className="bg-primary p-2 border-[3px] border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] group-hover:rotate-[10deg] transition-transform duration-300">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none hidden sm:block">
              Smart<span className="text-primary">Note</span>
            </span>
        </Link>
      </div>

      <div className="flex gap-3 md:gap-5 items-center">
        {/* Language Switcher */}
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="outline"
                    className="border-[3px] border-foreground font-bold text-[10px] md:text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all h-10 px-3 md:px-5 bg-background text-foreground"
                >
                    <Languages className="w-4 h-4 mr-2 text-primary" />
                    <span className="hidden md:inline">{lang === "en" ? "English" : "Tiếng Việt"}</span>
                    <span className="md:hidden">{lang.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="min-w-[180px] bg-background border-[3px] border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] p-1 z-50 animate-in fade-in zoom-in-95"
                >
                    <DropdownMenuItem 
                      active={lang === "en"} 
                      onClick={() => setLang("en")} 
                      label="🇺🇸 ENGLISH" 
                    />
                    <DropdownMenuItem 
                      active={lang === "vi"} 
                      onClick={() => setLang("vi")} 
                      label="🇻🇳 TIẾNG VIỆT" 
                    />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <ThemeToggle />
        
        {session ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button 
                    className="flex items-center gap-3 border-[3px] border-foreground bg-background px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none transition-all h-10"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="font-black text-xs uppercase max-w-[100px] truncate text-foreground tracking-widest hidden md:block">
                        {session.user?.name || t.nav.member}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 text-foreground" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content 
                    align="end" 
                    sideOffset={8}
                    className="min-w-[240px] bg-background border-[3px] border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] p-1 z-50 animate-in fade-in slide-in-from-top-4"
                >
                    <NavDropdownItem href="/app" icon={<Zap className="w-5 h-5" />} label={t.nav.dashboard} color="hover:bg-green-500 hover:text-white" />
                    <NavDropdownItem href="/" icon={<Home className="w-5 h-5" />} label={t.nav.landing} color="hover:bg-accent" />
                    <NavDropdownItem href="/app/profile" icon={<Shield className="w-5 h-5" />} label={`${t.nav.security} & ${t.nav.profile}`} color="hover:bg-purple-500 hover:text-white" />
                    
                    <DropdownMenu.Item asChild>
                        <EditProfileDialog>
                            <button className="w-full flex items-center gap-3 p-3 font-bold hover:bg-yellow-400 hover:text-black outline-none transition-colors border-b-2 border-foreground/5 uppercase text-[10px] text-foreground">
                                <User className="w-5 h-5" />
                                {t.nav.edit_profile}
                            </button>
                        </EditProfileDialog>
                    </DropdownMenu.Item>
                    
                    <NavDropdownItem href="/app/management" icon={<Settings className="w-5 h-5" />} label={t.nav.management} color="hover:bg-primary hover:text-white" />
                    <NavDropdownItem href="/app/guide" icon={<BookOpen className="w-5 h-5" />} label={t.nav.guide} color="hover:bg-blue-500 hover:text-white" />

                    <DropdownMenu.Separator className="h-1 bg-foreground/10 my-1" />
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button 
                                className="w-full flex items-center gap-3 p-3 font-bold text-red-500 hover:bg-red-500 hover:text-white outline-none transition-colors cursor-pointer uppercase text-[10px]"
                            >
                                <LogOut className="w-5 h-5" />
                                {t.nav.logOut}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-[6px] border-foreground shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] dark:shadow-[15px_15px_0px_0px_rgba(255,255,255,0.1)] bg-background rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-3xl font-black uppercase italic flex items-center gap-3 text-foreground tracking-tighter">
                                    <AlertTriangle className="w-8 h-8 text-primary" />
                                    {t.nav.logout_confirm_title}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-bold text-lg text-muted-foreground italic mt-2">
                                    {t.nav.logout_confirm_desc}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-4 mt-8">
                                <AlertDialogCancel asChild>
                                    <Button variant="outline" className="h-12 border-[3px] border-foreground font-black text-foreground bg-background uppercase hover:bg-muted">
                                        {t.common.cancel}
                                    </Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button 
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="h-12 bg-red-500 text-white border-[3px] border-foreground shadow-[4px_4px_0px_0px_#000] font-black uppercase active:translate-x-1 active:translate-y-1 active:shadow-none"
                                    >
                                        {t.nav.logOut}
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <div className="flex gap-2 md:gap-4">
            <Link href="/auth/signin">
                <Button variant="outline" className="h-10 px-4 md:px-6 font-bold border-[3px] border-foreground text-foreground bg-background uppercase shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-[10px] md:text-xs">
                {t.nav.signIn}
                </Button>
            </Link>
            <Link href="/auth/signup">
                <Button className="h-10 px-4 md:px-6 font-bold border-[3px] border-foreground bg-primary text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase text-[10px] md:text-xs">
                {t.nav.signUp}
                </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// Sub-components trợ giúp để code sạch hơn
function DropdownMenuItem({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <DropdownMenu.Item asChild>
      <button
          onClick={onClick}
          className={`w-full flex items-center justify-between p-3 font-bold outline-none transition-all mb-1 uppercase text-[10px] ${active ? "bg-primary text-white shadow-[2px_2px_0px_0px_#000]" : "text-foreground hover:bg-primary/10"}`}
      >
          {label}
          {active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
      </button>
    </DropdownMenu.Item>
  );
}

function NavDropdownItem({ href, icon, label, color }: { href: string, icon: React.ReactNode, label: string, color: string }) {
  return (
    <DropdownMenu.Item asChild>
        <Link 
            href={href} 
            className={`flex items-center gap-3 p-3 font-bold outline-none transition-colors border-b-2 border-foreground/5 uppercase text-[10px] text-foreground ${color}`}
        >
            {icon}
            {label}
        </Link>
    </DropdownMenu.Item>
  );
}