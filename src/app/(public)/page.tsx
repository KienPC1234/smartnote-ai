'use client';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, BookOpen, Zap, BrainCircuit, Play, Mail, Heart } from "lucide-react";
import { useTranslation } from "@/components/LanguageProvider";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary selection:text-white">
      
      {/* 1. BACKGROUND Ô LI - NHẠT & CHUYỂN MÀU THEO THEME */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`, 
          backgroundSize: '40px 40px',
          color: 'var(--border)'
        }}
      />

      <Navbar />
      
      {/* 2. MARQUEE - CHẬM & THANH LỊCH (Tốc độ 40s) */}
      <div className="border-y-[3px] border-foreground bg-indigo-600 dark:bg-indigo-500 text-white overflow-hidden py-3 select-none relative z-20 shadow-[0_4px_0_0_rgba(0,0,0,1)] dark:shadow-[0_4px_0_0_rgba(255,255,255,0.1)]">
        <div className="animate-marquee-slow font-black text-sm uppercase tracking-[0.3em] italic whitespace-nowrap">
           {t.landing.marquee} &nbsp; • &nbsp; {t.landing.marquee} &nbsp; • &nbsp; {t.landing.marquee} &nbsp; • &nbsp; {t.landing.marquee}
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative z-10 w-full">
        
        {/* 3. HERO SECTION - FIX TRÀN CHỮ & KÉO AI LÊN DÒNG */}
        <section className="pt-20 pb-16 px-6 w-full max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Badge - Chữ đen trên nền vàng (Luôn dễ đọc ở cả 2 theme) */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border-[3px] border-foreground bg-yellow-400 text-black font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] mb-10 transform -rotate-1">
                <Sparkles className="w-4 h-4 fill-current" />
                {t.landing.hero_badge}
            </div>

            <div className="w-full">
                {/* Dùng break-words và điều chỉnh size chữ để không tràn màn hình */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 uppercase italic break-words">
                    <span className="text-foreground">{t.landing.hero_title_1}</span> 
                    <span className="inline-block md:ml-4 text-white bg-indigo-600 dark:bg-indigo-500 px-4 py-1 border-[4px] border-foreground shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.2)] transform rotate-1">
                      {t.landing.hero_title_2}
                    </span> 
                </h1>
                
                <p className="max-w-2xl mx-auto text-base md:text-xl font-bold text-muted-foreground leading-relaxed pt-4 uppercase italic">
                    {t.landing.hero_desc.split('{structured}')[0]}
                    <span className="text-foreground bg-yellow-200 dark:bg-yellow-500/30 px-2 border-b-4 border-yellow-400">
                        {t.landing.hero_desc_highlight}
                    </span>
                    {t.landing.hero_desc.split('{structured}')[1]}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-12 w-full justify-center items-center">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-64 h-16 text-xl font-black border-[3px] border-foreground shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all bg-indigo-600 text-white uppercase italic">
                        {t.landing.hero_cta}
                        <ArrowRight className="ml-2 w-6 h-6" strokeWidth={4} />
                    </Button>
                </Link>
                <Link href="/demo_video" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-64 h-16 text-xl font-black border-[3px] border-foreground shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all bg-background text-foreground uppercase italic">
                        <Play className="mr-2 w-5 h-5 fill-current" />
                        {t.landing.demo_video}
                    </Button>
                </Link>
            </div>
        </section>

        {/* 4. VIDEO SECTION */}
        <section className="py-16 px-6 w-full max-w-4xl mx-auto">
            <div className="border-[4px] border-foreground shadow-[12px_12px_0_0_var(--primary)] bg-background overflow-hidden transform rotate-1 transition-transform hover:rotate-0 duration-500">
                <div className="h-8 border-b-[4px] border-foreground bg-muted flex items-center px-4 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-foreground" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-foreground" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-foreground" />
                </div>
                <div className="aspect-video w-full bg-black">
                    <iframe 
                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                        src={`https://www.youtube.com/embed/${process.env.NEXT_PUBLIC_YOUTUBE_ID || 'dQw4w9WgXcQ'}`}
                        title="SmartNote AI Demo"
                        frameBorder="0"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </section>

        {/* 5. FEATURES GRID */}
        <section className="py-24 px-6 w-full border-t-[4px] border-foreground bg-muted/30">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<BookOpen className="w-8 h-8" strokeWidth={3} />} 
                  color="bg-sky-400 dark:bg-sky-500" 
                  title={t.landing.feature_outline_title}
                  desc={t.landing.feature_outline_desc}
                />
                <FeatureCard 
                  icon={<Zap className="w-8 h-8 fill-current" strokeWidth={3} />} 
                  color="bg-emerald-400 dark:bg-emerald-500" 
                  title={t.landing.feature_cards_title}
                  desc={t.landing.feature_cards_desc}
                />
                <FeatureCard 
                  icon={<BrainCircuit className="w-8 h-8" strokeWidth={3} />} 
                  color="bg-rose-400 dark:bg-rose-500" 
                  title={t.landing.feature_quiz_title}
                  desc={t.landing.feature_quiz_desc}
                />
            </div>
        </section>
      </main>
      
      {/* 6. FOOTER - TINH CHỈNH GỌN GÀNG */}
      <footer className="border-t-[4px] border-foreground py-16 px-6 bg-background relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-4">
                <Link href="/" className="text-3xl font-black italic tracking-tighter hover:text-primary transition-colors">
                    SMARTNOTE<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
                </Link>
                <p className="font-bold text-sm text-muted-foreground max-w-xs uppercase italic leading-relaxed">
                    The next-gen neural platform for high-speed knowledge acquisition.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-50 pt-4">
                   Made with <Heart className="w-3 h-3 text-rose-500 fill-current animate-pulse" /> in Vietnam
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:gap-20 gap-10">
                <div className="space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Support</h4>
                    <ul className="space-y-2 font-black text-xs uppercase italic">
                        <li><a href="mailto:admin@fptoj.com" className="hover:text-primary transition-colors">Contact Us</a></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Terms</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Community</h4>
                    <ul className="space-y-2 font-black text-xs uppercase italic">
                        <li><a href="#" className="hover:text-primary transition-colors">Twitter / X</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Github</a></li>
                    </ul>
                </div>
            </div>
        </div>
      </footer>

      {/* Tailwind Custom Animation (Đảm bảo có trong global CSS) */}
      <style jsx global>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          display: inline-block;
          animation: marquee-slow 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <Card className="bg-background border-[3px] border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 group">
        <CardHeader className="pt-8 px-6">
            <div className={`h-14 w-14 ${color} border-[3px] border-foreground rounded-lg mb-4 flex items-center justify-center text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.1)] group-hover:rotate-6 transition-transform`}>
                {icon}
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground italic">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-8 px-6">
            <p className="font-bold text-muted-foreground leading-snug italic text-sm md:text-base">
                {desc}
            </p>
        </CardContent>
    </Card>
  );
}