"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Save, ArrowLeft, Loader2, Upload, FileText, X, Wand2, Zap } from "lucide-react";
import Link from "next/link";
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
  const [processingStatus, setProcessingStatus] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    
    setIsProcessingFile(true);
    setProcessingStatus("Initializing Uplink...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Simulated steps for better UX since file processing is a single long request
      const statusSteps = [
        "Uploading Neural Data...",
        "Deconstructing PDF structure...",
        "Rendering Optical Layers...",
        "Scanning via OCR modules...",
        "Synthesizing text nodes...",
        "Finalizing extraction..."
      ];
      
      let step = 0;
      const interval = setInterval(() => {
          if (step < statusSteps.length - 1) {
              setProcessingStatus(statusSteps[step]);
              step++;
          }
      }, 3000);

      const res = await fetch("/api/ai/process-file", { method: "POST", body: formData });
      
      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process file.");
      }
      const { text } = await res.json();
      setSourceText(prev => prev ? prev + "\n\n" + text : text);
      toast.success(t.new_note.toast_extraction_success);
    } catch (error: any) {
      toast.error(error.message || "Failed to process file.");
    } finally {
      setIsProcessingFile(false);
      setProcessingStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGenerateTitle() {
    if (!sourceText.trim()) return toast.error("Buffer is empty. Add content first.");
    setIsGeneratingTitle(true);
    try {
      const res = await fetch("/api/ai/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, lang })
      });
      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
        toast.success("Title synthesized.");
      }
    } catch (e) {
      toast.error("Signal failure. Manual entry required.");
    } finally {
      setIsGeneratingTitle(false);
    }
  }

  async function handleSubmit(generateNow: boolean) {
    if (!title || !sourceText) {
      return toast.error("Input Required", { description: "Please fill in both title and content." });
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceText }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const { id } = await res.json();
      toast.success(t.new_note.toast_created);
      router.push(`/app/n/${id}${generateNow ? "?gen=true" : ""}`);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative pb-20 px-4 pt-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <Link href="/app">
          <Button 
            variant="outline" 
            className="border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow)] transition-all font-bold uppercase italic bg-background text-foreground h-10 px-4 text-xs"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> {t.new_note.back_btn}
          </Button>
        </Link>
        <div className="space-y-2 text-right md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold uppercase italic tracking-tighter text-foreground leading-none">
                {t.new_note.title}
            </h1>
            <div className="h-1.5 w-full bg-primary border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow)]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
            <Card className="border-4 border-border shadow-[10px_10px_0px_0px_var(--shadow)] bg-background rounded-none overflow-hidden transition-colors">
                <CardContent className="p-6 md:p-8 space-y-6">
                    {/* Title Input Group */}
                    <div className="space-y-3 relative">
                        <div className="flex justify-between items-center">
                            <label className="px-2 py-0.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest">
                                {t.new_note.label_title}
                            </label>
                            <Button 
                                onClick={handleGenerateTitle}
                                disabled={isGeneratingTitle || !sourceText}
                                className="h-8 px-3 bg-purple text-white border-2 border-border font-bold uppercase text-[9px] shadow-[2px_2px_0px_0px_var(--shadow)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-30 disabled:grayscale transition-all"
                            >
                                {isGeneratingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                                {t.new_note.ai_title_btn}
                            </Button>
                        </div>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t.new_note.placeholder_title} 
                            className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary rounded-none font-bold text-lg bg-secondary-background text-foreground placeholder:opacity-20"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="space-y-3">
                        <label className="px-2 py-0.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest w-fit">
                            {t.new_note.label_content}
                        </label>
                        <Textarea 
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder={t.new_note.placeholder_content} 
                            className="min-h-[400px] border-2 border-border focus-visible:ring-0 focus-visible:border-primary rounded-none p-6 font-medium leading-relaxed font-mono text-base bg-secondary-background text-foreground placeholder:opacity-20 transition-colors"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Tools */}
        <div className="lg:col-span-4 space-y-6">
            {/* File Upload Section */}
            <Card className="border-4 border-border bg-green shadow-[6px_6px_0px_0px_var(--shadow)] rounded-none">
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold uppercase text-xs italic flex items-center gap-2 text-black">
                       <FileText className="w-4 h-4" /> {t.new_note.method_file}
                    </h3>
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
                        className="w-full h-32 border-2 border-border bg-background hover:bg-secondary-background text-foreground flex flex-col gap-3 shadow-[4px_4px_0px_0px_var(--shadow)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all rounded-none group"
                    >
                        {isProcessingFile ? (
                            <>
                                <Loader2 className="animate-spin w-10 h-10 text-primary" strokeWidth={3} />
                                <div className="text-center">
                                    <span className="text-[10px] font-bold uppercase italic block text-primary">{processingStatus}</span>
                                    <span className="text-[8px] font-black uppercase opacity-40">Do not disconnect...</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 group-hover:scale-110 transition-transform text-primary" strokeWidth={2} />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.new_note.upload_btn}</span>
                            </>
                        )}
                    </Button>
                    <p className="text-[9px] font-bold text-center uppercase text-black/50 leading-tight">
                        {t.new_note.file_types}
                    </p>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4 pt-2">
                <Button 
                    disabled={isLoading || isProcessingFile}
                    onClick={() => handleSubmit(false)}
                    className="w-full h-16 text-xl font-bold bg-orange text-white border-2 border-border shadow-[6px_6px_0px_0px_var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--shadow)] transition-all rounded-none uppercase italic"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2 w-6 h-6" /> : <Save className="mr-2 w-6 h-6" />}
                    {t.dashboard.create_btn}
                </Button>
                
                <Link href="/app" className="block w-full">
                    <Button 
                        variant="outline"
                        className="w-full h-12 font-bold border-2 border-border text-foreground bg-background hover:bg-red-500 hover:text-white transition-all rounded-none uppercase text-xs tracking-widest shadow-[2px_2px_0px_0px_var(--shadow)]"
                    >
                        {t.common.cancel}
                    </Button>
                </Link>
            </div>

            {/* Hint Box */}
            <div className="p-4 border-2 border-border bg-blue text-white shadow-[4px_4px_0px_0px_var(--shadow)] font-bold text-[10px] flex gap-3 italic">
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 shrink-0" />
                <p className="leading-relaxed uppercase">
                    Use AI to synthesize a professional title from your content.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
