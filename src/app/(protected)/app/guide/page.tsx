"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, MessageSquare, ArrowLeft, BookOpen, MousePointer2 } from "lucide-react";
import Link from "next/link";

export default function GuidePage() {
  const steps = [
    {
      title: "1. Raw Data Input",
      desc: "Paste your messy meeting notes, lecture transcripts, or scattered thoughts. Don't worry about formatting.",
      icon: BookOpen,
      color: "var(--accent)"
    },
    {
      title: "2. Neural Processing",
      desc: "Our AI core analyzes the text to identify hierarchies, definitions, and key concepts in seconds.",
      icon: Sparkles,
      color: "var(--primary)"
    },
    {
      title: "3. Learning Arsenal",
      desc: "Get an instant Outline, 20+ Flashcards for active recall, and dynamic Quizzes to test yourself.",
      icon: Brain,
      color: "var(--secondary)"
    },
    {
      title: "4. Neural Assistant",
      desc: "Use the floating Chatbot to query across all your notes. It supports LaTeX for math and Markdown for code.",
      icon: MessageSquare,
      color: "var(--purple)"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white">
            <ArrowLeft className="mr-2 w-4 h-4" /> DASHBOARD
          </Button>
        </Link>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">Protocol Guide</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] hover:rotate-1 transition-transform">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 border-2 border-black dark:border-white rounded-xl shadow-[3px_3px_0px_0px_#000]" style={{ backgroundColor: step.color }}>
                  <Icon className="w-6 h-6 text-black" />
                </div>
                <CardTitle className="text-2xl font-black uppercase">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-4 border-black dark:border-white p-10 bg-black text-white dark:bg-white dark:text-black shadow-[12px_12px_0px_0px_var(--primary)] relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
            <Zap className="w-12 h-12 text-[var(--accent)] fill-current animate-pulse" />
            <h2 className="text-4xl font-black uppercase italic">Ready to accelerate?</h2>
            <p className="max-w-lg font-bold opacity-80">SmartNote AI is designed for high-speed knowledge acquisition. Stop reading, start mastering.</p>
            <Link href="/app/new">
                <Button size="lg" className="h-16 px-12 text-2xl font-black bg-[var(--primary)] text-white border-2 border-black shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                    INITIALIZE FIRST NODE
                </Button>
            </Link>
        </div>
      </Card>
    </div>
  );
}
