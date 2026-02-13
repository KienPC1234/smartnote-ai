"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Rotate3d, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "./LanguageProvider";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: number;
}

export default function FlashcardsView({ data, isGenerating }: { data: { flashcards: Flashcard[] }, isGenerating?: boolean }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // Ensure cards is always an array
  const cards = Array.isArray(data?.flashcards) ? data.flashcards : [];

  // Reset index if it goes out of bounds (e.g. after re-generation)
  useEffect(() => {
    if (index >= cards.length && cards.length > 0) {
        setIndex(0);
    }
  }, [cards.length, index]);

  if (cards.length === 0 && !isGenerating) return null;

  const current = cards[index];

  function next() {
    setFlipped(false);
    setTimeout(() => {
        setIndex((i) => (i + 1) % cards.length);
    }, 150);
  }

  function prev() {
    setFlipped(false);
    setTimeout(() => {
        setIndex((i) => (i - 1 + cards.length) % cards.length);
    }, 150);   
  }

  const isGeneratingPlaceholder = isGenerating && cards.length === 0;

  return (
    <div className="flex flex-col items-center space-y-12 py-10 w-full max-w-3xl mx-auto">
      {/* 3D Card Container */}
      <div 
        className="w-full h-96 [perspective:1000px] cursor-pointer" 
        onClick={() => !isGeneratingPlaceholder && setFlipped(!flipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRONT SIDE */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-[var(--secondary)] border-8 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] dark:shadow-[15px_15px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="bg-black text-white p-2 border-2 border-white">
                    <Brain className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-[0.2em] text-black italic bg-white/30 px-2 py-0.5">{t.note.flashcards_content.front_label} {index + 1}/{isGenerating && cards.length === 0 ? "?" : cards.length}</span>
            </div>
            
            {isGeneratingPlaceholder ? (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-8 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-2xl font-black uppercase italic animate-pulse text-black">{t.note.flashcards_content.synthesizing}...</h3>
                </div>
            ) : (
                <h3 className="text-3xl md:text-5xl font-black leading-tight text-black uppercase italic tracking-tighter">
                    {current?.front}
                </h3>
            )}
            
            {!isGeneratingPlaceholder && (
                <div className="absolute bottom-8 flex items-center gap-3 text-xs font-black uppercase text-black/60 bg-black/5 px-4 py-2 border-2 border-black/10 rounded-full animate-bounce">
                    <Rotate3d className="w-5 h-5" /> {t.note.flashcards_content.revealer}
                </div>
            )}
          </div>

          {/* BACK SIDE */}
          {!isGeneratingPlaceholder && current && (
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[var(--accent)] border-8 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] text-black">
               <div className="absolute top-6 left-6 font-black text-xs uppercase tracking-[0.4em] italic text-black bg-black/10 px-2 py-0.5">{t.note.flashcards_content.back_label}</div>
               <p className="text-2xl md:text-4xl font-black leading-relaxed text-black italic tracking-tight">
                  {current?.back}
               </p>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-12">
        <Button 
            disabled={cards.length <= 1}
            onClick={(e) => { e.stopPropagation(); prev(); }} 
            className="h-20 w-20 rounded-none border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] bg-background text-foreground transition-all"
        >
          <ChevronLeft className="w-10 h-10 text-foreground" strokeWidth={4} />
        </Button>

        <div className="flex gap-4">
            {[...Array(Math.min(cards.length, 5))].map((_, i) => (
                <div key={i} className={`h-4 w-4 border-4 border-black dark:border-white transition-all ${i === index % 5 ? 'bg-[var(--primary)] w-12' : 'bg-transparent'}`} />
            ))}
        </div>

        <Button 
            disabled={cards.length <= 1 || (isGenerating && index === cards.length)}
            onClick={(e) => { e.stopPropagation(); next(); }} 
            className="h-20 w-20 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] bg-[var(--primary)] text-white disabled:opacity-50 transition-all"
        >
          <ChevronRight className="w-10 h-10 text-white" strokeWidth={4} />
        </Button>
      </div>
    </div>
  );
}
