'use client';

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
import { useTranslation } from "./LanguageProvider";
import { toast } from "sonner";

// ... (Interface Message không đổi)
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
  const [uploadedImages, setUploadedImages] = useState<{ id: string, preview: string, extractedText: string }[]>([]);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatConfig = t?.global_chat || {
    title: "NEURAL BRAIN",
    welcome: "Neural network online. Ask me about your nodes.",
    placeholder: "TYPE COMMAND OR QUERY...",
    ocr_placeholder: "OCR IN PROGRESS...",
    thinking: "Thinking",
    log_title: "Log Analysis Process",
    student_label: "Student",
    assistant_label: "Assistant",
    ocr_success: "OCR Success",
    ocr_error: "OCR Error",
    ocr_desc: "Extracted content from {count} images.",
    ocr_fail_desc: "Optical sensor failure.",
    neural_error: "Neural Error"
  };

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [messages, isLoading]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessingImage(true);
    try {
        const newImages = await Promise.all(Array.from(files).map(async (file) => {
            const preview = URL.createObjectURL(file);
            
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/ai/process-file", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to process image.");
            }

            const { text } = await res.json();
            return {
                id: Math.random().toString(36).substring(7),
                preview,
                extractedText: text
            };
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
        toast.success(chatConfig.ocr_success, { description: chatConfig.ocr_desc.replace("{count}", files.length.toString()) });
    } catch (e: any) {
        toast.error(chatConfig.ocr_error, { description: e.message || chatConfig.ocr_fail_desc });
    } finally {
        setIsProcessingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const removeImage = (id: string) => {
      setUploadedImages(prev => {
          const target = prev.find(img => img.id === id);
          if (target) URL.revokeObjectURL(target.preview);
          return prev.filter(img => img.id !== id);
      });
  };

  async function handleSend() {
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;
    
    let fullContent = input.trim();
    if (uploadedImages.length > 0) {
        const ocrContext = uploadedImages.map((img, i) => `[IMAGE_${i+1}_OCR_TEXT]:\n${img.extractedText}`).join("\n\n");
        fullContent = `${fullContent}\n\n[CONTEXT_FROM_UPLOADED_IMAGES]:\n${ocrContext}`;
    }

    setInput("");
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    
    const updatedMessages = [...messages, { role: "user", content: fullContent }];
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
        toast.error(chatConfig.neural_error, { description: e.message });
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
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-50">
        <Link href="/app/guide">
            <button className="w-12 h-12 bg-background border-[3px] border-foreground rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group">
                <HelpCircle className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
            </button>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-16 h-16 bg-primary border-[4px] border-foreground rounded-full flex items-center justify-center shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group"
        >
            <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[450px] max-w-[95vw] h-[650px] max-h-[85vh] flex flex-col z-50 animate-in slide-in-from-bottom-6">
      <Card className="flex-1 border-[4px] border-foreground flex flex-col bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
        <CardHeader className="bg-primary border-b-[4px] border-foreground flex flex-row items-center justify-between p-4 space-y-0 text-white">
          <CardTitle className="text-lg font-black italic flex items-center gap-2 uppercase tracking-tighter">
            <Bot className="w-6 h-6" /> {chatConfig.title}
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform p-1 bg-black/10 rounded-lg">
            <X className="w-6 h-6 text-white" />
          </button>
        </CardHeader>
        
        <ScrollArea className="flex-1 bg-muted/20">
          <CardContent className="p-4 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20 px-10 opacity-40 font-black italic text-sm uppercase tracking-widest leading-relaxed">
                  {chatConfig.welcome}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`group relative p-4 border-[3px] border-foreground max-w-[90%] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]
                  ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-background text-foreground'}
                `}>
                  <div className={`flex items-center gap-2 mb-3 opacity-60 uppercase text-[9px] font-black tracking-[0.2em] ${m.role === 'user' ? 'text-white' : 'text-primary'}`}>
                      {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {m.role === 'user' ? chatConfig.student_label : chatConfig.assistant_label}
                  </div>

                  {m.reasoning && (
                    <div className="mb-4 bg-muted border-2 border-foreground/10 p-3 rounded shadow-inner">
                        <button 
                            onClick={() => toggleThinking(i)}
                            className="flex items-center justify-between w-full text-[9px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                {chatConfig.log_title}
                            </span>
                            {m.isThinkingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {m.isThinkingOpen && (
                            <div className="mt-3 text-[10px] font-bold text-muted-foreground italic leading-relaxed border-t border-foreground/5 pt-2 animate-in fade-in duration-300">
                                {m.reasoning}
                            </div>
                        )}
                    </div>
                  )}

                  <div className={`prose prose-sm dark:prose-invert max-w-none font-bold italic leading-relaxed text-current
                    ${m.role === 'user' ? 'prose-p:text-white' : ''}`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[[rehypeKatex, { output: 'html', strict: false }]]}
                      >
                          {m.content}
                      </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t-[4px] border-foreground bg-background space-y-3">
          {uploadedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                  {uploadedImages.map((img) => (
                      <div key={img.id} className="relative shrink-0">
                          <img src={img.preview} alt="OCR" className="w-12 h-12 object-cover border-2 border-foreground shadow-[2px_2px_0px_0px_#000]" />
                          <button onClick={() => removeImage(img.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-foreground shadow-sm hover:scale-110 transition-transform">
                              <X className="w-2.5 h-2.5" />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex gap-2">
            <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isProcessingImage}
                className="w-12 h-12 shrink-0 border-[3px] border-foreground bg-yellow-400 text-black flex items-center justify-center hover:translate-y-[-2px] transition-transform shadow-[3px_3px_0px_0px_#000] active:shadow-none active:translate-y-0"
            >
                {isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isProcessingImage ? chatConfig.ocr_placeholder : chatConfig.placeholder}
                className="flex-1 h-12 px-4 border-[3px] border-foreground bg-muted/50 text-foreground font-bold text-xs outline-none focus:bg-background transition-colors placeholder:italic placeholder:opacity-50"
            />
            <button 
                onClick={handleSend} 
                disabled={isLoading || isProcessingImage} 
                className="w-12 h-12 shrink-0 bg-primary text-white border-[3px] border-foreground flex items-center justify-center hover:translate-y-[-2px] transition-transform shadow-[3px_3px_0px_0px_#000] active:shadow-none active:translate-y-0"
            >
                <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}