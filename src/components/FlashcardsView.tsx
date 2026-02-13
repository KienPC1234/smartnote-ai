"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTranslation } from "./LanguageProvider";
import { Button } from "@/components/ui/button";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardsViewProps {
  data: {
    flashcards: Flashcard[];
  };
  isGenerating?: boolean;
}

export default function FlashcardsView({ data, isGenerating }: FlashcardsViewProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = Array.isArray(data.flashcards) ? data.flashcards : [];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % cards.length);
    }, 300); // Tăng timeout chút để khớp animation
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + cards.length) % cards.length);
    }, 300);
  };

  const reset = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
  };

  if (cards.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50 border-4 border-dashed border-border rounded-none">
        <Brain className="w-12 h-12 mb-4" />
        <p className="font-bold uppercase tracking-widest text-sm italic">Neural Buffer Empty</p>
      </div>
    );
  }

  const currentCard = cards[currentIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Container 3D Perspective */}
      <div className="group h-[400px] w-full [perspective:1000px]">
        {/* Card Inner - Xử lý xoay */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            "relative w-full h-full transition-all duration-500 cursor-pointer",
            "[transform-style:preserve-3d]", // Quan trọng: Giữ không gian 3D
            isFlipped ? "[transform:rotateY(180deg)]" : "" // Xoay container
          )}
        >
          {/* ================= MẶT TRƯỚC (FRONT) ================= */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-background border-4 border-border p-10 flex flex-col items-center justify-center text-center shadow-[10px_10px_0px_0px_var(--shadow)]">
            <span className="absolute top-6 left-8 text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
              {t.note.flashcards_content.front_label} #{currentIdx + 1}
            </span>
            <div className="prose prose-lg dark:prose-invert font-semibold text-foreground leading-relaxed max-w-full overflow-hidden">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[[rehypeKatex, { output: "html", strict: false }]]}
              >
                {currentCard?.front || "..."}
              </ReactMarkdown>
            </div>
            <div className="absolute bottom-8 text-[10px] font-bold uppercase tracking-widest opacity-30 animate-pulse">
              {t.note.flashcards_content.revealer || "Click to flip"}
            </div>
          </div>

          {/* ================= MẶT SAU (BACK) ================= */}
          {/* LƯU Ý QUAN TRỌNG:
              1. [transform:rotateY(180deg)]: Mặt sau phải xoay sẵn 180 độ.
              2. [backface-visibility:hidden]: Để không bị nhìn xuyên thấu khi ở mặt trước.
          */}
          <div 
            className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-orange text-white border-4 border-border p-10 flex flex-col items-center justify-center text-center shadow-[10px_10px_0px_0px_var(--shadow)] overflow-y-auto"
          >
            <span className="absolute top-6 left-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/50 italic">
              {t.note.flashcards_content.back_label}
            </span>
            <div className="prose prose-lg prose-invert font-semibold leading-relaxed text-white max-w-full overflow-hidden">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[[rehypeKatex, { output: "html", strict: false }]]}
              >
                {currentCard?.back || "..."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-6 px-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrev}
          disabled={cards.length <= 1}
          className="h-14 w-14 border-4 border-border shadow-[4px_4px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-background text-foreground"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        <div className="flex-1 text-center">
          <p className="font-black text-xl italic uppercase tracking-tighter text-foreground">
            {currentIdx + 1} / {cards.length}
          </p>
          <div className="w-32 h-1.5 bg-border/10 mx-auto mt-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          disabled={cards.length <= 1}
          className="h-14 w-14 border-4 border-border shadow-[4px_4px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-background text-foreground"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="font-black uppercase italic border-2 border-border/20 text-foreground/40 hover:text-primary transition-colors text-[10px] tracking-widest bg-transparent"
        >
          <RefreshCcw className="w-3 h-3 mr-2" /> Recalibrate Sequence
        </Button>
      </div>
    </div>
  );
}