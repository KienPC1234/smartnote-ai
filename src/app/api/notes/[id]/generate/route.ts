import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";
import { SYSTEM_PROMPT, OUTLINE_PROMPT, FLASHCARDS_PROMPT, QUIZ_PROMPT, INSIGHTS_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fillPrompt(template: string, sourceText: string, instructions: string = "") {
    return template
        .replace("{{SOURCE_TEXT}}", sourceText)
        .replace("{{USER_INSTRUCTIONS}}", instructions ? `USER REQUEST: ${instructions}` : "");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user?.id) return new Response("Unauthorized", { status: 401 });

    const { lang, targetType, userInstructions } = await req.json();
    const { id } = await params;
    const note = await prisma.note.findUnique({ where: { id } });

    if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: any) => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    isClosed = true;
                }
            };

            try {
                const sys = SYSTEM_PROMPT(lang || "en");
                const sourceText = note.sourceText;
                const isFullGen = !targetType || targetType === "all";

                let outlineMd = "";
                let flashcards: any[] = [];
                let quiz: any[] = [];

                // --- 1. OUTLINE ---
                if (!isClosed && (isFullGen || targetType === "outline")) {
                    send("status", { message: "Neural Mapping Structure...", progress: 10 });
                    const aiStream = await llm.chatStream(sys, [{ role: "user", content: fillPrompt(OUTLINE_PROMPT, sourceText, userInstructions) }]);
                    if (aiStream) {
                        const reader = aiStream.getReader();
                        const decoder = new TextDecoder();
                        while (true) {
                            if (isClosed) { await reader.cancel(); break; }
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
                                        outlineMd += content;
                                        send("outline_chunk", { chunk: content });
                                    } catch (e) {}
                                }
                            }
                        }
                    }
                    if (!isFullGen && !isClosed) {
                        const latestGen = await prisma.generation.findFirst({ where: { noteId: note.id }, orderBy: { createdAt: 'desc' } });
                        if (latestGen) await prisma.generation.update({ where: { id: latestGen.id }, data: { outlineMd } });
                        else await prisma.generation.create({ data: { noteId: note.id, model: "qwen3-vl:8b", outlineMd, flashcardsJson: "[]", quizJson: "[]" } });
                        send("final", { type: "outline", data: { outlineMd } });
                        isClosed = true; controller.close(); return;
                    }
                }

                // --- 2. FLASHCARDS ---
                if (!isClosed && (isFullGen || targetType === "flashcards")) {
                    send("status", { message: "Generating Active Recall Nodes...", progress: 40 });
                    const aiStream = await llm.chatStream(sys, [{ role: "user", content: fillPrompt(FLASHCARDS_PROMPT, sourceText, userInstructions) }]);
                    if (aiStream) {
                        const reader = aiStream.getReader();
                        const decoder = new TextDecoder();
                        let buffer = "";
                        while (true) {
                            if (isClosed) { await reader.cancel(); break; }
                            const { done, value } = await reader.read();
                            if (done) break;
                            buffer += decoder.decode(value, { stream: true });
                            while (buffer.includes("[FC]") && buffer.includes("[/FC]")) {
                                const start = buffer.indexOf("[FC]");
                                const end = buffer.indexOf("[/FC]");
                                try {
                                    const item = JSON.parse(buffer.substring(start + 4, end).trim());
                                    flashcards.push(item);
                                    send("fc_item", item);
                                } catch (e) {}
                                buffer = buffer.substring(end + 5);
                            }
                        }
                    }
                    if (!isFullGen && !isClosed) {
                        const latestGen = await prisma.generation.findFirst({ where: { noteId: note.id }, orderBy: { createdAt: 'desc' } });
                        if (latestGen) await prisma.generation.update({ where: { id: latestGen.id }, data: { flashcardsJson: JSON.stringify(flashcards) } });
                        send("final", { type: "flashcards", data: { flashcardsJson: JSON.stringify(flashcards) } });
                        isClosed = true; controller.close(); return;
                    }
                }

                // --- 3. QUIZ ---
                if (!isClosed && (isFullGen || targetType === "quiz")) {
                    send("status", { message: "Synthesizing Diagnostic Questions...", progress: 70 });
                    const aiStream = await llm.chatStream(sys, [{ role: "user", content: fillPrompt(QUIZ_PROMPT, sourceText, userInstructions) }]);
                    if (aiStream) {
                        const reader = aiStream.getReader();
                        const decoder = new TextDecoder();
                        let buffer = "";
                        while (true) {
                            if (isClosed) { await reader.cancel(); break; }
                            const { done, value } = await reader.read();
                            if (done) break;
                            buffer += decoder.decode(value, { stream: true });
                            while (buffer.includes("[QZ]") && buffer.includes("[/QZ]")) {
                                const start = buffer.indexOf("[QZ]");
                                const end = buffer.indexOf("[/QZ]");
                                try {
                                    const item = JSON.parse(buffer.substring(start + 4, end).trim());
                                    quiz.push(item);
                                    send("qz_item", item);
                                } catch (e) {}
                                buffer = buffer.substring(end + 5);
                            }
                        }
                    }
                    if (!isFullGen && !isClosed) {
                        const latestGen = await prisma.generation.findFirst({ where: { noteId: note.id }, orderBy: { createdAt: 'desc' } });
                        if (latestGen) await prisma.generation.update({ where: { id: latestGen.id }, data: { quizJson: JSON.stringify(quiz) } });
                        send("final", { type: "quiz", data: { quizJson: JSON.stringify(quiz) } });
                        isClosed = true; controller.close(); return;
                    }
                }

                // --- 4. FINALIZE ---
                if (!isClosed && isFullGen) {
                    send("status", { message: "Extracting Neural Insights...", progress: 95 });
                    const insights = await llm.chatJson(sys, fillPrompt(INSIGHTS_PROMPT, sourceText), "");
                    const gen = await prisma.generation.create({
                        data: {
                            noteId: note.id,
                            model: process.env.LLM_MODEL || "qwen3-vl:8b",
                            outlineMd,
                            flashcardsJson: JSON.stringify(flashcards),
                            quizJson: JSON.stringify(quiz),
                            weakspotsMd: "Analyze knowledge gaps after quiz.",
                            devilsAdvocateMd: insights.devils_advocate || null,
                            metaphorsMd: insights.metaphor || null,
                            connectionsMd: insights.cross_pollination || null,
                        }
                    });
                    send("final", { generation: gen });
                }

                if (!isClosed) {
                    isClosed = true;
                    controller.close();
                }
            } catch (error: any) {
                if (!isClosed) {
                    send("error", { message: error.message });
                    isClosed = true;
                    controller.close();
                }
            }
        },
        cancel() {
            isClosed = true;
        }
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}
