"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, BookOpen, Zap, BrainCircuit, Play } from "lucide-react";
import { useTranslation } from "@/components/LanguageProvider";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Background Grid - Removed local div since it is global */}

      <Navbar />
      
      {/* Marquee - Thinner & Cleaner */}
      <div className="border-b-4 border-black dark:border-white bg-[var(--purple)] text-white overflow-hidden py-2 select-none relative z-10">
        <div className="animate-marquee font-black text-sm uppercase tracking-[0.3em] italic">
           {t.landing.marquee}
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 w-full max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 border-4 border-black dark:border-white bg-[var(--accent)] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <Sparkles className="w-5 h-5" />
                {t.landing.hero_badge}
            </div>

            <div className="relative">
                <h1 className="text-8xl md:text-[14rem] font-black tracking-tighter leading-[0.75] mb-6 select-none uppercase italic">
                    <span className="text-foreground drop-shadow-[10px_10px_0px_rgba(0,0,0,0.1)]">{t.landing.hero_title_1}</span> <br/>
                    <span className="text-[var(--primary)] drop-shadow-[12px_12px_0px_rgba(0,0,0,1)] dark:drop-shadow-[12px_12px_0px_rgba(255,255,255,0.2)]">
                        {t.landing.hero_title_2}
                    </span> 
                </h1>
                <p className="max-w-2xl mx-auto text-2xl md:text-3xl font-black text-zinc-600 dark:text-zinc-400 leading-none pt-8 uppercase italic tracking-tighter">
                    {t.landing.hero_desc.split('{structured}')[0]}
                    <span className="text-foreground dark:text-white underline decoration-[var(--secondary)] decoration-8 underline-offset-4">
                        {t.landing.hero_desc_highlight}
                    </span>
                    {t.landing.hero_desc.split('{structured}')[1]}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 pt-10">
                <Link href="/auth/signup">
                    <Button size="lg" className="h-24 px-16 text-3xl font-black border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-6px] hover:translate-y-[-6px] transition-all active:translate-x-[4px] active:translate-y-[4px] bg-[var(--primary)] text-white hover:bg-[var(--primary)]">
                        {t.landing.hero_cta}
                        <ArrowRight className="ml-3 w-10 h-10" strokeWidth={4} />
                    </Button>
                </Link>
                <Link href="/demo_video">
                    <Button variant="neutral" size="lg" className="h-24 px-16 text-2xl font-black border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-6px] hover:translate-y-[-6px] transition-all bg-background text-foreground">
                        <Play className="mr-3 w-8 h-8 fill-current" />
                        {t.landing.demo_video}
                    </Button>
                </Link>
            </div>
        </section>

        {/* Video Embed Section */}
        <section className="py-32 px-4 w-full max-w-6xl mx-auto relative z-10">
            <div className="border-[12px] border-black dark:border-white shadow-[30px_30px_0px_0px_var(--primary)] bg-background overflow-hidden relative group hover:translate-x-[-10px] hover:translate-y-[-10px] transition-all duration-500">
                <div className="aspect-video w-full">
                    <iframe 
                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                        src={`https://www.youtube.com/embed/${process.env.NEXT_PUBLIC_YOUTUBE_ID || 'dQw4w9WgXcQ'}`}
                        title="SmartNote AI Demo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 w-full max-w-7xl mx-auto pb-60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Outline Card */}
                <Card className="group bg-background border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_var(--accent)] transition-all duration-500 hover:rotate-3 hover:shadow-[25px_25px_0px_0px_var(--accent)]">
                    <CardHeader className="pt-12 px-10">
                        <div className="h-20 w-20 bg-[var(--accent)] border-4 border-black dark:border-white rounded-2xl mb-8 flex items-center justify-center text-black shadow-[6px_6px_0px_0px_#000] group-hover:-rotate-12 transition-transform">
                            <BookOpen className="w-10 h-10" strokeWidth={4} />
                        </div>
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter text-foreground italic leading-none">{t.landing.feature_outline_title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-12 px-10">
                        <p className="font-black text-xl text-zinc-700 dark:text-zinc-400 leading-tight">
                            {t.landing.feature_outline_desc}
                        </p>
                    </CardContent>
                </Card>

                {/* Flashcards Card */}
                <Card className="group bg-background border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_var(--secondary)] transition-all duration-500 hover:-rotate-3 hover:shadow-[25px_25px_0px_0px_var(--secondary)]">
                    <CardHeader className="pt-12 px-10">
                        <div className="h-20 w-20 bg-[var(--secondary)] border-4 border-black dark:border-white rounded-2xl mb-8 flex items-center justify-center text-black shadow-[6px_6px_0px_0px_#000] group-hover:rotate-12 transition-transform">
                            <Zap className="w-10 h-10 stroke-black fill-black" strokeWidth={4} />
                        </div>
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter text-foreground italic leading-none">{t.landing.feature_cards_title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-12 px-10">
                        <p className="font-black text-xl text-zinc-700 dark:text-zinc-400 leading-tight">
                            {t.landing.feature_cards_desc}
                        </p>
                    </CardContent>
                </Card>

                {/* Quiz Card */}
                <Card className="group bg-background border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_var(--primary)] transition-all duration-500 hover:rotate-2 hover:shadow-[25px_25px_0px_0px_var(--primary)]">
                    <CardHeader className="pt-12 px-10">
                        <div className="h-20 w-20 bg-[var(--primary)] border-4 border-black dark:border-white rounded-2xl mb-8 flex items-center justify-center text-white shadow-[6px_6px_0px_0px_#000] group-hover:-scale-110 transition-transform">
                            <BrainCircuit className="w-10 h-10" strokeWidth={4} />
                        </div>
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter text-foreground italic leading-none">{t.landing.feature_quiz_title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-12 px-10">
                        <p className="font-black text-xl text-zinc-700 dark:text-zinc-400 leading-tight">
                            {t.landing.feature_quiz_desc}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>

      </main>
      
      <footer className="border-t-4 border-black dark:border-white p-16 text-center font-black bg-background text-foreground text-xs tracking-[0.4em] uppercase relative z-10">
        <div className="flex justify-center gap-12 mb-8 opacity-60">
            <Link href="#" className="hover:text-[var(--primary)] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[var(--primary)] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[var(--primary)] transition-colors">Contact</Link>
        </div>
        © {new Date().getFullYear()} SmartNote AI • {t.landing.footer_copy}
      </footer>
    </div>
  );
}
