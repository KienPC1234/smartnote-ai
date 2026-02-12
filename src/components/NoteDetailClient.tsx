"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import FlashcardsView from "./FlashcardsView";
import QuizView from "./QuizView";
import ChatBuddy from "./ChatBuddy";
import NeuralInsights from "./NeuralInsights";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Sparkles, Brain, HelpCircle, RefreshCcw, MessageSquare, 
    Lightbulb, Coffee, BookOpen, Loader2, Zap, CheckCircle2, 
    StopCircle
} from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NoteDetailClient({ note, initialGeneration }: { note: any, initialGeneration: any }) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  
  const [activeTab, setActiveTab] = useState("outline");
  const [generation, setGeneration] = useState(initialGeneration);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [streamStatus, setStreamStatus] = useState({ message: "", progress: 0 });
  const [streamingOutline, setStreamingOutline] = useState("");
  const [streamingFlashcards, setStreamingFlashcards] = useState<any[]>([]);
  const [streamingQuiz, setStreamingQuiz] = useState<any[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [promptInput, setPromptInput] = useState("");

  const displayOutline = useMemo(() => {
    if (isGenerating && streamingOutline) return streamingOutline + " █";
    return generation?.outlineMd || "";
  }, [isGenerating, streamingOutline, generation?.outlineMd]);

  const displayFlashcards = isGenerating ? streamingFlashcards : (generation ? JSON.parse(generation.flashcardsJson) : []);
  const displayQuiz = isGenerating ? streamingQuiz : (generation ? JSON.parse(generation.quizJson) : []);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setIsGenerating(false);
    toast.info("Process Terminated by User");
  };

  async function handleGenerate(targetType: string = "all", customPrompt: string = "", retries = 3) {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    if (targetType === "all") {
        setGeneration(null);
        setStreamingOutline("");
        setStreamingFlashcards([]);
        setStreamingQuiz([]);
        setStreamStatus({ message: "Neural Link Established...", progress: 5 });
        setActiveTab("outline");
    }

    try {
        const res = await fetch(`/api/notes/${note.id}/generate`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang, targetType, userInstructions: customPrompt }),
            signal: abortControllerRef.current.signal
        });

        if (!res.body) throw new Error("Neural link failed.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
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
                        try { data = JSON.parse(line.slice(6).trim()); } catch (e) {}
                    }
                }

                if (event && data) {
                    if (event === "status") setStreamStatus(data);
                    else if (event === "outline_chunk") setStreamingOutline(prev => prev + data.chunk);
                    else if (event === "fc_item") {
                        setStreamingFlashcards(prev => [...prev, data]);
                        if (targetType === "all" && activeTab !== "flashcards") setActiveTab("flashcards");
                    }
                    else if (event === "qz_item") {
                        setStreamingQuiz(prev => [...prev, data]);
                        if (targetType === "all" && activeTab !== "quiz") setActiveTab("quiz");
                    }
                    else if (event === "final") {
                        if (data.generation) setGeneration(data.generation);
                        else {
                            setGeneration((prev: any) => ({
                                ...prev,
                                outlineMd: data.type === "outline" ? data.data.outlineMd : prev.outlineMd,
                                flashcardsJson: data.type === "flashcards" ? data.data.flashcardsJson : prev.flashcardsJson,
                                quizJson: data.type === "quiz" ? data.data.quizJson : prev.quizJson,
                            }));
                        }
                        setIsGenerating(false);
                        setPromptInput("");
                    }
                    else if (event === "error") throw new Error(data.message);
                }
            }
        }
    } catch (e: any) {
        if (e.name === 'AbortError') { setIsGenerating(false); return; }
        if (retries > 0) {
            setStreamStatus(s => ({ ...s, message: `Re-mapping (${3-retries+1}/3)...` }));
            setTimeout(() => handleGenerate(targetType, customPrompt, retries - 1), 2000);
        } else {
            toast.error("Neural Failure", { description: e.message });
            setIsGenerating(false);
        }
    }
  }

  const tabs = [
    { id: "outline", label: t.note.outline, icon: BookOpen, color: "#fb7185" },
    { id: "flashcards", label: t.note.flashcards, icon: Brain, color: "#2dd4bf" },
    { id: "quiz", label: t.note.quiz, icon: HelpCircle, color: "#fcd34d" },
    { id: "chat", label: "Study Buddy", icon: MessageSquare, color: "#a78bfa" },
    { id: "insights", label: "Neural Insights", icon: Lightbulb, color: "#fb7185" },
  ];

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black dark:border-white pb-8">
        <div className="space-y-2">
           <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Neural Memory Node</div>
           <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{note.title}</h1>
           <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                <span className="uppercase tracking-widest text-[var(--primary)]">{lang === "vi" ? "Tiếng Việt" : "English"} Active</span>
           </div>
        </div>
        
        {isGenerating ? (
            <button onClick={stopGeneration} className="h-16 px-10 bg-red-500 text-white font-black text-xl border-4 border-black shadow-[6px_6px_0px_0px_#000] flex items-center gap-3 active:translate-x-1 active:translate-y-1 transition-all">
                <StopCircle className="w-6 h-6 animate-pulse" /> ABORT
            </button>
        ) : (
            <Button onClick={() => handleGenerate("all")} size="lg" className="h-16 px-10 text-xl font-black bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_var(--primary)]">
                <Sparkles className="mr-2 text-[var(--accent)]" />
                {generation ? "RE-GENERATE ALL" : "INITIALIZE AI"}
            </Button>
        )}
      </div>

      {/* Progress & Log */}
      {isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center font-black text-xs uppercase italic">
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[var(--primary)] animate-pulse" /> {streamStatus.message}</span>
                    <span className="bg-black text-white px-2 py-0.5">{streamStatus.progress}%</span>
                </div>
                <div className="h-10 border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
                    <div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-in-out" style={{ width: `${streamStatus.progress}%` }} />
                </div>
            </div>
            <div className="border-4 border-black p-4 bg-zinc-50 dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-center">
                <div className="space-y-1 font-mono text-[9px] font-bold uppercase">
                    <div className={cn("flex items-center gap-2", displayOutline ? "text-green-600" : "text-zinc-400")}>
                        {displayOutline ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Outline Map
                    </div>
                    <div className={cn("flex items-center gap-2", displayFlashcards.length > 0 ? "text-green-600" : "text-zinc-400")}>
                        {displayFlashcards.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Flashcards: {displayFlashcards.length}
                    </div>
                    <div className={cn("flex items-center gap-2", displayQuiz.length > 0 ? "text-green-600" : "text-zinc-400")}>
                        {displayQuiz.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Quiz Engine: {displayQuiz.length}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      {!generation && !isGenerating && !streamingOutline ? (
         <Card className="text-center py-32 border-4 border-dashed border-zinc-300">
             <CardContent className="space-y-8">
                <div className="w-24 h-24 bg-white border-2 border-black rounded-3xl flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_#000] rotate-3">
                    <Coffee className="w-12 h-12 text-[var(--primary)]" />
                </div>
                <h2 className="text-4xl font-black uppercase italic">Neural Core Offline</h2>
             </CardContent>
         </Card>
      ) : (
        <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isReady = (tab.id === "outline" && displayOutline) || 
                                   (tab.id === "flashcards" && displayFlashcards.length > 0) ||
                                   (tab.id === "quiz" && displayQuiz.length > 0) || 
                                   (tab.id === "chat") || (tab.id === "insights" && generation);

                    return (
                        <button key={tab.id} disabled={!isReady && isGenerating} onClick={() => setActiveTab(tab.id)}
                            className={cn("flex flex-col items-center justify-center gap-2 p-6 border-4 border-black dark:border-white transition-all relative",
                                isActive ? "bg-white text-black translate-x-[-4px] translate-y-[-4px] shadow-[8px_8px_0px_0px_var(--primary)]" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400",
                                !isReady && isGenerating && "grayscale opacity-30"
                            )}>
                            <Icon className={cn("w-6 h-6", isActive ? "text-[var(--primary)]" : "")} strokeWidth={3} />
                            <span className="font-black uppercase text-[10px] tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[600px] relative">
                {activeTab === "outline" && (
                    <div className="bg-white dark:bg-zinc-900 border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_#000] w-full max-w-full overflow-hidden">
                        <div className="prose prose-zinc prose-lg dark:prose-invert max-w-full font-medium leading-relaxed [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                            >
                                {displayOutline}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {activeTab === "flashcards" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                        {isGenerating && (
                            <div className="flex items-center gap-4 p-4 border-4 border-black bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] animate-pulse">
                                <Zap className="w-6 h-6 text-[var(--secondary)] animate-bounce" />
                                <span className="font-black uppercase text-sm">Streaming Neural Nodes: {displayFlashcards.length} loaded</span>
                            </div>
                        )}
                        <FlashcardsView data={{ flashcards: displayFlashcards }} />
                    </div>
                )}

                {activeTab === "quiz" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                        {isGenerating && (
                            <div className="flex items-center gap-4 p-4 border-4 border-black bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] animate-pulse">
                                <Zap className="w-6 h-6 text-[var(--accent)] animate-spin-slow" />
                                <span className="font-black uppercase text-sm">Synthesizing Diagnostic Questions: {displayQuiz.length} ready</span>
                            </div>
                        )}
                        <QuizView data={displayQuiz} />
                    </div>
                )}

                {activeTab === "chat" && <ChatBuddy noteId={note.id} />}
                {activeTab === "insights" && generation && <NeuralInsights generation={generation} />}
                
                {generation && !isGenerating && (activeTab === "outline" || activeTab === "flashcards" || activeTab === "quiz") && (
                    <div className="mt-12 border-t-4 border-black pt-8 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-black uppercase opacity-60 tracking-widest italic">Neural Refinement</label>
                            <Input value={promptInput} onChange={(e) => setPromptInput(e.target.value)} placeholder={`E.g., "Add more cards", "Make quiz harder"...`} className="h-14 border-4 border-black font-bold text-lg" />
                        </div>
                        <Button onClick={() => handleGenerate(activeTab, promptInput)} className="h-14 px-10 font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_#000] bg-[var(--primary)] text-white hover:translate-x-[-2px] hover:translate-y-[-2px]">
                            <RefreshCcw className="mr-2 w-5 h-5" /> RE-GENERATE
                        </Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
