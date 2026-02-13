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
    StopCircle, ArrowLeft
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
        { id: "outline", label: t.note.outline, icon: BookOpen, color: "#fb7185" },
        { id: "flashcards", label: t.note.flashcards_tab, icon: Brain, color: "#2dd4bf" },
        { id: "quiz", label: t.note.quiz, icon: HelpCircle, color: "#fcd34d" },
        { id: "weakspots", label: t.note.weak_spots, icon: Zap, color: "#f97316" },
        { id: "chat", label: t.note.chat, icon: MessageSquare, color: "#a78bfa" },
        { id: "insights", label: t.note.insights, icon: Lightbulb, color: "#fb7185" },
    ];

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black dark:border-white pb-8">
                <div className="space-y-2">
                   <div className="flex items-center gap-4 mb-2">
                        <Link href="/app">
                            <Button variant="neutral" size="sm" className="h-8 px-3 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground">
                                <ArrowLeft className="w-3 h-3 mr-1" /> {t.common.back}
                            </Button>
                        </Link>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-foreground">{t.note.neural_node}</div>
                   </div>
                   <h1 className="text-5xl font-black uppercase italic tracking-tight leading-tight md:leading-[1.1] text-foreground">{note.title}</h1>
                   <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                       <span>{isMounted ? new Date(note.createdAt).toLocaleDateString() : "..."}</span>
                       <span className="uppercase tracking-widest text-[var(--primary)]">{lang === "vi" ? "Tiếng Việt" : "English"} {t.note.active}</span>
                   </div>
                </div>
                
                {isGenerating ? (
                    <button onClick={stopGeneration} className="h-16 px-10 bg-red-500 text-white font-black text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 active:translate-x-1 active:translate-y-1 transition-all">
                        <StopCircle className="w-6 h-6 animate-pulse" /> {t.note.abort}
                    </button>
                ) : (
                    <Button onClick={() => handleGenerate("all")} size="lg" className="h-16 px-10 text-xl font-black bg-[var(--primary)] text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                        <Sparkles className="mr-2" />
                        {generation ? t.note.regenerate_btn : t.note.initialize}
                    </Button>
                )}
            </div>

            {/* Progress & Log */}
            {isGenerating && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center font-black text-xs uppercase italic text-foreground">
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[var(--primary)] animate-pulse" /> {streamStatus.message}</span>
                            <span className="bg-foreground text-background px-2 py-0.5">{streamStatus.progress}%</span>
                        </div>
                        <div className="h-10 border-4 border-black dark:border-white bg-background shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] relative overflow-hidden">
                            <div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-in-out" style={{ width: `${streamStatus.progress}%` }} />
                        </div>
                    </div>
                    <div className="border-4 border-black dark:border-white p-4 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-center">
                        <div className="space-y-1 font-mono text-[9px] font-bold uppercase text-foreground">
                            <div className={cn("flex items-center gap-2", streamingOutline ? "text-green-600" : "text-zinc-400")}>
                                {streamingOutline ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Outline Map
                            </div>
                            <div className={cn("flex items-center gap-2", streamingFlashcards.length > 0 ? "text-green-600" : "text-zinc-400")}>
                                {streamingFlashcards.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Flashcards: {streamingFlashcards.length}
                            </div>
                            <div className={cn("flex items-center gap-2", streamingQuiz.length > 0 ? "text-green-600" : "text-zinc-400")}>
                                {streamingQuiz.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />} Quiz Engine: {streamingQuiz.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!generation && !isGenerating && !streamingOutline ? (
                 <Card className="text-center py-32 border-4 border-dashed border-zinc-300 bg-background shadow-none">
                     <CardContent className="space-y-8">
                        <div className="w-24 h-24 bg-background border-2 border-black dark:border-white rounded-3xl flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rotate-3">
                            <Coffee className="w-12 h-12 text-[var(--primary)]" />
                        </div>
                        <h2 className="text-4xl font-black uppercase italic text-foreground">{t.note.empty_title}</h2>
                     </CardContent>
                 </Card>
            ) : (
                <div className="space-y-10">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const isReady = (tab.id === "outline" && (streamingOutline || generation?.outlineMd)) || 
                                            (tab.id === "flashcards" && (streamingFlashcards.length > 0 || generation?.flashcardsJson)) ||
                                            (tab.id === "quiz" && (streamingQuiz.length > 0 || generation?.quizJson)) || 
                                            (tab.id === "weakspots") ||
                                            (tab.id === "chat") || (tab.id === "insights" && (generation || streamingOutline));

                            return (
                                <button key={tab.id} data-tab-id={tab.id} disabled={!isReady && isGenerating} onClick={() => setActiveTab(tab.id)}
                                    className={cn("flex flex-col items-center justify-center gap-2 p-6 border-4 border-black dark:border-white transition-all relative bg-background",
                                        isActive ? "bg-background text-foreground translate-x-[-4px] translate-y-[-4px] shadow-[8px_8px_0px_0px_var(--primary)]" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400",
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
                        {activeTab === "insights" && (generation || streamingOutline) && <NeuralInsights generation={generation || {}} />}
                        
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
