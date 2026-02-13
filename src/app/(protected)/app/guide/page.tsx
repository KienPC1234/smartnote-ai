'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, MessageSquare, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function GuidePage() {
  const { t } = useTranslation();

  const stepIcons = [BookOpen, Sparkles, Brain, MessageSquare];
  // Sử dụng màu sắc rõ ràng hơn thay vì chỉ dùng CSS variables để đảm bảo hiển thị
  const stepColors = ["bg-sky-400", "bg-indigo-500", "bg-emerald-400", "bg-purple-500"];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 relative px-4 pt-10">
      {/* Background Grid Nhạt */}
      <div className="fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <Link href="/app">
          <Button variant="outline" size="sm" className="font-black border-[3px] border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <ArrowLeft className="mr-2 w-4 h-4" /> {t.guide.back_btn}
          </Button>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground drop-shadow-[4px_4px_0px_var(--primary)]">
          {t.guide.title}
        </h1>
      </div>

      <div className="grid gap-8 relative z-10">
        {t.guide.steps.map((step: { title: string; desc: string }, i: number) => {
          const Icon = stepIcons[i];
          return (
            <Card key={i} className="group border-[4px] border-foreground shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all bg-background overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-6 p-6 md:p-8 border-b-[4px] border-foreground/5">
                <div className={`p-4 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] group-hover:rotate-12 transition-transform ${stepColors[i]}`}>
                  <Icon className="w-8 h-8 text-white dark:text-black" strokeWidth={3} />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black uppercase text-foreground italic tracking-tighter">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <p className="font-bold text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-4">
                  {step.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-[4px] border-foreground p-8 md:p-12 bg-foreground text-background shadow-[15px_15px_0px_0px_var(--primary)] relative z-10 overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
          <Zap className="w-32 h-32 fill-current" />
        </div>
        <div className="flex flex-col items-center text-center space-y-8 relative z-10">
            <Zap className="w-16 h-16 text-yellow-400 fill-current animate-pulse" />
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">{t.guide.ready_title}</h2>
              <p className="max-w-lg font-bold text-lg opacity-80 italic">{t.guide.ready_desc}</p>
            </div>
            <Link href="/app/new">
                <Button size="lg" className="h-20 px-12 text-2xl font-black bg-primary text-white border-[3px] border-background shadow-[8px_8px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase italic">
                    {t.guide.cta_btn}
                </Button>
            </Link>
        </div>
      </Card>
    </div>
  );
}