"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, Bot, Loader2, RefreshCcw } from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBuddy({ noteId }: { noteId: string }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chat_history_${noteId}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: "assistant", content: "Hi! I'm your AI Study Buddy. Ask me anything about this note!" }]);
      }
    } else {
      setMessages([{ role: "assistant", content: "Hi! I'm your AI Study Buddy. Ask me anything about this note!" }]);
    }
  }, [noteId]);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${noteId}`, JSON.stringify(messages));
    }
  }, [messages, noteId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleReset = () => {
    const defaultMsg: Message[] = [{ role: "assistant", content: "Hi! I'm your AI Study Buddy. Ask me anything about this note!" }];
    setMessages(defaultMsg);
    localStorage.removeItem(`chat_history_${noteId}`);
  };

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/notes/${noteId}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) throw new Error("Chat failed");
      if (!res.body) throw new Error("No body");

      let hasStarted = false;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

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
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    if (!hasStarted && content) {
                        setMessages(prev => [...prev, { role: "assistant", content: "" }]);
                        hasStarted = true;
                    }
                    accumulated += content;
                    if (hasStarted) {
                        setMessages(prev => {
                            const next = [...prev];
                            next[next.length - 1] = { role: "assistant", content: accumulated };
                            return next;
                        });
                    }
                } catch (e) {}
            }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting to the system." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-4 border-black dark:border-white h-[700px] flex flex-col bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
      <CardHeader className="border-b-4 border-black dark:border-white/20 bg-background flex flex-row items-center justify-between py-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic text-foreground">
          <div className="p-2 bg-[var(--primary)] border-2 border-black dark:border-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Bot className="w-6 h-6 text-white" />
          </div>
          Study Buddy
        </CardTitle>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="border-2 border-black dark:border-white font-black uppercase text-[10px] h-8 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground bg-background"
        >
            <RefreshCcw className="w-3 h-3 mr-1" /> {t.note.reset_chat}
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white bg-zinc-50 dark:bg-zinc-950" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-5 border-4 border-black dark:border-white font-bold text-base shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] relative
              ${msg.role === "user" 
                ? "bg-[var(--secondary)] text-black rounded-tl-2xl rounded-bl-2xl rounded-tr-sm" 
                : "bg-background text-foreground rounded-tr-2xl rounded-br-2xl rounded-tl-sm"}
            `}>
              <div className={`flex items-center gap-2 mb-2 uppercase text-[10px] font-black opacity-50 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? <><span className="tracking-widest">You</span><User className="w-3 h-3" /></> : <><Bot className="w-3 h-3" /><span className="tracking-widest">AI Tutor</span></>}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-current">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {msg.role === "bot" && isLoading && i === messages.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1 align-middle" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (!messages[messages.length-1]?.content || messages[messages.length-1]?.role === "user") && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="p-5 border-4 border-black dark:border-white bg-background text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] rounded-tr-2xl rounded-br-2xl rounded-tl-sm flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50 italic">Neural Syncing...</span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-6 bg-background border-t-4 border-black dark:border-white/20">
        <div className="relative">
            <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t.note.refinement_placeholder}
            className="h-14 border-4 border-black dark:border-white font-bold text-lg bg-zinc-50 dark:bg-zinc-800 focus-visible:ring-0 focus-visible:border-[var(--primary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] pr-12 text-foreground"
            />
            <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 border-2 border-black dark:border-white bg-[var(--primary)] hover:bg-[var(--primary)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all p-0 flex items-center justify-center"
            >
            <Send className="w-5 h-5 text-white" />
            </button>
        </div>
      </div>
    </Card>
  );
}
