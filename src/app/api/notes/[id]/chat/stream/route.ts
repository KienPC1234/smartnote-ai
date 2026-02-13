import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user?.id) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const { messages } = await req.json(); // Array of { role, content, images? }

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const aiStream = await llm.chatStream(systemPrompt, messages);
            if (!aiStream) {
                controller.close();
                return;
            }

            const reader = aiStream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
            }
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}
