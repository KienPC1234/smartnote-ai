"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/components/LanguageProvider";

export default function SignInPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
        
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
            SmartNote<span className="text-[var(--primary)]">.AI</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-visible bg-background z-10">
        <div className="absolute -top-4 -left-4 bg-[var(--accent)] border-2 border-black dark:border-white px-4 py-1 font-black transform -rotate-2 z-10 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {t.auth.login_required}
        </div>
        
        <CardHeader>
            <CardTitle className="text-3xl font-black text-center uppercase mt-4 text-foreground">{t.auth.access_portal}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
            <button
                onClick={() => signIn("google", { redirectTo: "/app" })}
                className="w-full flex items-center justify-center py-4 px-4 bg-background text-foreground border-2 border-black dark:border-white font-black text-lg gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
                <span>🇬 {t.auth.google_login}</span>
            </button>

            <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-black dark:border-white" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-foreground font-black border-2 border-black dark:border-white transform rotate-2">{t.auth.or}</span>
            </div>
            </div>

            <form
                className="space-y-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await signIn("credentials", {
                        email: formData.get("email"),
                        password: formData.get("password"),
                        redirectTo: "/app"
                    });
                }}
            >
                <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-foreground">{t.auth.email_label}</label>
                <Input
                    name="email"
                    type="email"
                    required
                    placeholder={t.auth.email_placeholder}
                    className="h-12 border-2 border-black dark:border-white font-bold bg-background text-foreground"
                />
                </div>
                <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-foreground">{t.auth.pass_label}</label>
                <Input
                    name="password"
                    type="password"
                    required
                    placeholder={t.auth.pass_placeholder}
                    className="h-12 border-2 border-black dark:border-white font-bold bg-background text-foreground"
                />
                </div>
                <Button
                    type="submit"
                    variant="default"
                    className="w-full py-6 text-xl font-black uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                    {t.auth.login_btn}
                </Button>
            </form>

            <p className="text-center font-bold text-sm text-foreground mt-4">
                {t.auth.no_account} <Link href="/auth/signup" className="text-[var(--secondary)] underline underline-offset-4">{t.auth.signup_link}</Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
