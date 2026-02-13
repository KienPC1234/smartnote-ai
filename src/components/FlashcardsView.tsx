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
          <div className="absolute inset-0 [backface-visibility:hidden] bg-background border-4 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="bg-[var(--secondary)] p-1 border-2 border-black">
                    <Brain className="w-4 h-4 text-black" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest opacity-40 text-foreground">{t.note.flashcards_content.front_label} {index + 1}/{isGenerating && cards.length === 0 ? "?" : cards.length}</span>
            </div>
            
            {isGeneratingPlaceholder ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-xl font-black uppercase italic animate-pulse text-foreground">{t.note.flashcards_content.synthesizing}...</h3>
                </div>
            ) : (
                <h3 className="text-2xl md:text-4xl font-black leading-tight text-foreground uppercase italic">
                    {current?.front}
                </h3>
            )}
            
            {!isGeneratingPlaceholder && (
                <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 group-hover:text-foreground transition-colors">
                    <Rotate3d className="w-4 h-4 animate-spin-slow" /> {t.note.flashcards_content.revealer}
                </div>
            )}
          </div>

          {/* BACK SIDE */}
          {!isGeneratingPlaceholder && current && (
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[var(--accent)] border-4 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black">
               <div className="absolute top-6 left-6 font-black text-[10px] uppercase tracking-[0.3em] opacity-60 italic text-black">{t.note.flashcards_content.back_label}</div>
               <p className="text-xl md:text-3xl font-black leading-relaxed text-black italic">
                  {current?.back}
               </p>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-8">
        <Button 
            disabled={cards.length <= 1}
            onClick={(e) => { e.stopPropagation(); prev(); }} 
            className="h-16 w-16 rounded-full border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-background text-foreground"
        >
          <ChevronLeft className="w-8 h-8 text-foreground" strokeWidth={3} />
        </Button>

        <div className="flex gap-2">
            {[...Array(Math.min(cards.length, 5))].map((_, i) => (
                <div key={i} className={`h-3 w-3 border-2 border-black dark:border-white rounded-full transition-all ${i === index % 5 ? 'bg-foreground w-8' : 'bg-transparent'}`} />
            ))}
        </div>

        <Button 
            disabled={cards.length <= 1 || (isGenerating && index === cards.length)}
            onClick={(e) => { e.stopPropagation(); next(); }} 
            className="h-16 w-16 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-[var(--primary)] text-white disabled:opacity-50"
        >
          <ChevronRight className="w-8 h-8 text-white" strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
}
