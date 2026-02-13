"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import FlashcardsView from "./FlashcardsView";
import QuizView from "./QuizView";
import ChatBuddy from "./ChatBuddy";
import NeuralInsights from "./NeuralInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Sparkles, Brain, HelpCircle, RefreshCcw, MessageSquare, 
    Lightbulb, Coffee, BookOpen, Loader2, Zap, CheckCircle2, 
    StopCircle, ArrowLeft, Clock
} from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NoteDetailClient({ note, initialGeneration, autoGenerate = false }: { note: any, initialGeneration: any, autoGenerate?: boolean }) {
    const { t, lang } = useTranslation();
    
    const [activeTab, setActiveTab] = useState("outline");
    const [generation, setGeneration] = useState(initialGeneration);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentGeneratingSection, setCurrentGeneratingSection] = useState<string | null>(null);
    
    const [streamStatus, setStreamStatus] = useState({ message: "", progress: 0 });
    const [streamingOutline, setStreamingOutline] = useState("");
    const [streamingFlashcards, setStreamingFlashcards] = useState<any[]>([]);
    const [streamingQuiz, setStreamingQuiz] = useState<any[]>([]);
    const [streamingWeakspots, setStreamingWeakspots] = useState("");
    const [isAnalyzingWeakspots, setIsAnalyzingWeakspots] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const [promptInput, setPromptInput] = useState("");

    const [isEditingOutline, setIsEditingOutline] = useState(false);
    const [editedOutline, setEditedOutline] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const hasStartedAuto = useRef(false);

    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => [rehypeKatex], []);

    const displayOutline = useMemo(() => {
        // 1. If currently generating outline, show ONLY what's streaming (forces reset look)
        if (isGenerating && currentGeneratingSection === "outline") return streamingOutline;
        
        // 2. If we are generating but passed the outline phase, show the captured stream 
        // until the DB generation is finalized and updated.
        if (isGenerating && streamingOutline) return streamingOutline;

        // 3. Fallback to DB generation
        return generation?.outlineMd || "";
    }, [isGenerating, currentGeneratingSection, streamingOutline, generation]);

    const displayFlashcards = useMemo(() => {
        if (isGenerating && currentGeneratingSection === "flashcards") return streamingFlashcards;
        if (generation?.flashcardsJson) {
            try { return JSON.parse(generation.flashcardsJson); } catch(e) { return []; }
        }
        return streamingFlashcards.length > 0 ? streamingFlashcards : [];
    }, [isGenerating, currentGeneratingSection, streamingFlashcards, generation]);

    const displayQuiz = useMemo(() => {
        if (isGenerating && currentGeneratingSection === "quiz") return streamingQuiz;
        if (generation?.quizJson) {
            try { return JSON.parse(generation.quizJson); } catch(e) { return []; }
        }
        return streamingQuiz.length > 0 ? streamingQuiz : [];
    }, [isGenerating, currentGeneratingSection, streamingQuiz, generation]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (generation?.outlineMd) setEditedOutline(generation.outlineMd);
    }, [generation]);

    useEffect(() => {
        console.log(`[DEBUG][AUTO_GEN] Checking trigger. autoGenerate: ${autoGenerate}, alreadyStarted: ${hasStartedAuto.current}`);
        if (autoGenerate && !hasStartedAuto.current) {
            console.log(`[DEBUG][AUTO_GEN] Triggering automatic generation...`);
            hasStartedAuto.current = true;
            handleGenerate("all");
        }
    }, [autoGenerate]);

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsGenerating(false);
        setCurrentGeneratingSection(null);
        toast.info("Process Terminated by User");
    };

    async function handleSaveOutline() {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/notes/${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outlineMd: editedOutline })
            });
            if (!res.ok) throw new Error("Failed to save outline");
            const data = await res.json();
            setGeneration(data.generation);
            setIsEditingOutline(false);
            toast.success(t.common.success);
        } catch (e: any) {
            toast.error(t.common.error);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleGenerate(targetType: string = "all", customPrompt: string = "", retries = 3) {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        console.log(`[DEBUG][CLIENT_STREAM] Starting generation: ${targetType}. id: ${note.id}`);
        setIsGenerating(true);
        setCurrentGeneratingSection(null);
        
        // Reset buffers
        if (targetType === "all" || targetType === "outline") setStreamingOutline("");
        if (targetType === "all" || targetType === "flashcards") setStreamingFlashcards([]);
        if (targetType === "all" || targetType === "quiz") setStreamingQuiz([]);

        // Set initial view
        if (targetType === "all") {
            setStreamStatus({ message: "Neural Link Established...", progress: 5 });
            setActiveTab("outline");
        } else {
            setActiveTab(targetType);
        }

        // Set a safety timeout for the initial connection
        const timeoutId = setTimeout(() => {
            if (isGenerating && streamStatus.progress === 5) {
                console.error("[DEBUG][CLIENT_STREAM] Connection timed out after 15s");
                controller.abort();
            }
        }, 15000);

        try {
            console.log(`[DEBUG][CLIENT_STREAM] POSTing to /api/notes/${note.id}/generate...`);
            const res = await fetch(`/api/notes/${note.id}/generate`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lang, targetType, userInstructions: customPrompt }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok || !res.body) {
                const errText = await res.text();
                console.error(`[DEBUG][CLIENT_STREAM] HTTP Error ${res.status}:`, errText);
                throw new Error(`Neural link failed (${res.status}).`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = "";

            console.log(`[DEBUG][CLIENT_STREAM] Stream reader established.`);

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log(`[DEBUG][CLIENT_STREAM] Reader closed.`);
                    break;
                }

                streamBuffer += decoder.decode(value, { stream: true });
                
                // Robust SSE parser: handles blocks separated by double newline
                let boundary;
                while ((boundary = streamBuffer.indexOf("\n\n")) !== -1) {
                    const block = streamBuffer.substring(0, boundary).trim();
                    streamBuffer = streamBuffer.substring(boundary + 2);

                    if (!block) continue;

                    let currentEvent = "message";
                    let rawData = "";

                    const lines = block.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("event: ")) {
                            currentEvent = line.slice(7).trim();
                        } else if (line.startsWith("data: ")) {
                            rawData += line.slice(6).trim();
                        }
                    }

                    if (rawData) {
                        try {
                            const parsed = JSON.parse(rawData);
                            
                            if (currentEvent === "status") {
                                console.log(`[DEBUG][CLIENT_STREAM] Status: ${parsed.message} (${parsed.progress}%)`);
                                setStreamStatus(parsed);
                            }
                            else if (currentEvent === "section_start") {
                                console.log(`[DEBUG][CLIENT_STREAM] SECTION_START: ${parsed.section}`);
                                setCurrentGeneratingSection(parsed.section);
                                if (targetType === "all") {
                                    if (["outline", "flashcards", "quiz", "insights"].includes(parsed.section)) {
                                        setActiveTab(parsed.section);
                                    }
                                }
                            }
                            else if (currentEvent === "outline_chunk") {
                                setStreamingOutline(prev => prev + parsed.chunk);
                            }
                            else if (currentEvent === "fc_item") {
                                console.log(`[DEBUG][CLIENT_STREAM] Received Flashcard #${parsed.index}`);
                                setStreamingFlashcards(prev => [...prev, parsed]);
                            }
                            else if (currentEvent === "qz_item") {
                                console.log(`[DEBUG][CLIENT_STREAM] Received Quiz Item #${parsed.index}`);
                                setStreamingQuiz(prev => [...prev, parsed]);
                            }
                            else if (currentEvent === "insight_item") {
                                console.log(`[DEBUG][CLIENT_STREAM] Received Insight: ${parsed.type}`);
                                if (parsed.type === "da") setGeneration((prev: any) => ({ ...prev, devilsAdvocateMd: parsed.content }));
                                if (parsed.type === "meta") setGeneration((prev: any) => ({ ...prev, metaphorsMd: parsed.content }));
                                if (parsed.type === "cp") setGeneration((prev: any) => ({ ...prev, connectionsMd: parsed.content }));
                            }
                            else if (currentEvent === "final") {
                                console.log(`[DEBUG][CLIENT_STREAM] FINAL received. Success: ${!!parsed.generation}`);
                                if (parsed.generation) setGeneration(parsed.generation);
                                setIsGenerating(false);
                                setCurrentGeneratingSection(null);
                                toast.success(t.common.success);
                            }
                            else if (currentEvent === "error") {
                                console.error(`[DEBUG][CLIENT_STREAM] SSE level error:`, parsed.message);
                                throw new Error(parsed.message);
                            }
                        } catch (e) {
                            console.error("[DEBUG][CLIENT_STREAM] JSON Parse Error", e, rawData);
                        }
                    }
                }
            }
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') { 
                console.log("[DEBUG][CLIENT_STREAM] Aborted");
                return; 
            }
            console.error("[DEBUG][CLIENT_STREAM] Fatal error:", e);
            if (retries > 0) {
                console.log(`[DEBUG][CLIENT_STREAM] Retrying (${retries} left)...`);
                setStreamStatus(s => ({ ...s, message: `Re-mapping (${3-retries+1}/3)...` }));
                setTimeout(() => handleGenerate(targetType, customPrompt, retries - 1), 2000);
            } else {
                toast.error(t.common.error);
                setIsGenerating(false);
                setCurrentGeneratingSection(null);
            }
        }
    }

    const tabs = [
        { id: "outline", label: t.note.outline, icon: BookOpen, color: "var(--primary)" },
        { id: "flashcards", label: t.note.flashcards_tab, icon: Brain, color: "var(--secondary)" },
        { id: "quiz", label: t.note.quiz, icon: HelpCircle, color: "var(--accent)" },
        { id: "weakspots", label: t.note.weak_spots, icon: Zap, color: "var(--purple)" },
        { id: "chat", label: t.note.chat, icon: MessageSquare, color: "var(--blue)" },
        { id: "insights", label: t.note.insights, icon: Lightbulb, color: "var(--primary)" },
    ];

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black dark:border-white pb-10 relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-[var(--primary)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center gap-4 mb-2">
                        <Link href="/app">
                            <Button variant="neutral" size="sm" className="h-10 px-4 border-2 border-black font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t.common.back}
                            </Button>
                        </Link>
                        <div className="bg-black dark:bg-white text-background dark:text-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]">{t.note.neural_node}</div>
                   </div>
                   <h1 className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-foreground drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">{note.title}</h1>
                   <div className="flex items-center gap-6 text-sm font-black text-zinc-500 uppercase tracking-widest">
                       <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {isMounted ? new Date(note.createdAt).toLocaleDateString() : "..."}</span>
                       <span className="text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 border border-[var(--primary)]/20">{lang === "vi" ? "Tiếng Việt" : "English"} {t.note.active}</span>
                   </div>
                </div>
                
                {isGenerating ? (
                    <button onClick={stopGeneration} className="h-20 px-12 bg-red-500 text-white font-black text-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 hover:bg-red-600 active:translate-x-1 active:translate-y-1 transition-all group">
                        <StopCircle className="w-8 h-8 group-hover:scale-110 transition-transform" /> {t.note.abort}
                    </button>
                ) : (
                    <Button onClick={() => handleGenerate("all")} size="lg" className="h-20 px-12 text-2xl font-black bg-[var(--primary)] text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all">
                        <Sparkles className="mr-3 w-8 h-8" />
                        {generation ? t.note.regenerate_btn : t.note.initialize}
                    </Button>
                )}
            </div>

            {/* Progress & Log */}
            {isGenerating && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center font-black text-sm uppercase italic text-foreground tracking-widest">
                            <span className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--primary)] animate-pulse" /> {streamStatus.message}</span>
                            <span className="bg-foreground text-background px-3 py-1">{streamStatus.progress}%</span>
                        </div>
                        <div className="h-12 border-4 border-black dark:border-white bg-background shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] relative overflow-hidden">
                            <div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-in-out" style={{ width: `${streamStatus.progress}%` }} />
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] w-20 animate-[marquee_2s_linear_infinite]" />
                        </div>
                    </div>
                    <div className="border-4 border-black dark:border-white p-6 bg-background shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-center">
                        <div className="space-y-2 font-mono text-[10px] font-black uppercase text-foreground">
                            <div className={cn("flex items-center gap-3", streamingOutline ? "text-green-600" : "text-zinc-400")}>
                                {streamingOutline ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />} Outline Map
                            </div>
                            <div className={cn("flex items-center gap-3", streamingFlashcards.length > 0 ? "text-green-600" : "text-zinc-400")}>
                                {streamingFlashcards.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />} Flashcards: {streamingFlashcards.length}
                            </div>
                            <div className={cn("flex items-center gap-3", streamingQuiz.length > 0 ? "text-green-600" : "text-zinc-400")}>
                                {streamingQuiz.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />} Quiz Engine: {streamingQuiz.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!generation && !isGenerating && !streamingOutline ? (
                 <Card className="text-center py-40 border-4 border-dashed border-zinc-300 bg-background shadow-none">
                     <CardContent className="space-y-10">
                        <div className="w-32 h-32 bg-background border-4 border-black dark:border-white rounded-3xl flex items-center justify-center mx-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] rotate-6 group hover:rotate-0 transition-transform duration-500">
                            <Coffee className="w-16 h-16 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black uppercase italic text-foreground tracking-tighter">{t.note.empty_title}</h2>
                        <p className="text-zinc-500 font-bold max-w-md mx-auto text-xl">Initialize your study materials to get started.</p>
                     </CardContent>
                 </Card>
            ) : (
                <div className="space-y-10">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const isReady = (tab.id === "outline" && (streamingOutline || generation?.outlineMd)) || 
                                            (tab.id === "flashcards" && (streamingFlashcards.length > 0 || generation?.flashcardsJson)) ||
                                            (tab.id === "quiz" && (streamingQuiz.length > 0 || generation?.quizJson)) || 
                                            (tab.id === "weakspots") ||
                                            (tab.id === "chat") || (tab.id === "insights" && (generation || streamingOutline));

                            return (
                                <button 
                                    key={tab.id} 
                                    data-tab-id={tab.id} 
                                    disabled={!isReady && isGenerating} 
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-8 border-4 border-black dark:border-white transition-all relative bg-background",
                                        isActive 
                                            ? "translate-x-[-6px] translate-y-[-6px] shadow-[10px_10px_0px_0px_black] dark:shadow-[10px_10px_0px_0px_white]" 
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 opacity-70 hover:opacity-100",
                                        !isReady && isGenerating && "grayscale opacity-30"
                                    )}
                                    style={isActive ? { backgroundColor: tab.color, color: 'black' } : {}}
                                >
                                    <Icon className={cn("w-8 h-8", isActive ? "text-black" : "")} strokeWidth={4} />
                                    <span className="font-black uppercase text-xs tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="min-h-[600px] relative">
                        {activeTab === "outline" && (
                            <div className="space-y-6">
                                {!isGenerating && generation && !isEditingOutline && (
                                    <div className="flex justify-end">
                                        <Button onClick={() => setIsEditingOutline(true)} variant="outline" className="border-2 border-black dark:border-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-foreground bg-background">
                                            {t.note.edit_outline}
                                        </Button>
                                    </div>
                                )}

                                {isEditingOutline ? (
                                    <div className="bg-background border-4 border-black dark:border-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] space-y-4">
                                        <textarea 
                                            value={editedOutline} 
                                            onChange={(e) => setEditedOutline(e.target.value)}
                                            className="w-full min-h-[500px] p-4 border-2 border-black dark:border-white font-mono text-sm dark:bg-zinc-800 dark:text-white outline-none focus:ring-2 focus:ring-[var(--primary)] text-foreground bg-background"
                                            placeholder="Edit your outline here (Markdown supported)..."
                                        />
                                        <div className="flex gap-4">
                                            <Button onClick={handleSaveOutline} disabled={isSaving} className="flex-1 h-12 bg-green-500 text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                                                {isSaving ? "Saving..." : t.note.save_outline}
                                            </Button>
                                            <Button onClick={() => { setIsEditingOutline(false); setEditedOutline(generation?.outlineMd || ""); }} variant="outline" className="flex-1 h-12 border-2 border-black dark:border-white font-black uppercase shadow-[4px_4px_0px_0px_#000] text-foreground bg-background">
                                                {t.common.cancel}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-background border-4 border-black dark:border-white p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] w-full max-w-full overflow-hidden text-foreground">
                                        <style jsx global>{`
                                            .outline-render h1, .outline-render h2, .outline-render h3 {
                                                margin-top: 2rem !important;
                                                margin-bottom: 1rem !important;
                                                line-height: 1.3 !important;
                                            }
                                            .outline-render p, .outline-render li {
                                                margin-bottom: 0.75rem !important;
                                            }
                                        `}</style>
                                        <div className="prose prose-zinc prose-lg dark:prose-invert max-w-full font-medium leading-relaxed [word-break:break-word] [overflow-wrap:anywhere] outline-render text-current">
                                            <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                                                {displayOutline}
                                            </ReactMarkdown>
                                            {isGenerating && currentGeneratingSection === "outline" && (
                                                <span className="inline-block w-2 h-5 bg-[var(--primary)] animate-pulse ml-1 align-middle" />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "flashcards" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                                {isGenerating && currentGeneratingSection === "flashcards" && streamingFlashcards.length === 0 && (
                                    <div className="flex items-center gap-4 p-4 border-4 border-black dark:border-white bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] animate-pulse">
                                        <Zap className="w-6 h-6 text-[var(--secondary)] animate-bounce" />
                                        <span className="font-black uppercase text-sm text-foreground">Synthesizing Active Recall Nodes...</span>
                                    </div>
                                )}
                                <FlashcardsView data={{ flashcards: displayFlashcards }} isGenerating={isGenerating && currentGeneratingSection === "flashcards"} />
                            </div>
                        )}

                        {activeTab === "quiz" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                                {isGenerating && currentGeneratingSection === "quiz" && streamingQuiz.length === 0 && (
                                    <div className="flex items-center gap-4 p-4 border-4 border-black dark:border-white bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] animate-pulse">
                                        <Zap className="w-6 h-6 text-[var(--accent)] animate-spin-slow" />
                                        <span className="font-black uppercase text-sm text-foreground">Calibrating Diagnostic Engine...</span>
                                    </div>
                                )}
                                <QuizView 
                                    data={displayQuiz} 
                                    isGenerating={isGenerating && currentGeneratingSection === "quiz"} 
                                    noteId={note.id} 
                                    onComplete={(val: any) => setGeneration(val)} 
                                    setStreamingWeakspots={setStreamingWeakspots}
                                    setIsAnalyzingWeakspots={setIsAnalyzingWeakspots}
                                    weakspotsMd={generation?.weakspotsMd}
                                    setActiveTab={setActiveTab}
                                />
                            </div>
                        )}

                        {activeTab === "weakspots" && (
                             <div className="bg-background border-4 border-black dark:border-white p-8 md:p-12 shadow-[12px_12px_0px_0px_#f97316] w-full max-w-full overflow-hidden">
                                <div className="prose prose-zinc prose-lg dark:prose-invert max-w-full font-medium leading-relaxed [word-break:break-word] [overflow-wrap:anywhere] text-foreground">
                                    {isAnalyzingWeakspots && !streamingWeakspots && (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <div className="flex gap-2 text-foreground">
                                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" />
                                            </div>
                                            <p className="font-black uppercase text-xs tracking-widest text-orange-500 animate-pulse">Neural Link Established... Analyzing Gaps</p>
                                        </div>
                                    )}
                                    
                                    {(streamingWeakspots || generation?.weakspotsMd) ? (
                                        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                                            {streamingWeakspots || generation?.weakspotsMd || ""}
                                        </ReactMarkdown>
                                    ) : !isAnalyzingWeakspots && (
                                        <div className="text-center py-20 space-y-4">
                                            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Zap className="w-10 h-10 text-orange-500" />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase italic text-foreground">Neural Analysis Required</h3>
                                            <p className="text-zinc-500 font-bold max-w-xs mx-auto">Complete a quiz to identify your knowledge gaps and weak spots.</p>
                                        </div>
                                    )}
                                    {streamingWeakspots && (
                                        <span className="inline-block w-2 h-5 bg-orange-500 animate-pulse ml-1 align-middle" />
                                    )}
                                </div>
                             </div>
                        )}

                        {activeTab === "chat" && <ChatBuddy noteId={note.id} />}
                        {activeTab === "insights" && (generation || streamingOutline) && <NeuralInsights generation={generation || {}} isGenerating={isGenerating} />}
                        
                        {(generation || streamingOutline) && !isGenerating && (activeTab !== "chat" && activeTab !== "insights") && (
                            <div className="mt-12 border-t-4 border-black dark:border-white pt-8 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-xs font-black uppercase opacity-60 tracking-widest italic text-foreground">{t.note.refinement_label}</label>
                                    <Input value={promptInput} onChange={(e) => setPromptInput(e.target.value)} placeholder={t.note.refinement_placeholder} className="h-14 border-4 border-black dark:border-white font-bold text-lg bg-background text-foreground" />
                                </div>
                                <Button 
                                    onClick={() => handleGenerate(activeTab === 'weakspots' ? 'all' : activeTab, promptInput)} 
                                    disabled={isGenerating}
                                    className="h-14 px-10 font-black uppercase border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] bg-[var(--primary)] text-white hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCcw className="mr-2 w-5 h-5" />}
                                    {t.note.re_generate}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
