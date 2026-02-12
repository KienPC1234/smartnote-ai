import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, BookOpen, Zap, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden relative grid-background">
      <Navbar />
      
      {/* Marquee - Thinner & Cleaner */}
      <div className="border-b-2 border-black dark:border-white bg-[var(--purple)] text-white overflow-hidden py-1.5 select-none relative z-10">
        <div className="animate-marquee font-bold text-sm uppercase tracking-[0.2em]">
           AI Powered • Smart Flashcards • Instant Outlines • Adaptive Quizzes • Study Smarter • AI Powered • Smart Flashcards • Instant Outlines • Adaptive Quizzes • Study Smarter • 
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 w-full max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-black dark:border-white bg-[var(--accent)] text-black font-black text-xs uppercase tracking-widest animate-bounce">
                <Sparkles className="w-4 h-4" />
                Next-Gen Study Tool
            </div>

            <div className="relative">
                <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter leading-[0.8] mb-4 select-none">
                    <span className="text-foreground">BRAIN</span> <br/>
                    <span className="text-[var(--primary)] drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:drop-shadow-[8px_8px_0px_rgba(255,255,255,0.3)]">DUMP.</span> 
                </h1>
                <p className="max-w-xl mx-auto text-xl md:text-2xl font-bold text-zinc-600 dark:text-zinc-400 leading-tight pt-6">
                    Stop wasting time formatting. Paste your messy notes and get <span className="text-foreground dark:text-white underline decoration-[var(--secondary)] decoration-4">structured knowledge</span> instantly.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <Link href="/auth/signup">
                    <Button size="lg" className="h-20 px-12 text-2xl font-black border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all active:translate-x-[2px] active:translate-y-[2px]">
                        GET STARTED FOR FREE
                        <ArrowRight className="ml-2 w-8 h-8" />
                    </Button>
                </Link>
            </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 w-full max-w-6xl mx-auto pb-40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                
                {/* Outline Card */}
                <Card className="group bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[10px_10px_0px_0px_var(--accent)] transition-all duration-500 hover:rotate-2 hover:shadow-[15px_15px_0px_0px_var(--accent)]">
                    <CardHeader className="pt-10">
                        <div className="h-16 w-16 bg-[var(--accent)] border-2 border-black dark:border-white rounded-2xl mb-6 flex items-center justify-center text-black shadow-[4px_4px_0px_0px_#000] group-hover:-rotate-12 transition-transform">
                            <BookOpen className="w-8 h-8" strokeWidth={3} />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter dark:text-white">Smart Outline</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-10">
                        <p className="font-bold text-lg text-zinc-700 dark:text-zinc-400 leading-snug">
                            Turn chaos into clean, markdown-formatted summaries with automated hierarchy.
                        </p>
                    </CardContent>
                </Card>

                {/* Flashcards Card */}
                <Card className="group bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[10px_10px_0px_0px_var(--secondary)] transition-all duration-500 hover:-rotate-2 hover:shadow-[15px_15px_0px_0px_var(--secondary)]">
                    <CardHeader className="pt-10">
                        <div className="h-16 w-16 bg-[var(--secondary)] border-2 border-black dark:border-white rounded-2xl mb-6 flex items-center justify-center text-black shadow-[4px_4px_0px_0px_#000] group-hover:rotate-12 transition-transform">
                            <Zap className="w-8 h-8 stroke-black fill-black" strokeWidth={3} />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter dark:text-white">Active Recall</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-10">
                        <p className="font-bold text-lg text-zinc-700 dark:text-zinc-400 leading-snug">
                            Test your memory with AI-generated flip cards designed for rapid retention.
                        </p>
                    </CardContent>
                </Card>

                {/* Quiz Card */}
                <Card className="group bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[10px_10px_0px_0px_var(--primary)] transition-all duration-500 hover:rotate-1 hover:shadow-[15px_15px_0px_0px_var(--primary)]">
                    <CardHeader className="pt-10">
                        <div className="h-16 w-16 bg-[var(--primary)] border-2 border-black dark:border-white rounded-2xl mb-6 flex items-center justify-center text-white shadow-[4px_4px_0px_0px_#000] group-hover:-scale-110 transition-transform">
                            <BrainCircuit className="w-8 h-8" strokeWidth={3} />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter dark:text-white">Quiz Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-10">
                        <p className="font-bold text-lg text-zinc-700 dark:text-zinc-400 leading-snug">
                            Adaptive multiple choice questions to identify and bridge your knowledge gaps.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>

      </main>
      
      <footer className="border-t-2 border-black dark:border-white p-12 text-center font-bold bg-background text-foreground text-xs tracking-[0.3em] uppercase relative z-10">
        <div className="flex justify-center gap-8 mb-4 opacity-50">
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Contact</Link>
        </div>
        © {new Date().getFullYear()} SmartNote AI • Zero to Knowledge in Seconds
      </footer>
    </div>
  );
}
