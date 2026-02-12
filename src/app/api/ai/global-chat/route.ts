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
            select: { title: true, sourceText: true },
            take: 10 // Tăng lên 10 nodes để AI có nhiều context hơn
        });

        const context = notes.map(n => `[MEMORY_NODE: ${n.title}]\n${n.sourceText}`).join("\n\n---\n\n");

        const systemPrompt = `
            You are "Neural Assistant Pro", the user's centralized Master Tutor. 
            You have real-time access to the user's "Neural Network" (Stored Memory Nodes).

            CURRENT NEURAL CONTEXT:
            ${context || "Empty. The student has not initialized any memory nodes yet."}
            
            GUIDELINES:
            1. MULTI-NODE SYNTHESIS: If the question relates to multiple notes, connect the dots.
            2. FORMATTING: Use professional Markdown (tables, bold, lists).
            3. MATH/SCIENCE: Use LaTeX ($ for inline, $$ for block).
            4. TONE: Intelligent, concise, and helpful. 
            5. SOURCE TAGGING: When using information from a node, mention it (e.g., "According to your notes on [Title]...").
            6. UNKNOWN DATA: If not in notes, answer using general expertise but preface with "[EXTERNAL] ".
            7. LANGUAGE: Always respond in the language used by the user.
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
