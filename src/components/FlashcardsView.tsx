"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Rotate3d, Brain } from "lucide-react";
import { Button } from "./ui/button";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: number;
}

export default function FlashcardsView({ data }: { data: { flashcards: Flashcard[] } }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = data.flashcards || [];

  if (cards.length === 0) return null;

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

  return (
    <div className="flex flex-col items-center space-y-12 py-10 w-full max-w-3xl mx-auto">
      {/* 3D Card Container */}
      <div 
        className="w-full h-96 [perspective:1000px] cursor-pointer" 
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRONT SIDE */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="bg-[var(--secondary)] p-1 border-2 border-black">
                    <Brain className="w-4 h-4 text-black" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest opacity-40 text-black dark:text-white">Neural Card {index + 1}/{cards.length}</span>
            </div>
            
            <h3 className="text-2xl md:text-4xl font-black leading-tight text-black dark:text-white uppercase italic">
                {current.front}
            </h3>
            
            <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                <Rotate3d className="w-4 h-4 animate-spin-slow" /> Click to reveal solution
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[var(--accent)] border-4 border-black dark:border-white p-12 flex flex-col justify-center items-center text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black">
             <div className="absolute top-6 left-6 font-black text-[10px] uppercase tracking-[0.3em] opacity-60 italic text-black">Neural Solution</div>
             <p className="text-xl md:text-3xl font-black leading-relaxed text-black italic">
                {current.back}
             </p>
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-8">
        <Button 
            onClick={(e) => { e.stopPropagation(); prev(); }} 
            className="h-16 w-16 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white dark:bg-zinc-800 text-black dark:text-white"
        >
          <ChevronLeft className="w-8 h-8" strokeWidth={3} />
        </Button>

        <div className="flex gap-2">
            {[...Array(Math.min(cards.length, 5))].map((_, i) => (
                <div key={i} className={`h-3 w-3 border-2 border-black rounded-full transition-all ${i === index % 5 ? 'bg-black dark:bg-white w-8' : 'bg-transparent'}`} />
            ))}
        </div>

        <Button 
            onClick={(e) => { e.stopPropagation(); next(); }} 
            className="h-16 w-16 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-[var(--primary)] text-white"
        >
          <ChevronRight className="w-8 h-8" strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
}
