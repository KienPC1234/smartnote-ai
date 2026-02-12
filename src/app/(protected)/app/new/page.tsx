"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Save, ArrowLeft, Loader2, Upload, FileText, X } from "lucide-react";
import Link from "next/link";
import { useAlert } from "@/components/GlobalAlert";
import { processFile } from "@/lib/file-processor";

export default function NewNotePage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
        // Tự động lấy tên file làm tiêu đề nếu trống
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    setIsProcessingFile(true);
    setProcessingStatus("Initializing...");

    try {
      const text = await processFile(file, (status) => setProcessingStatus(status));
      setSourceText(prev => prev ? prev + "\n\n" + text : text);
      showAlert("Success", "File content extracted and merged into your notes.", "success");
    } catch (error: any) {
      showAlert("Extraction Error", error.message || "Failed to process file.", "error");
    } finally {
      setIsProcessingFile(false);
      setProcessingStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(generateNow: boolean) {
    if (!title || !sourceText) {
        return showAlert("Input Required", "Please fill in both title and content.", "error");
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

      if (generateNow) {
        const genRes = await fetch(`/api/notes/${id}/generate`, { method: "POST" });
        if (!genRes.ok) throw new Error("AI Generation failed. You can retry from the detail page.");
      }

      showAlert("Note Created", "Neural node initialized successfully.", "success");
      router.push(`/app/n/${id}`);
    } catch (error: any) {
      showAlert("System Error", error.message || "Something went wrong.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative pb-20">
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <Link href="/app">
          <Button variant="neutral" size="sm" className="font-bold border-2 border-black dark:border-white">
            <ArrowLeft className="mr-2 w-4 h-4" /> BACK
          </Button>
        </Link>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">New Memory Node</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] dark:bg-zinc-900">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-60">Title</label>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="E.g., History of AI..." 
                            className="h-12 border-2 border-black dark:border-white font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-60">Neural Buffer (Content)</label>
                        <Textarea 
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Paste text or upload a file below..." 
                            className="min-h-[400px] border-2 border-black dark:border-white p-6 font-medium leading-relaxed font-mono text-sm"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right: Actions & Upload */}
        <div className="space-y-6">
            <Card className="border-4 border-black dark:border-white bg-[var(--accent)] shadow-[8px_8px_0px_0px_#000]">
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-black uppercase text-sm italic">Input Method: File</h3>
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
                        className="w-full h-24 border-2 border-black bg-white text-black hover:bg-zinc-50 flex flex-col gap-2"
                    >
                        {isProcessingFile ? (
                            <>
                                <Loader2 className="animate-spin w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">{processingStatus}</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8" />
                                <span className="text-xs font-black uppercase tracking-widest">Upload File (OCR)</span>
                            </>
                        )}
                    </Button>
                    <p className="text-[9px] font-bold text-center opacity-60 uppercase">PDF, Word, Excel, Image (VIE+ENG)</p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Button 
                    disabled={isLoading || isProcessingFile}
                    onClick={() => handleSubmit(true)}
                    className="w-full h-20 text-xl font-black bg-[var(--primary)] hover:bg-[var(--primary)] text-white border-4 border-black shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                    INITIALIZE AI
                </Button>
                
                <Button 
                    disabled={isLoading || isProcessingFile}
                    onClick={() => handleSubmit(false)}
                    variant="neutral"
                    className="w-full h-14 font-black border-2 border-black"
                >
                    <Save className="mr-2 w-5 h-5" />
                    SAVE DRAFT
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
