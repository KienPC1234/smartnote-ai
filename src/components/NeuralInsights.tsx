"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Flame, Zap, GitMerge, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { useTranslation } from "./LanguageProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NeuralInsightsProps {
    generation: {
        devilsAdvocateMd?: string | null;
        metaphorsMd?: string | null;
        connectionsMd?: string | null;
        weakspotsMd?: string | null;
    };
    isGenerating?: boolean;
}

const NeuralLoading = () => (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="flex gap-2">
            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 animate-pulse">Neural Synthesizing...</p>
    </div>
);

const TypewriterMarkdown = ({ content, isGenerating }: { content: string, isGenerating?: boolean }) => {
    const [displayedContent, setDisplayedContent] = useState("");
    
    useEffect(() => {
        if (!content) {
            setDisplayedContent("");
            return;
        }

        // Nếu đang generate, hiển thị trực tiếp để hỗ trợ streaming mượt mà
        if (isGenerating) {
            setDisplayedContent(content);
            return;
        }

        // Chỉ chạy hiệu ứng máy đánh chữ khi đã có kết quả cuối cùng và chưa hiển thị xong
        if (displayedContent.length < content.length) {
            let i = displayedContent.length;
            const interval = setInterval(() => {
                setDisplayedContent(content.slice(0, i));
                i += 5;
                if (i > content.length) {
                    setDisplayedContent(content); 
                    clearInterval(interval);
                }
            }, 10);
            return () => clearInterval(interval);
        } else {
            setDisplayedContent(content);
        }
    }, [content, isGenerating]);

    if (isGenerating && !content) return <NeuralLoading />;

    return (
        <ReactMarkdown>
            {displayedContent || (isGenerating ? "" : "No content synthesized.")}
        </ReactMarkdown>
    );
};

export default function NeuralInsights({ generation, isGenerating }: NeuralInsightsProps) {
    const [isVisible, setIsVisible] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-4 mb-8">
                <div className="h-1 flex-1 bg-foreground opacity-20"></div>
                <h2 className="text-sm font-black uppercase tracking-[0.5em] italic opacity-50 text-foreground">{t.note.insights}</h2>
                <div className="h-1 flex-1 bg-foreground opacity-20"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Devil's Advocate */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--primary)] bg-background animate-in slide-in-from-left-10 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-foreground">
                            <Flame className="w-6 h-6 text-[var(--primary)]" />
                            Devil's Advocate
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-help">
                                        <HelpCircle className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs border-2 border-black dark:border-white bg-background text-foreground font-bold p-3">
                                    <p>{t.note.insights_help.devils_advocate}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium text-foreground">
                        <TypewriterMarkdown 
                            content={generation.devilsAdvocateMd || ""} 
                            isGenerating={isGenerating} 
                        />
                    </CardContent>
                </Card>

                {/* Metaphor Magic */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--secondary)] bg-background animate-in slide-in-from-right-10 duration-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-foreground">
                            <Zap className="w-6 h-6 text-[var(--secondary)]" />
                            Metaphor Magic
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-help">
                                        <HelpCircle className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs border-2 border-black dark:border-white bg-background text-foreground font-bold p-3">
                                    <p>{t.note.insights_help.metaphor}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium text-foreground">
                        <TypewriterMarkdown 
                            content={generation.metaphorsMd || ""} 
                            isGenerating={isGenerating} 
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cross-Pollination */}
                <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_var(--accent)] bg-background animate-in slide-in-from-left-10 duration-1000">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-foreground">
                            <GitMerge className="w-6 h-6 text-[var(--accent)]" />
                            Cross-Pollination
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-help">
                                        <HelpCircle className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs border-2 border-black dark:border-white bg-background text-foreground font-bold p-3">
                                    <p>{t.note.insights_help.cross_pollination}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="prose prose-zinc dark:prose-invert font-medium text-foreground">
                        <TypewriterMarkdown 
                            content={generation.connectionsMd || ""} 
                            isGenerating={isGenerating} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
