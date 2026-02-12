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

export default function ProfilePage() {
  const { data: session, update } = useSession();
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
        if (res.ok) showAlert("Code Sent", "Neural Access Code sent to your email!", "success");
    } catch (e) { showAlert("Request Failed", "Failed to request code.", "error"); }
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
            showAlert("Identity Updated", "Your display identifier has been saved.", "success");
        }
    } catch (e) { showAlert("Update Failed", "System synchronization failed.", "error"); }
    finally { setIsUpdating(false); }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !otp) return showAlert("Input Error", "Fill all fields + OTP code.", "error");
    setIsChangingPass(true);
    try {
        const res = await fetch("/api/user/password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword, otp })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert("Security Updated", "Neural access credentials modified.", "success");
            setCurrentPassword(""); setNewPassword(""); setOtp("");
        } else { showAlert("Auth Error", data.error, "error"); }
    } catch (e) { showAlert("System Error", "Failed to modify security.", "error"); }
    finally { setIsChangingPass(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative pb-20">
      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white">
            <ArrowLeft className="mr-2 w-4 h-4" /> BACK
          </Button>
        </Link>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Access Control</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Name Control */}
        <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--primary)] dark:bg-zinc-900">
            <div className="bg-[var(--primary)] p-4 border-b-4 border-black dark:border-white font-black text-white italic">IDENTIFIER</div>
            <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                    <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Neural ID..."
                        className="border-2 border-black dark:border-white font-black h-12"
                    />
                    <Button onClick={handleUpdateName} disabled={isUpdating} className="border-2 border-black dark:border-white bg-black text-white">
                        {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
                    </Button>
                </div>
                <div className="text-xs font-bold opacity-50 italic">Link: {session.user?.email}</div>
            </CardContent>
        </Card>

        {/* Security Control */}
        {!session.user?.image && (
            <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--purple)] dark:bg-zinc-900">
                <div className="bg-[var(--purple)] p-4 border-b-4 border-black dark:border-white font-black text-white italic flex justify-between items-center">
                    SECURITY
                    <Button onClick={requestOtp} disabled={isRequestingOtp} size="sm" className="bg-white text-black border-2 border-black font-black text-[10px]">
                        {isRequestingOtp ? "SENDING..." : "GET OTP"}
                    </Button>
                </div>
                <CardContent className="p-6 space-y-4">
                    <Input 
                        type="password" placeholder="CURRENT PASSWORD" 
                        value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        className="border-2 border-black dark:border-white font-bold"
                    />
                    <Input 
                        type="password" placeholder="NEW PASSWORD" 
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="border-2 border-black dark:border-white font-bold"
                    />
                    <div className="flex gap-2">
                        <Input 
                            placeholder="6-DIGIT OTP" 
                            value={otp} onChange={e => setOtp(e.target.value)}
                            className="border-2 border-black dark:border-white font-black text-center tracking-[10px]"
                        />
                        <Button onClick={handleChangePassword} disabled={isChangingPass} className="bg-black text-white border-2 border-black font-black">
                            {isChangingPass ? <Loader2 className="animate-spin" /> : "UPDATE"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Button onClick={() => signOut({ callbackUrl: "/" })} className="bg-red-500 text-white border-4 border-black h-16 font-black italic shadow-[6px_6px_0px_0px_#000]">
            <LogOut className="mr-2" /> TERMINATE SESSION
        </Button>
      </div>
    </div>
  );
}
