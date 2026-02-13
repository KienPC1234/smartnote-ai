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
            Task: Create a short, catchy, and professional title for the following content.
            Objective: The title should summarize the main topic in 3-7 words.
            Rules: Return ONLY the title text. No quotes, no intro.
            
            Content:
            ${sourceText.substring(0, 2000)}
        `;

        const title = await llm.chatText(sys, prompt);
        return NextResponse.json({ title: title.trim().replace(/^"(.*)"$/, '$1') });
    } catch (error) {
        return NextResponse.json({ error: "Title generation failed" }, { status: 500 });
    }
}
