import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";
import { SYSTEM_PROMPT, WEAKSPOTS_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user?.id) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const { quizResults, lang } = await req.json();

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

    const latestGen = await prisma.generation.findFirst({
        where: { noteId: note.id },
        orderBy: { createdAt: 'desc' }
    });

    if (!latestGen) return new Response("No generation found", { status: 404 });

    const sys = SYSTEM_PROMPT(lang || "en");
    if (!WEAKSPOTS_PROMPT) return new Response("WEAKSPOTS_PROMPT is missing", { status: 500 });

    const prompt = WEAKSPOTS_PROMPT
        .replace("{{SOURCE_TEXT}}", note.sourceText)
        .replace("{{QUIZ_RESULTS}}", JSON.stringify(quizResults, null, 2));

    // FORCE CLEAR old weakspots in DB before starting new analysis
    await prisma.generation.update({
        where: { id: latestGen.id },
        data: { weakspotsMd: null }
    });

    const encoder = new TextEncoder();
    let weakspotsMd = "";

    const stream = new ReadableStream({
        async start(controller) {
            const aiStream = await llm.chatStream(sys, [{ role: "user", content: prompt }]);
            if (!aiStream) {
                controller.close();
                return;
            }

            const reader = aiStream.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === "[DONE]") break;
                        try {
                            const content = JSON.parse(dataStr).choices?.[0]?.delta?.content || "";
                            weakspotsMd += content;
                            controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ chunk: content })}\n\n`));
                        } catch (e) {}
                    }
                }
            }

            // After stream finishes, update the database
            await prisma.generation.update({
                where: { id: latestGen.id },
                data: { weakspotsMd }
            });

            const finalGen = await prisma.generation.findUnique({ where: { id: latestGen.id } });
            controller.enqueue(encoder.encode(`event: final\ndata: ${JSON.stringify({ generation: finalGen })}\n\n`));
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
