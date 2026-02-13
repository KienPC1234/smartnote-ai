"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, MessageSquare, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function GuidePage() {
  const { t } = useTranslation();

  const stepIcons = [BookOpen, Sparkles, Brain, MessageSquare];
  const stepColors = ["var(--accent)", "var(--primary)", "var(--secondary)", "var(--purple)"];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white text-foreground">
            <ArrowLeft className="mr-2 w-4 h-4" /> {t.guide.back_btn}
          </Button>
        </Link>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">{t.guide.title}</h1>
      </div>

        {t.guide.steps.map((step: { title: string; desc: string }, i: number) => {
          const Icon = stepIcons[i];
          return (
            <Card key={i} className="border-8 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:rotate-1 transition-transform bg-background">
              <CardHeader className="flex flex-row items-center gap-6 p-8">
                <div className="p-4 border-4 border-black dark:border-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: stepColors[i] }}>
                  <Icon className="w-8 h-8 text-black" strokeWidth={3} />
                </div>
                <CardTitle className="text-3xl font-black uppercase text-foreground italic tracking-tighter">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <p className="font-black text-lg text-zinc-600 dark:text-zinc-400 leading-snug italic underline decoration-2 decoration-black/5 dark:decoration-white/5">{step.desc}</p>
              </CardContent>
            </Card>
          );
        })}

      <Card className="border-4 border-black dark:border-white p-10 bg-foreground text-background dark:bg-foreground dark:text-background shadow-[12px_12px_0px_0px_var(--primary)] relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
            <Zap className="w-12 h-12 text-[var(--accent)] fill-current animate-pulse" />
            <h2 className="text-4xl font-black uppercase italic">{t.guide.ready_title}</h2>
            <p className="max-w-lg font-bold opacity-80">{t.guide.ready_desc}</p>
            <Link href="/app/new">
                <Button size="lg" className="h-16 px-12 text-2xl font-black bg-[var(--primary)] text-white border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_var(--accent)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                    {t.guide.cta_btn}
                </Button>
            </Link>
        </div>
      </Card>
    </div>
  );
}
