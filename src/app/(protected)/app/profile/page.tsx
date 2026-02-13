"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon, Mail, Shield, LogOut, ArrowLeft, Save, Loader2, Key, Send } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAlert } from "@/components/GlobalAlert";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [name, setName] = useState(session?.user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  if (!session) return null;

  async function requestOtp() {
    setIsRequestingOtp(true);
    try {
        const res = await fetch("/api/auth/otp/request", { method: "POST" });
        if (res.ok) toast.success(t.profile.toast_otp_success);
    } catch (e) { toast.error(t.common.error); }
    finally { setIsRequestingOtp(false); }
  }

  async function handleUpdateName() {
    if (!name || name === session?.user?.name) return;
    setIsUpdating(true);
    try {
        const res = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            await update({ name }); 
            toast.success(t.profile.toast_update_success);
        }
    } catch (e) { toast.error(t.common.error); }
    finally { setIsUpdating(false); }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !otp) return toast.error("Input Error", { description: "Fill all fields + OTP code." });
    setIsChangingPass(true);
    try {
        const res = await fetch("/api/user/password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword, otp })
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(t.profile.toast_pass_success);
            setCurrentPassword(""); setNewPassword(""); setOtp("");
        } else { toast.error("Auth Error", { description: data.error }); }
    } catch (e) { toast.error(t.common.error); }
    finally { setIsChangingPass(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative pb-20">
      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white text-foreground">
            <ArrowLeft className="mr-2 w-4 h-4" /> {t.profile.back_btn}
          </Button>
        </Link>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">{t.profile.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Name Control */}
        <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--primary)] bg-background">
            <div className="bg-[var(--primary)] p-4 border-b-4 border-black dark:border-white font-black text-white italic">{t.profile.identifier_title}</div>
            <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                    <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.profile.id_placeholder}
                        className="border-2 border-black dark:border-white font-black h-12 text-foreground"
                    />
                    <Button onClick={handleUpdateName} disabled={isUpdating} className="border-2 border-black dark:border-white bg-foreground text-background">
                        {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
                    </Button>
                </div>
                <div className="text-xs font-bold opacity-50 italic text-foreground">Link: {session.user?.email}</div>
            </CardContent>
        </Card>

        {/* Security Control */}
        {!session.user?.image && (
            <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--purple)] bg-background">
                <div className="bg-[var(--purple)] p-4 border-b-4 border-black dark:border-white font-black text-white italic flex justify-between items-center">
                    {t.profile.security_title}
                    <Button onClick={requestOtp} disabled={isRequestingOtp} size="sm" className="bg-background text-foreground border-2 border-black dark:border-white font-black text-[10px]">
                        {isRequestingOtp ? t.profile.sending_otp : t.profile.get_otp}
                    </Button>
                </div>
                <CardContent className="p-6 space-y-4">
                    <Input 
                        type="password" placeholder={t.profile.current_pass} 
                        value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        className="border-2 border-black dark:border-white font-bold text-foreground"
                    />
                    <Input 
                        type="password" placeholder={t.profile.new_pass} 
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="border-2 border-black dark:border-white font-bold text-foreground"
                    />
                    <div className="flex gap-2">
                        <Input 
                            placeholder={t.profile.otp_placeholder} 
                            value={otp} onChange={e => setOtp(e.target.value)}
                            className="border-2 border-black dark:border-white font-black text-center tracking-[10px] text-foreground"
                        />
                        <Button onClick={handleChangePassword} disabled={isChangingPass} className="bg-foreground text-background border-2 border-black dark:border-white font-black">
                            {isChangingPass ? <Loader2 className="animate-spin" /> : t.profile.update_btn}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Button onClick={() => signOut({ callbackUrl: "/" })} className="bg-red-500 text-white border-4 border-black h-16 font-black italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <LogOut className="mr-2" /> {t.profile.logout_btn}
        </Button>
      </div>
    </div>
  );
}
