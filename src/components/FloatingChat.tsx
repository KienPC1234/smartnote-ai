"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, HelpCircle, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from "next/link";
import { useAlert } from "@/components/GlobalAlert";
import { processFile } from "@/lib/file-processor";

interface Message {
  role: string;
  content: string;
  reasoning?: string;
  isThinkingOpen?: boolean;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessingImage(true);
    try {
        const text = await processFile(file);
        setInput(prev => prev + `\n[IMAGE_ANALYSIS: ${text}]\n`);
        showAlert("Success", "Intelligence extracted from image.", "success");
    } catch (e) {
        showAlert("Error", "Optical sensor failure.", "error");
    } finally {
        setIsProcessingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    
    const updatedMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
        const res = await fetch("/api/ai/global-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) })
        });

        if (!res.body) throw new Error("Connection lost.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        let assistantReasoning = "";

        setMessages(prev => [...prev, { role: "assistant", content: "", reasoning: "", isThinkingOpen: false }]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") break;
                    
                    try {
                        const parsed = JSON.parse(dataStr);
                        const delta = parsed.choices[0]?.delta;
                        
                        if (delta?.reasoning) assistantReasoning += delta.reasoning;
                        if (delta?.content) assistantContent += delta.content;
                        
                        setMessages(prev => {
                            const updated = [...prev];
                            const last = updated[updated.length - 1];
                            if (last.role === "assistant") {
                                // Gán lại để đảm bảo React thấy sự thay đổi
                                updated[updated.length - 1] = {
                                    ...last,
                                    content: assistantContent,
                                    reasoning: assistantReasoning
                                };
                            }
                            return updated;
                        });
                    } catch (e) {}
                }
            }
        }
    } catch (e: any) {
        showAlert("Neural Error", e.message, "error");
    } finally {
        setIsLoading(false);
    }
  }

  const toggleThinking = (index: number) => {
    setMessages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isThinkingOpen: !updated[index].isThinkingOpen };
        return updated;
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
        <Link href="/app/guide">
            <button className="w-12 h-12 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <HelpCircle className="w-6 h-6 text-black dark:text-white" />
            </button>
        </Link>
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-[var(--primary)] border-4 border-black dark:border-white rounded-full flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group">
            <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[500px] max-w-[95vw] h-[700px] max-h-[85vh] flex flex-col z-50 animate-in slide-in-from-bottom-4">
      <Card className="flex-1 border-4 border-black dark:border-white flex flex-col bg-white dark:bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <CardHeader className="bg-[var(--secondary)] border-b-4 border-black dark:border-white flex flex-row items-center justify-between p-4 space-y-0">
          <CardTitle className="text-xl font-black italic flex items-center gap-2 text-black">
            <Bot className="w-6 h-6" /> NEURAL BRAIN
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform p-1">
            <X className="w-6 h-6 text-black" />
          </button>
        </CardHeader>
        
        <ScrollArea className="flex-1 bg-zinc-50 dark:bg-zinc-900/50">
          <CardContent className="p-4 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-40 font-bold italic text-sm">
                  Neural network online. Ask me about your nodes.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 border-2 border-black dark:border-white max-w-[95%] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]
                  ${m.role === 'user' ? 'bg-[var(--accent)] text-black' : 'bg-white dark:bg-zinc-800 text-foreground'}
                `}>
                  <div className="flex items-center gap-2 mb-2 opacity-50 uppercase text-[10px] font-black tracking-widest">
                      {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {m.role === 'user' ? 'Student' : 'Assistant'}
                  </div>

                  {/* Improved Thinking Section */}
                  {m.reasoning && (
                    <div className="mb-4 bg-zinc-100 dark:bg-zinc-900/50 border-2 border-black/10 dark:border-white/10 p-3 rounded-lg">
                        <button 
                            onClick={() => toggleThinking(i)}
                            className="flex items-center justify-between w-full text-[10px] font-black uppercase text-zinc-500 hover:text-[var(--primary)] transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                Log Analysis Process
                            </span>
                            {m.isThinkingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {m.isThinkingOpen && (
                            <div className="mt-3 text-[11px] font-bold text-zinc-500 italic leading-relaxed border-t border-black/5 dark:border-white/5 pt-2 animate-in fade-in slide-in-from-top-1">
                                {m.reasoning}
                            </div>
                        )}
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {m.content}
                      </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length-1]?.role === "user" && (
              <div className="flex justify-start animate-in fade-in">
                  <div className="p-4 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000]">
                      <div className="flex gap-1 text-black dark:text-white font-black text-xs uppercase tracking-widest">
                        <span>Thinking</span>
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce [animation-delay:0.2s]">.</span>
                        <span className="animate-bounce [animation-delay:0.4s]">.</span>
                      </div>
                  </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>

        <div className="p-4 border-t-4 border-black dark:border-white flex flex-col gap-2 bg-white dark:bg-zinc-950">
          <div className="flex gap-2">
            <input 
                type="file" hidden ref={fileInputRef} 
                onChange={handleImageUpload} accept="image/*"
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isProcessingImage}
                className="w-12 h-12 border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-[var(--accent)] transition-colors shadow-[3px_3px_0px_0px_#000]"
            >
                {isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" /> : <ImageIcon className="w-5 h-5 text-black dark:text-white" />}
            </button>
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isProcessingImage ? "EXTRACTING DATA..." : "TYPE COMMAND OR QUERY..."}
                disabled={isProcessingImage}
                className="flex-1 h-12 px-4 border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 font-black text-xs outline-none focus:bg-white dark:focus:bg-zinc-700 transition-colors text-black dark:text-white"
            />
            <button 
                onClick={handleSend} 
                disabled={isLoading || isProcessingImage} 
                className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white flex items-center justify-center hover:bg-[var(--primary)] transition-colors shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]"
            >
                <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
