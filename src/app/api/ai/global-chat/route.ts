import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) return new Response("Unauthorized", { status: 401 });

        const { messages } = await req.json();

        const notes = await prisma.note.findMany({
            where: { userId: session.user.id },
            select: { title: true, sourceText: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });

        const availableTitles = notes.map(n => n.title).join(", ");
        const recentContext = notes.slice(0, 3).map(n => `[MEMORY_NODE: ${n.title}]\n${n.sourceText}`).join("\n\n---\n\n");

        const systemPrompt = `
            You are "Neural Assistant Pro", the user's centralized Master Tutor. 
            You have access to the user's "Neural Network" (Stored Memory Nodes).

            AVAILABLE MEMORY NODES: ${availableTitles || "None"}
            
            DETAILED CONTEXT (Recent/Relevant):
            ${recentContext || "No detailed context available yet."}
            
            GUIDELINES:
            1. SMART CONTEXT: You know the titles of all ${notes.length} notes. If the user asks about a title not in the 'DETAILED CONTEXT', inform them you see the note exists but need more specific focus.
            2. MULTI-NODE SYNTHESIS: Connect dots between detailed nodes.
            3. FORMATTING: Professional Markdown + LaTeX ($ inline, $$ block).
            4. SOURCE TAGGING: Mention node titles (e.g., "[Title]").
            5. UNKNOWN: If not in detailed context, answer generally with "[EXTERNAL] ".
            6. LANGUAGE: Match the user's language.
        `;

        const stream = await llm.chatStream(systemPrompt, messages);
        if (!stream) throw new Error("Neural link failed.");

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
}
