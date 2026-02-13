import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) return new Response("Unauthorized", { status: 401 });

        const { id } = await params;
        const { messages } = await req.json(); // Array of { role, content, images? }

        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

        // Map legacy "bot" role to "assistant" just in case client still sends it
        const formattedMessages = messages.map((m: any) => ({
            ...m,
            role: m.role === "bot" ? "assistant" : m.role
        }));

        const systemPrompt = `
            You are "Study Buddy", a helpful AI tutor for the student.
            Context: The student is studying the following notes:
            ---
            ${note.sourceText}
            ---
            Rules:
            1. Answer questions ONLY based on the context above or the images provided.
            2. If images are uploaded, describe what you see and connect it to the notes if possible.
            3. If the answer isn't in the notes/images, say you don't know but try to guide them based on general knowledge if it's related.
            4. Keep answers concise, encouraging, and clear.
            5. Use the same language as the user's question.
        `;

        const stream = await llm.chatStream(systemPrompt, formattedMessages);
        if (!stream) return new Response("Failed to establish neural link.", { status: 500 });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    } catch (error: any) {
        console.error("[CHAT_STREAM_ERROR]", error);
        return new Response(error.message, { status: 500 });
    }
}
