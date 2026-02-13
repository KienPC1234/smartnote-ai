"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Save, ArrowLeft, Loader2, Upload, FileText, X, Wand2 } from "lucide-react";
import Link from "next/link";
import { useAlert } from "@/components/GlobalAlert";
import { processFile } from "@/lib/file-processor";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";

export default function NewNotePage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`[DEBUG][FILE_UPLOAD] Starting upload for: ${file.name} (${file.size} bytes)`);

    if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    setIsProcessingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(`[DEBUG][FILE_UPLOAD] Sending request to /api/ai/process-file`);
      const res = await fetch("/api/ai/process-file", {
          method: "POST",
          body: formData,
      });

      if (!res.ok) {
          const data = await res.json();
          console.error(`[DEBUG][FILE_UPLOAD] Error response:`, data);
          throw new Error(data.error || "Failed to process file.");
      }

      const { text } = await res.json();
      console.log(`[DEBUG][FILE_UPLOAD] Successfully extracted ${text?.length || 0} characters`);
      setSourceText(prev => prev ? prev + "\n\n" + text : text);
      toast.success(t.new_note.toast_extraction_success);
    } catch (error: any) {
      console.error(`[DEBUG][FILE_UPLOAD] Process failed:`, error);
      toast.error(error.message || "Failed to process file.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGenerateTitle() {
      if (!sourceText.trim()) return toast.error("Buffer is empty. Add content first.");
      
      console.log(`[DEBUG][AI_TITLE] Requesting title for text length: ${sourceText.length}`);
      setIsGeneratingTitle(true);
      try {
          const res = await fetch("/api/ai/generate-title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sourceText, lang })
          });
          const data = await res.json();
          if (data.title) {
              console.log(`[DEBUG][AI_TITLE] Received: ${data.title}`);
              setTitle(data.title);
              toast.success("Title synthesized.");
          }
      } catch (e) {
          console.error(`[DEBUG][AI_TITLE] Failed:`, e);
          toast.error("Signal failure. Manual entry required.");
      } finally {
          setIsGeneratingTitle(false);
      }
  }

  async function handleSubmit(generateNow: boolean) {
    console.log(`[DEBUG][NOTE_CREATE] Submitting note. generateNow: ${generateNow}`);
    if (!title || !sourceText) {
        console.warn(`[DEBUG][NOTE_CREATE] Missing title or content`);
        return toast.error("Input Required", { description: "Please fill in both title and content." });
    }
    
    setIsLoading(true);
    try {
      console.log(`[DEBUG][NOTE_CREATE] POSTing to /api/notes`);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceText }),
      });

      if (!res.ok) {
          const errorData = await res.json();
          console.error(`[DEBUG][NOTE_CREATE] Error response:`, errorData);
          throw new Error("Failed to save note");
      }
      
      const { id } = await res.json();
      console.log(`[DEBUG][NOTE_CREATE] Note created with ID: ${id}`);

      toast.success(t.new_note.toast_created);
      
      console.log(`[DEBUG][NOTE_CREATE] Redirecting to /app/n/${id}`);
      router.push(`/app/n/${id}${generateNow ? "?gen=true" : ""}`);
    } catch (error: any) {
      console.error(`[DEBUG][NOTE_CREATE] Submit failed:`, error);
      toast.error(error.message || "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative pb-20">
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white text-foreground bg-background">
            <ArrowLeft className="mr-2 w-4 h-4" /> {t.new_note.back_btn}
          </Button>
        </Link>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">{t.new_note.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-6">
            <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-background">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-black uppercase opacity-60 text-foreground">{t.new_note.label_title}</label>
                            <Button 
                                variant="neutral" 
                                size="sm" 
                                onClick={handleGenerateTitle}
                                disabled={isGeneratingTitle || !sourceText}
                                className="h-7 px-2 text-[9px] border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_#000] bg-background text-foreground"
                            >
                                {isGeneratingTitle ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                {t.new_note.ai_title_btn}
                            </Button>
                        </div>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t.new_note.placeholder_title} 
                            className="h-12 border-2 border-black dark:border-white font-bold text-lg text-foreground bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-60 text-foreground">{t.new_note.label_content}</label>
                        <Textarea 
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder={t.new_note.placeholder_content} 
                            className="min-h-[400px] border-2 border-black dark:border-white p-6 font-medium leading-relaxed font-mono text-sm text-foreground bg-background"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="border-4 border-black dark:border-white bg-[var(--accent)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-black uppercase text-sm italic text-black">{t.new_note.method_file}</h3>
                    <input 
                        type="file" 
                        hidden 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                    />
                    <Button 
                        disabled={isProcessingFile}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 border-2 border-black bg-white text-black hover:bg-zinc-50 flex flex-col gap-2 shadow-[4px_4px_0px_0px_#000]"
                    >
                        {isProcessingFile ? (
                            <>
                                <Loader2 className="animate-spin w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">PROCESSING...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8" />
                                <span className="text-xs font-black uppercase tracking-widest">{t.new_note.upload_btn}</span>
                            </>
                        )}
                    </Button>
                    <p className="text-[9px] font-bold text-center opacity-60 uppercase text-black">{t.new_note.file_types}</p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Button 
                    disabled={isLoading || isProcessingFile}
                    onClick={() => handleSubmit(false)}
                    className="w-full h-20 text-xl font-black bg-[var(--primary)] hover:bg-[var(--primary)] text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    {t.dashboard.create_btn}
                </Button>
                
                <Link href="/app" className="block w-full">
                    <Button 
                        variant="neutral"
                        className="w-full h-14 font-black border-2 border-black dark:border-white text-foreground bg-background"
                    >
                        {t.common.cancel}
                    </Button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
