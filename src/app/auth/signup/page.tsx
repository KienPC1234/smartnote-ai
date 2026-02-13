"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/components/LanguageProvider";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    otp: ""
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    if (!isOtpStep && formData.password !== formData.confirmPassword) {
        toast.error("Password mismatch");
        setIsLoading(false);
        return;
    }

    try {
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: formData.email, 
                password: formData.password,
                otp: isOtpStep ? formData.otp : undefined
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            if (data.otpSent) {
                setIsOtpStep(true);
                toast.success("Verification code sent to your email!");
            } else {
                toast.success("Account created! Logging in...");
                const result = await signIn("credentials", { 
                    email: formData.email, 
                    password: formData.password, 
                    redirect: false 
                });
                if (result?.error) {
                    toast.error("Login failed, please sign in manually.");
                    router.push("/auth/signin");
                } else {
                    router.push("/app");
                    router.refresh();
                }
            }
        } else {
            toast.error(data.error || "Signup failed");
        }
    } catch (e) {
        toast.error("System Error");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
        
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
            SmartNote<span className="text-primary">.AI</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-4 border-border shadow-[12px_12px_0px_0px_var(--shadow)] relative overflow-visible bg-background z-10">
        <div className="absolute -top-6 -left-6 bg-secondary border-4 border-border px-6 py-2 font-black transform -rotate-2 z-10 text-white shadow-[4px_4px_0px_0px_var(--shadow)]">
            {isOtpStep ? "VERIFICATION" : "NEW ACCOUNT"}
        </div>
        
        <CardHeader>
            <CardTitle className="text-4xl font-black text-center uppercase mt-6 text-foreground italic tracking-tighter">
                {isOtpStep ? "Verify Email" : "Join Network"}
            </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-4">
            {!isOtpStep && (
                <>
                    <button
                        disabled={isLoading}
                        onClick={() => signIn("google", { redirectTo: "/app" })}
                        className="w-full flex items-center justify-center py-5 px-4 bg-background text-foreground border-4 border-border font-black text-xl gap-4 shadow-[6px_6px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
                    >
                        <span>🇬 Sign up with Google</span>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-4 border-border/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-background px-6 text-foreground font-black border-4 border-border transform rotate-2 italic uppercase">Secure Entry</span>
                        </div>
                    </div>
                </>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                {!isOtpStep ? (
                    <>
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase text-foreground tracking-widest">Email Address</label>
                            <Input
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                type="email"
                                required
                                placeholder="USER@EXAMPLE.COM"
                                className="h-14 border-4 border-border font-bold text-lg bg-background text-foreground focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase text-foreground tracking-widest">Password</label>
                            <Input
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                type="password"
                                required
                                placeholder="••••••••"
                                className="h-14 border-4 border-border font-bold text-lg bg-background text-foreground focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase text-foreground tracking-widest">Confirm Password</label>
                            <Input
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                type="password"
                                required
                                placeholder="••••••••"
                                className="h-14 border-4 border-border font-bold text-lg bg-background text-foreground focus-visible:ring-primary"
                            />
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-blue/10 border-4 border-blue/30 text-blue font-bold italic text-center">
                            We've sent a 6-digit code to <br/>
                            <span className="text-foreground not-italic font-black">{formData.email}</span>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase text-foreground tracking-widest text-center">Enter Access Code</label>
                            <Input
                                value={formData.otp}
                                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                                required
                                maxLength={6}
                                placeholder="000000"
                                className="h-20 border-4 border-border font-black text-4xl text-center bg-background text-foreground tracking-[0.5em] focus-visible:ring-primary"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsOtpStep(false)}
                            className="w-full text-sm font-black uppercase text-foreground/50 hover:text-primary transition-colors"
                        >
                            ← Back to information
                        </button>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="default"
                    disabled={isLoading}
                    className="w-full py-8 text-2xl font-black uppercase border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-primary text-white hover:bg-primary transition-all active:shadow-none"
                >
                    {isLoading ? "PROCESSSING..." : (isOtpStep ? "VERIFY & JOIN" : "REQUEST ACCESS")}
                </Button>
            </form>

            <p className="text-center font-black text-sm text-foreground/60 mt-6 uppercase tracking-widest">
                {t.auth.has_account} <Link href="/auth/signin" className="text-primary underline underline-offset-4 decoration-4">{t.auth.login_link}</Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
