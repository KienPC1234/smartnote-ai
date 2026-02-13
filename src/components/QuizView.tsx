"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Zap, ArrowRight, RefreshCcw, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "./LanguageProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";

interface Question {
  id: string;
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

interface QuizViewProps {
    data: Question[];
    isGenerating?: boolean;
    noteId?: string;
    onComplete?: (gen: any) => void;
    setStreamingWeakspots?: (content: string) => void;
    setIsAnalyzingWeakspots?: (val: boolean) => void;
    weakspotsMd?: string | null;
    setActiveTab?: (tab: string) => void;
}

export default function QuizView({ 
    data, 
    isGenerating, 
    noteId, 
    onComplete, 
    setStreamingWeakspots, 
    setIsAnalyzingWeakspots,
    weakspotsMd, 
    setActiveTab 
}: QuizViewProps) {
  const { lang, t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<{question: string, selected: string, correct: string, isCorrect: boolean, explanation: string}[]>([]);
  const [assessmentText, setAssessmentText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReassessAlertOpen, setIsReassessOpen] = useState(false);

  const questions = Array.isArray(data) ? data : [];
  
  const startAnalysis = async () => {
    if (!noteId || !onComplete || !setStreamingWeakspots || !setIsAnalyzingWeakspots) return;
    
    setIsAnalyzing(true);
    setIsAnalyzingWeakspots(true);
    setStreamingWeakspots(""); 
    
    onComplete((prev: any) => ({ ...prev, weakspotsMd: null }));
    
    if (setActiveTab) setActiveTab("weakspots");

    try {
        const res = await fetch(`/api/notes/${noteId}/analyze-quiz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizResults: history, lang })
        });

        if (!res.ok || !res.body) throw new Error("Analysis failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
                const lines = part.split("\n");
                let event = "";
                let data = null;

                for (const line of lines) {
                    if (line.startsWith("event: ")) event = line.slice(7).trim();
                    if (line.startsWith("data: ")) {
                        try { data = JSON.parse(line.slice(6).trim()); } catch (e) { }
                    }
                }

                if (event === "chunk" && data?.chunk) {
                    accumulated += data.chunk;
                    setStreamingWeakspots(accumulated);
                } else if (event === "final" && data?.generation) {
                    onComplete(data.generation);
                    setStreamingWeakspots(""); 
                    toast.success(t.common.success);
                }
            }
        }
    } catch (e) {
        console.error("Analysis failed", e);
        toast.error(t.common.error);
    } finally {
        setIsAnalyzing(false);
        setIsAnalyzingWeakspots(false);
    }
  };

  useEffect(() => {
    if (showResults && noteId && onComplete && setStreamingWeakspots) {
        if (weakspotsMd && weakspotsMd.trim().length > 10) {
            setIsReassessOpen(true);
        } else {
            startAnalysis();
        }
    }
  }, [showResults]);

  const isGeneratingPlaceholder = isGenerating && (questions.length === 0 || currentIdx === questions.length);
  const currentQ = questions[currentIdx];

  const waitingMessage = t.note.quiz_content.waiting_msg;
  const readyMessage = t.note.quiz_content.ready_msg;

  useEffect(() => {
    if (showResults) {
        const text = isAnalyzing ? waitingMessage : readyMessage;
        let i = 0;
        setAssessmentText(""); 
        const interval = setInterval(() => {
            setAssessmentText(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30); 
        return () => clearInterval(interval);
    } else {
        setAssessmentText("");
    }
  }, [showResults, isAnalyzing]);

  const handleSelect = (idx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const isCorrect = idx === currentQ.answer_index;
    if (isCorrect) setScore(s => s + 1);
    
    setHistory(prev => [...prev, { 
        question: currentQ.question, 
        selected: currentQ.choices[idx], 
        correct: currentQ.choices[currentQ.answer_index],
        isCorrect,
        explanation: currentQ.explanation
    }]);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
        setCurrentIdx(c => c + 1);
        setSelectedIdx(null);
        setIsAnswered(false);
    } else if (!isGenerating) {
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
            <AlertDialog open={isReassessAlertOpen} onOpenChange={setIsReassessOpen}>
                <AlertDialogContent className="border-8 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] bg-background">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-3xl font-black uppercase italic text-foreground">
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                            {t.note.quiz_reassess.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-lg text-foreground opacity-80">
                            {t.note.quiz_reassess.desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-4">
                        <AlertDialogCancel asChild>
                            <Button variant="neutral" className="border-4 border-black dark:border-white font-black uppercase text-foreground h-14 px-8">{t.note.quiz_reassess.cancel}</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button onClick={startAnalysis} className="bg-orange-500 text-white border-4 border-black dark:border-white font-black uppercase shadow-[6px_6px_0_0_#000] h-14 px-8">
                                {t.note.quiz_reassess.confirm}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="border-8 border-black dark:border-white p-16 bg-[var(--accent)] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,1)] text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-4 bg-black/10 dark:bg-white/10 animate-pulse"></div>
                <h2 className="text-8xl md:text-[10rem] font-black mb-6 italic tracking-tighter uppercase text-black group-hover:scale-105 transition-transform duration-500">
                    {questions.length > 0 ? Math.round((score/questions.length)*100) : 0}%
                </h2>
                <p className="text-3xl font-black uppercase tracking-[0.3em] mb-10 text-black opacity-80">
                    {t.note.quiz_content.accuracy}: {score} / {questions.length}
                </p>
                
                <div className="p-10 bg-white/50 dark:bg-black/20 border-8 border-black dark:border-white font-black italic mb-12 max-w-3xl mx-auto text-black dark:text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
                    <Sparkles className="w-10 h-10 mx-auto mb-4 animate-bounce" />
                    <span className="uppercase text-xs block opacity-60 mb-2 tracking-widest">{t.note.quiz_content.assessment_label}</span>
                    <p className="text-xl md:text-2xl leading-relaxed">{assessmentText}<span className="inline-block w-2 h-6 bg-black dark:bg-white animate-pulse ml-1" /></p>
                    
                    {isAnalyzing && (
                        <div className="mt-8 flex items-center justify-center gap-4 text-sm uppercase animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin" /> {t.note.quiz_content.identifying_gaps}
                        </div>
                    )}
                </div>

                <Button onClick={reset} size="lg" className="h-20 px-12 border-4 border-black dark:border-white font-black uppercase flex items-center gap-3 mx-auto text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all bg-background text-foreground">
                    <RefreshCcw className="w-6 h-6" /> {t.note.quiz_content.recalibrate}
                </Button>
            </div>
        </div>
    );
  }

  if (!currentQ && !isGeneratingPlaceholder) {
      return (
          <div className="flex flex-col items-center justify-center py-40 gap-8 opacity-50">
              <div className="w-20 h-20 border-8 border-black dark:border-white border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="font-black uppercase tracking-[0.4em] text-foreground text-xl">{t.note.quiz_content.waiting_modules}</p>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
        <div className="relative animate-in slide-in-from-bottom-10 fade-in duration-700">
            {/* Question Index Badge */}
            <div className="absolute -top-10 -left-10 bg-foreground text-background font-black px-6 py-3 text-3xl italic border-4 border-black dark:border-white z-10 shadow-[8px_8px_0px_0px_var(--primary)] rotate-[-2deg]">
                {t.note.quiz_content.step} {currentIdx + 1}/{isGenerating ? "?" : questions.length}
            </div>

            <div className="bg-background border-8 border-black dark:border-white p-10 md:p-20 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,1)]">
                {isGeneratingPlaceholder ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-8">
                        <div className="w-24 h-24 border-[12px] border-black dark:border-white border-t-[var(--primary)] rounded-full animate-spin" />
                        <h3 className="text-4xl font-black uppercase italic animate-pulse text-foreground tracking-tighter">{t.note.quiz_content.synthesizing_q} #{currentIdx + 1}...</h3>
                    </div>
                ) : (
                    <>
                        <h3 className="text-3xl md:text-5xl font-black mb-16 leading-none uppercase italic tracking-tighter text-foreground drop-shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
                            {currentQ?.question}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {currentQ?.choices?.map((choice, cIdx) => {
                            const isCorrect = cIdx === currentQ.answer_index;
                            const isSelected = selectedIdx === cIdx;
                            
                            return (
                              <button
                                key={cIdx}
                                disabled={isAnswered}
                                onClick={() => handleSelect(cIdx)}
                                className={cn(
                                  "group relative p-8 border-4 border-black dark:border-white text-left transition-all duration-300 min-h-[120px]",
                                  isSelected && !isAnswered && "bg-[var(--primary)] text-white shadow-[6px_6px_0px_0px_black] translate-x-[-2px] translate-y-[-2px]",
                                  isAnswered && isCorrect && "bg-green-500 text-white shadow-[6px_6px_0px_0px_black] translate-x-[-2px] translate-y-[-2px]",
                                  isAnswered && isSelected && !isCorrect && "bg-red-500 text-white shadow-[6px_6px_0px_0px_black] translate-x-[-2px] translate-y-[-2px]",
                                  !isSelected && !isAnswered && "bg-background hover:bg-[var(--accent)] hover:shadow-[10px_10px_0px_0px_black] hover:translate-x-[-4px] hover:translate-y-[-4px] text-foreground"
                                )}
                              >
                                <div className="flex items-start gap-6">
                                    <span className={cn(
                                        "flex-shrink-0 w-10 h-10 flex items-center justify-center border-4 border-black font-black text-xl",
                                        isSelected || (isAnswered && isCorrect) ? "bg-white text-black" : "bg-zinc-100 dark:bg-zinc-800"
                                    )}>
                                        {String.fromCharCode(65 + cIdx)}
                                    </span>
                                    <span className="font-black text-xl leading-tight uppercase tracking-tight">{choice}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                            <div className="mt-16 p-10 bg-[var(--accent)]/10 dark:bg-zinc-900 border-8 border-black dark:border-white animate-in slide-in-from-top-8 duration-700 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                                <div className="flex items-center gap-4 mb-6">
                                    {selectedIdx === currentQ.answer_index 
                                        ? <CheckCircle2 className="w-12 h-12 text-green-500" />
                                        : <XCircle className="w-12 h-12 text-red-500" />
                                    }
                                    <span className="font-black uppercase italic text-3xl text-foreground tracking-tighter">
                                        {selectedIdx === currentQ.answer_index ? t.note.quiz_content.sync_success : t.note.quiz_content.mismatch}
                                    </span>
                                </div>
                                <div className="p-8 bg-background border-4 border-black dark:border-white mb-8">
                                    <p className="font-black text-xl leading-relaxed italic border-l-[12px] border-[var(--primary)] pl-8 text-foreground">
                                        {currentQ.explanation}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleNext}
                                    className="w-full h-20 bg-foreground text-background font-black uppercase text-2xl tracking-widest flex items-center justify-center gap-4 hover:translate-x-[-4px] hover:translate-y-[-4px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] transition-all"
                                >
                                    {currentIdx < questions.length - 1 ? t.note.quiz_content.next_module : (isGenerating ? t.note.quiz_content.wait_more : t.note.quiz_content.view_assessment)} <ArrowRight className="w-8 h-8" strokeWidth={4} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
}
