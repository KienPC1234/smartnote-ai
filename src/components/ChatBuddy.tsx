"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, Bot, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function ChatBuddy({ noteId }: { noteId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hi! I'm your AI Study Buddy. Ask me anything about this note!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/notes/${noteId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMsg }] })
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", content: data.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting to the system." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-2 border-black dark:border-white h-[600px] flex flex-col bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff]">
      <CardHeader className="border-b-2 border-black dark:border-white/20">
        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
          <Bot className="w-6 h-6 text-[var(--primary)]" />
          Study Buddy
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 border-2 border-black dark:border-white font-bold text-sm shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]
              ${msg.role === "user" ? "bg-[var(--secondary)]" : "bg-white dark:bg-zinc-800"}
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-50 uppercase text-[10px] font-black">
                {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                {msg.role}
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t-2 border-black dark:border-white/20 flex gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something about the notes..."
          className="h-12 border-2 border-black dark:border-white font-bold"
        />
        <Button 
          onClick={sendMessage}
          disabled={isLoading}
          className="h-12 w-12 border-2 border-black dark:border-white bg-[var(--primary)] hover:bg-[var(--primary)]"
        >
          <Send className="w-5 h-5 text-white" />
        </Button>
      </div>
    </Card>
  );
}
