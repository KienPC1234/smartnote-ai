"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Zap, ArrowRight, RefreshCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

export default function QuizView({ data }: { data: Question[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<{questionIdx: number, selected: number, isCorrect: boolean}[]>([]);

  const questions = Array.isArray(data) ? data : [];
  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const isCorrect = idx === currentQ.answer_index;
    if (isCorrect) setScore(s => s + 1);
    
    setHistory(prev => [...prev, { questionIdx: currentIdx, selected: idx, isCorrect }]);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
        setCurrentIdx(c => c + 1);
        setSelectedIdx(null);
        setIsAnswered(false);
    } else {
        setShowResults(true);
    }
  };

  const reset = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setHistory([]);
  };

  if (showResults) {
    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in zoom-in-95 duration-500">
            <div className="border-8 border-black p-12 bg-[var(--accent)] shadow-[15px_15px_0px_0px_#000] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-black/10 animate-pulse"></div>
                <h2 className="text-6xl md:text-8xl font-black mb-4 italic tracking-tighter uppercase">
                    {Math.round((score/questions.length)*100)}%
                </h2>
                <p className="text-2xl font-black uppercase tracking-widest mb-8">
                    Neural Accuracy: {score} / {questions.length}
                </p>
                
                <div className="p-6 bg-white/40 border-4 border-black font-bold italic mb-8 max-w-2xl mx-auto">
                    <Sparkles className="w-6 h-6 mx-auto mb-2" />
                    <span className="uppercase text-xs block opacity-60">AI Neural Assessment:</span>
                    {score === questions.length 
                        ? "Perfect synchronization! Your cognitive grasp of this node is complete."
                        : score >= questions.length / 2 
                        ? "Strong performance. Minor neural gaps detected, but core concepts are stable."
                        : "Significant knowledge gaps identified. Recommend re-mapping data or focused review."
                    }
                </div>

                <button onClick={reset} className="h-14 px-8 border-4 border-black bg-white font-black uppercase flex items-center gap-2 mx-auto hover:bg-zinc-100 shadow-[4px_4px_0px_0px_#000]">
                    <RefreshCcw className="w-5 h-5" /> RE-CALIBRATE
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
        <div className="relative animate-in slide-in-from-bottom-10 fade-in duration-700">
            {/* Question Index Badge */}
            <div className="absolute -top-6 -left-6 bg-black text-white font-black px-4 py-2 text-xl italic border-2 border-black z-10 shadow-[4px_4px_0px_0px_var(--primary)]">
                STEP {currentIdx + 1}/{questions.length}
            </div>

            <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-8 md:p-12 shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff]">
                <h3 className="text-2xl md:text-3xl font-black mb-10 leading-tight uppercase italic tracking-tighter">
                    {currentQ.question}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentQ.choices.map((choice, cIdx) => {
                    const isCorrect = cIdx === currentQ.answer_index;
                    const isSelected = selectedIdx === cIdx;
                    
                    return (
                      <button
                        key={cIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelect(cIdx)}
                        className={cn(
                          "group relative p-6 border-4 border-black dark:border-white text-left transition-all duration-200",
                          isSelected && !isAnswered && "bg-[var(--primary)] text-white shadow-[4px_4px_0px_0px_#000] translate-x-1 translate-y-1",
                          isAnswered && isCorrect && "bg-green-500 text-white shadow-[4px_4px_0px_0px_#000] translate-x-1 translate-y-1",
                          isAnswered && isSelected && !isCorrect && "bg-red-500 text-white shadow-[4px_4px_0px_0px_#000] translate-x-1 translate-y-1",
                          !isSelected && !isAnswered && "bg-white dark:bg-zinc-800 hover:shadow-[8px_8px_0px_0px_var(--accent)]"
                        )}
                      >
                        <div className="flex items-start gap-4">
                            <span className={cn(
                                "flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-black font-black text-sm",
                                isSelected || (isAnswered && isCorrect) ? "bg-white text-black" : "bg-zinc-100 dark:bg-zinc-900"
                            )}>
                                {String.fromCharCode(65 + cIdx)}
                            </span>
                            <span className="font-bold text-lg leading-snug">{choice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                    <div className="mt-10 p-8 bg-zinc-50 dark:bg-zinc-800 border-4 border-black dark:border-white animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            {selectedIdx === currentQ.answer_index 
                                ? <CheckCircle2 className="w-8 h-8 text-green-500" />
                                : <XCircle className="w-8 h-8 text-red-500" />
                            }
                            <span className="font-black uppercase italic text-xl">
                                {selectedIdx === currentQ.answer_index ? "Sync Successful" : "Neural Mismatch"}
                            </span>
                        </div>
                        <p className="font-bold text-lg mb-6 leading-relaxed italic border-l-8 border-[var(--primary)] pl-6">
                            {currentQ.explanation}
                        </p>
                        <button 
                            onClick={handleNext}
                            className="w-full h-14 bg-black text-white font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-800"
                        >
                            {currentIdx < questions.length - 1 ? "Next Module" : "View Final Assessment"} <ArrowRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
