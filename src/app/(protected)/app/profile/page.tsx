"use client";

import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { 
    User, Mail, Shield, ShieldCheck, Key, 
    Smartphone, History, AlertTriangle, 
    ArrowRight, Loader2, LogOut, CheckCircle2,
    Calendar, Globe, Bell, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/components/LanguageProvider";

export default function ProfilePage() {
    const { data: session } = useSession();
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/user/password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldPassword, newPassword })
                });
                if (!res.ok) throw new Error("Failed to update password");
                toast.success("Password secured.");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } catch (e) {
                toast.error("Security breach. Could not update.");
            }
        });
    };

    if (!session) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 pt-10">
            {/* Page Header */}
            <div className="border-b-8 border-border pb-10">
                <div className="flex items-center gap-4 text-purple font-black uppercase tracking-[0.3em] text-sm mb-4">
                    <ShieldCheck className="w-6 h-6" />
                    Security Protocol Alpha
                </div>
                <h1 className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-foreground leading-none">
                    User <span className="text-primary drop-shadow-[6px_6px_0px_var(--shadow)]">Control</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Identity Card */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-4 border-border bg-background shadow-[12px_12px_0px_0px_var(--shadow)] overflow-hidden">
                        <div className="h-32 bg-primary border-b-4 border-border relative">
                            <div className="absolute -bottom-12 left-8 p-2 bg-background border-4 border-border shadow-[4px_4px_0px_0px_var(--shadow)]">
                                <User className="w-20 h-20 text-foreground" strokeWidth={3} />
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8 px-8 space-y-6 bg-background">
                            <div>
                                <h2 className="text-3xl font-black uppercase italic text-foreground tracking-tight">{session.user?.name}</h2>
                                <p className="text-foreground/50 font-bold uppercase text-[10px] tracking-widest mt-1">Verified Network Member</p>
                            </div>
                            
                            <div className="space-y-4 border-t-4 border-border/10 pt-6">
                                <div className="flex items-center gap-3 text-foreground/70">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-sm truncate">{session.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground/70">
                                    <Calendar className="w-5 h-5 text-purple" />
                                    <span className="font-bold text-sm uppercase">Active since 2026</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground/70">
                                    <Globe className="w-5 h-5 text-green" />
                                    <span className="font-bold text-sm uppercase">Region: Global-01</span>
                                </div>
                            </div>

                            <div className="bg-foreground/5 p-4 border-2 border-border/10 italic text-[10px] font-bold text-foreground/40 leading-relaxed uppercase">
                                Neural ID: {session.user?.id?.slice(0, 12)}...
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border-4 border-border bg-background shadow-[4px_4px_0px_0px_var(--blue)]">
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Alerts</p>
                            <p className="text-2xl font-black text-foreground">0</p>
                        </div>
                        <div className="p-4 border-4 border-border bg-background shadow-[4px_4px_0px_0px_var(--orange)]">
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Access</p>
                            <p className="text-2xl font-black text-foreground">L-5</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Password Section */}
                    <Card className="border-4 border-border bg-background shadow-[15px_15px_0px_0px_var(--shadow)] overflow-hidden">
                        <CardHeader className="bg-secondary-background border-b-4 border-border p-8">
                            <CardTitle className="text-3xl font-black uppercase italic flex items-center gap-4 text-foreground tracking-tighter">
                                <Lock className="w-8 h-8 text-primary" strokeWidth={3} />
                                Update Access Key
                            </CardTitle>
                            <CardDescription className="font-bold text-foreground/50 uppercase text-xs tracking-widest mt-2">Modify your authentication credentials</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 bg-background">
                            <form onSubmit={handlePasswordChange} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">{t.profile.current_pass}</Label>
                                        <Input 
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="h-14 border-4 border-border bg-secondary-background text-foreground font-bold text-lg focus-visible:ring-0 focus-visible:border-primary rounded-none shadow-[inner_4px_4px_0px_0px_rgba(0,0,0,0.05)]"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">{t.profile.new_pass}</Label>
                                        <Input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-14 border-4 border-border bg-secondary-background text-foreground font-bold text-lg focus-visible:ring-0 focus-visible:border-primary rounded-none shadow-[inner_4px_4px_0px_0px_rgba(0,0,0,0.05)]"
                                            placeholder="ENTER NEW PASSWORD"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">{t.profile.confirm_pass}</Label>
                                        <Input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-14 border-4 border-border bg-secondary-background text-foreground font-bold text-lg focus-visible:ring-0 focus-visible:border-primary rounded-none shadow-[inner_4px_4px_0px_0px_rgba(0,0,0,0.05)]"
                                            placeholder="REPEAT TO CONFIRM"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    disabled={isPending}
                                    className="h-16 px-10 bg-primary text-white border-4 border-border shadow-[6px_6px_0px_0px_var(--shadow)] font-black uppercase italic text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none w-full md:w-auto"
                                >
                                    {isPending ? <Loader2 className="animate-spin w-6 h-6 mr-3" /> : <Key className="w-6 h-6 mr-3" />}
                                    Commit Security Update
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Hint Box */}
                    <div className="p-6 border-4 border-border bg-accent/20 italic text-sm font-bold text-foreground/60 flex gap-4">
                        <AlertTriangle className="w-10 h-10 text-primary shrink-0" />
                        <p>Note: Passwords must be at least 8 characters long. Your session will remain active after password update unless you sign out manually.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
