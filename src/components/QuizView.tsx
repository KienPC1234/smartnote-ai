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
        }, 20); 
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
        <div className="max-w-3xl mx-auto space-y-8 py-6 animate-in zoom-in-95 duration-500">
            <AlertDialog open={isReassessAlertOpen} onOpenChange={setIsReassessOpen}>
                <AlertDialogContent className="border-4 border-border shadow-[10px_10px_0px_0px_var(--shadow)] bg-background">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-2xl font-bold uppercase italic text-foreground tracking-tight">
                            <AlertTriangle className="w-6 h-6 text-orange" />
                            {t.note.quiz_reassess.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-base text-foreground opacity-70 italic">
                            {t.note.quiz_reassess.desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel asChild>
                            <Button variant="outline" className="border-2 border-border font-bold uppercase text-foreground h-12 px-6 shadow-[2px_2px_0_0_var(--shadow)]">{t.note.quiz_reassess.cancel}</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button onClick={startAnalysis} className="bg-orange text-white border-2 border-border font-bold uppercase shadow-[4px_4px_0_0_var(--shadow)] h-12 px-6 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                                {t.note.quiz_reassess.confirm}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="border-4 border-border p-10 bg-accent text-foreground shadow-[12px_12px_0px_0px_var(--shadow)] text-center relative overflow-hidden group transition-colors">
                <div className="absolute top-0 left-0 w-full h-2 bg-foreground/10 animate-pulse"></div>
                <h2 className="text-7xl md:text-9xl font-black mb-4 italic tracking-tighter uppercase text-foreground group-hover:scale-105 transition-transform duration-500">
                    {questions.length > 0 ? Math.round((score/questions.length)*100) : 0}%
                </h2>
                <p className="text-xl font-bold uppercase tracking-[0.2em] mb-8 opacity-70">
                    {t.note.quiz_content.accuracy}: {score} / {questions.length}
                </p>
                
                <div className="p-6 bg-background/50 border-4 border-border font-bold italic mb-8 max-w-2xl mx-auto text-foreground shadow-[6px_6px_0px_0px_var(--shadow)]">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary animate-bounce" />
                    <span className="uppercase text-[10px] block opacity-50 mb-2 tracking-widest">{t.note.quiz_content.assessment_label}</span>
                    <p className="text-lg md:text-xl leading-relaxed">{assessmentText}<span className="inline-block w-1.5 h-5 bg-foreground animate-pulse ml-1" /></p>
                    
                    {isAnalyzing && (
                        <div className="mt-6 flex items-center justify-center gap-3 text-xs uppercase animate-pulse opacity-60">
                            <Loader2 className="w-4 h-4 animate-spin" /> {t.note.quiz_content.identifying_gaps}
                        </div>
                    )}
                </div>

                <Button onClick={reset} className="h-16 px-10 border-4 border-border font-bold uppercase flex items-center gap-3 mx-auto text-lg shadow-[6px_6px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--primary)] transition-all bg-background text-foreground">
                    <RefreshCcw className="w-5 h-5" /> {t.note.quiz_content.recalibrate}
                </Button>
            </div>
        </div>
    );
  }

  if (!currentQ && !isGeneratingPlaceholder) {
      return (
          <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-50">
              <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin" />
              <p className="font-bold uppercase tracking-[0.3em] text-foreground text-sm italic">{t.note.quiz_content.waiting_modules}</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
        <div className="relative animate-in slide-in-from-bottom-6 fade-in duration-700">
            {/* Question Index Badge */}
            <div className="absolute -top-6 -left-4 bg-foreground text-background font-bold px-4 py-2 text-xl italic border-2 border-border z-10 shadow-[4px_4px_0px_0px_var(--primary)] rotate-[-1deg]">
                {t.note.quiz_content.step} {currentIdx + 1}/{isGenerating ? "?" : questions.length}
            </div>

            <div className="bg-background border-4 border-border p-8 md:p-12 shadow-[12px_12px_0px_0px_var(--shadow)]">
                {isGeneratingPlaceholder ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                        <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin" />
                        <h3 className="text-2xl font-bold uppercase italic animate-pulse text-foreground tracking-tight">{t.note.quiz_content.synthesizing_q} #{currentIdx + 1}...</h3>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl md:text-3xl font-bold mb-10 leading-snug uppercase italic tracking-tighter text-foreground border-l-8 border-primary pl-6 py-2">
                            {currentQ?.question}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {currentQ?.choices?.map((choice, cIdx) => {
                            const isCorrect = cIdx === currentQ.answer_index;
                            const isSelected = selectedIdx === cIdx;
                            
                            return (
                              <button
                                key={cIdx}
                                disabled={isAnswered}
                                onClick={() => handleSelect(cIdx)}
                                className={cn(
                                  "group relative p-6 border-2 border-border text-left transition-all duration-300 min-h-[100px] flex items-center shadow-[4px_4px_0px_0px_var(--shadow)]",
                                  isSelected && !isAnswered && "bg-primary text-white translate-x-[-1px] translate-y-[-1px] shadow-none",
                                  isAnswered && isCorrect && "bg-green text-white translate-x-[-1px] translate-y-[-1px] shadow-none",
                                  isAnswered && isSelected && !isCorrect && "bg-orange text-white translate-x-[-1px] translate-y-[-1px] shadow-none",
                                  !isSelected && !isAnswered && "bg-background hover:bg-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow)] text-foreground"
                                )}
                              >
                                <div className="flex items-start gap-4">
                                    <span className={cn(
                                        "flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-border font-bold text-sm",
                                        isSelected || (isAnswered && isCorrect) ? "bg-white text-black" : "bg-secondary-background"
                                    )}>
                                        {String.fromCharCode(65 + cIdx)}
                                    </span>
                                    <span className="font-bold text-lg leading-tight uppercase tracking-tight italic">{choice}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                            <div className="mt-12 p-8 bg-accent/10 border-4 border-border animate-in slide-in-from-top-4 duration-700 shadow-[8px_8px_0px_0px_var(--shadow)]">
                                <div className="flex items-center gap-3 mb-4">
                                    {selectedIdx === currentQ.answer_index 
                                        ? <CheckCircle2 className="w-8 h-8 text-green" />
                                        : <XCircle className="w-8 h-8 text-orange" />
                                    }
                                    <span className="font-bold uppercase italic text-2xl text-foreground tracking-tight">
                                        {selectedIdx === currentQ.answer_index ? t.note.quiz_content.sync_success : t.note.quiz_content.mismatch}
                                    </span>
                                </div>
                                <div className="p-6 bg-secondary-background border-2 border-border mb-6">
                                    <p className="font-bold text-lg leading-relaxed italic border-l-4 border-primary pl-6 text-foreground/80">
                                        {currentQ.explanation}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleNext}
                                    className="w-full h-16 bg-foreground text-background font-bold uppercase text-xl tracking-widest flex items-center justify-center gap-3 hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[6px_6px_0px_0px_var(--shadow)] active:shadow-none active:translate-x-0 active:translate-y-0 transition-all"
                                >
                                    {currentIdx < questions.length - 1 ? t.note.quiz_content.next_module : (isGenerating ? t.note.quiz_content.wait_more : t.note.quiz_content.view_assessment)} <ArrowRight className="w-6 h-6" strokeWidth={3} />
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
