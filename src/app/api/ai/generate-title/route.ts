import { auth } from "@/lib/auth";
import { llm } from "@/lib/llm";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { sourceText, lang } = await req.json();
        if (!sourceText) return NextResponse.json({ error: "Content is empty" }, { status: 400 });

        const sys = SYSTEM_PROMPT(lang || "en");
        const prompt = `
            Task: Create a short, catchy, and professional title for the provided content.
            Objective: Summarize the main topic in 3-7 words.
            Rules: 
            1. Return ONLY the plain title text.
            2. NO Markdown formatting (NO #, NO **, NO _).
            3. NO quotes, NO intro, NO period at the end.
            
            Content:
            ${sourceText.substring(0, 2000)}
        `;

        const title = await llm.chatText(sys, prompt);
        // Robust cleaning: remove quotes and any accidental markdown artifacts
        const cleanTitle = title.trim()
            .replace(/^["'](.*)["']$/, '$1')
            .replace(/[#*_]/g, ''); 
            
        return NextResponse.json({ title: cleanTitle });
    } catch (error) {
        return NextResponse.json({ error: "Title generation failed" }, { status: 500 });
    }
}
