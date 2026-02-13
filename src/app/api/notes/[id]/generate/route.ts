import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";
import { SYSTEM_PROMPT, OUTLINE_PROMPT, FLASHCARDS_PROMPT, QUIZ_PROMPT, INSIGHTS_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

// --- HELPERS ---

function fillPrompt(template: string, sourceText: string, instructions: string = "") {
    return template
        .replace("{{SOURCE_TEXT}}", sourceText)
        .replace("{{USER_INSTRUCTIONS}}", instructions ? `USER REQUEST: ${instructions}` : "");
}

// Helper lấy nội dung trong tag (Regex an toàn hơn)
function extractTagContent(text: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}

function extractMultiTags(text: string, tagName: string): string[] {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    return Array.from(text.matchAll(regex), m => m[1].trim());
}

// Class quản lý việc gửi SSE an toàn
class StreamManager {
    private controller: ReadableStreamDefaultController;
    private encoder = new TextEncoder();
    public isClosed = false;

    constructor(controller: ReadableStreamDefaultController) {
        this.controller = controller;
    }

    send(event: string, data: any) {
        if (this.isClosed) return;
        try {
            const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            this.controller.enqueue(this.encoder.encode(msg));
        } catch (e) {
            // Đây là nơi fix lỗi "Controller is already closed"
            // Nếu controller đã đóng (client ngắt kết nối), ta đánh dấu flag và dừng lại.
            this.isClosed = true;
            console.warn("[StreamManager] Controller closed, stopping send.");
        }
    }

    close() {
        if (!this.isClosed) {
            this.isClosed = true;
            try { this.controller.close(); } catch(e) {}
        }
    }
}

// --- MAIN API ---

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log("[AI_GENERATE] Request received");

    try {
        const session = await auth();
        if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

        // Parse body
        const body = await req.json();
        const { lang, targetType, userInstructions } = body;
        const { id } = await params;

        const note = await prisma.note.findUnique({
            where: { id },
            include: { generations: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

        // Init Data
        let currentGen = note.generations[0];
        if (!currentGen) {
            currentGen = await prisma.generation.create({
                data: {
                    noteId: note.id,
                    model: process.env.LLM_MODEL || "qwen3-vl:8b",
                    outlineMd: "",
                    flashcardsJson: "[]",
                    quizJson: "[]"
                }
            });
        }

        const state = {
            outline: currentGen.outlineMd || "",
            flashcards: JSON.parse(currentGen.flashcardsJson || "[]") as any[],
            quiz: JSON.parse(currentGen.quizJson || "[]") as any[],
            insights: {
                da: currentGen.devilsAdvocateMd || "",
                meta: currentGen.metaphorsMd || "",
                cp: currentGen.connectionsMd || ""
            }
        };

        const sysPrompt = SYSTEM_PROMPT(lang || "en");
        const isFullGen = !targetType || targetType === "all";

        const stream = new ReadableStream({
            async start(controller) {
                const manager = new StreamManager(controller);

                try {
                    // --- PHASE 1: OUTLINE ---
                    if (isFullGen || targetType === "outline") {
                        manager.send("status", { message: "Generating Outline...", progress: 10 });
                        manager.send("section_start", { section: "outline" });

                        let newOutline = "";
                        await streamLLM(
                            sysPrompt,
                            fillPrompt(OUTLINE_PROMPT, note.sourceText, userInstructions),
                            manager,
                            (chunk) => {
                                newOutline += chunk;
                                manager.send("outline_chunk", { chunk });
                            }
                        );
                        
                        state.outline = newOutline;
                        manager.send("section_end", { section: "outline" });
                    }

                    // --- PHASE 2: FLASHCARDS ---
                    if (!manager.isClosed && (isFullGen || targetType === "flashcards")) {
                        manager.send("status", { message: "Generating Flashcards...", progress: 40 });
                        manager.send("section_start", { section: "flashcards" });

                        let buffer = "";
                        let fcIndex = state.flashcards.length;

                        await streamLLM(
                            sysPrompt,
                            fillPrompt(FLASHCARDS_PROMPT, note.sourceText, userInstructions),
                            manager,
                            (chunk) => {
                                buffer += chunk;
                                // Regex tìm thẻ <fc> trọn vẹn
                                const regex = /<fc>([\s\S]*?)<\/fc>/gi;
                                let match;
                                while ((match = regex.exec(buffer)) !== null) {
                                    const inner = match[1];
                                    const front = extractTagContent(inner, "front");
                                    const back = extractTagContent(inner, "back");
                                    
                                    if (front && back) {
                                        fcIndex++;
                                        const card = { id: `fc-${Date.now()}-${fcIndex}`, front, back };
                                        state.flashcards.push(card);
                                        manager.send("fc_item", { ...card, index: fcIndex });
                                    }
                                }
                                // Dọn dẹp buffer: Chỉ giữ lại phần cuối chưa đóng thẻ
                                const lastTagIndex = buffer.lastIndexOf("<fc>");
                                if (lastTagIndex > -1 && !buffer.includes("</fc>", lastTagIndex)) {
                                    buffer = buffer.slice(lastTagIndex);
                                } else {
                                    // Giữ lại 50 ký tự cuối để đề phòng cắt giữa chừng tag <f...
                                    buffer = buffer.slice(-50); 
                                }
                            }
                        );
                        manager.send("section_end", { section: "flashcards" });
                    }

                    // --- PHASE 3: QUIZ ---
                    if (!manager.isClosed && (isFullGen || targetType === "quiz")) {
                        manager.send("status", { message: "Generating Quiz...", progress: 70 });
                        manager.send("section_start", { section: "quiz" });

                        let buffer = "";
                        let qzIndex = state.quiz.length;

                        await streamLLM(
                            sysPrompt,
                            fillPrompt(QUIZ_PROMPT, note.sourceText, userInstructions),
                            manager,
                            (chunk) => {
                                buffer += chunk;
                                const regex = /<qz>([\s\S]*?)<\/qz>/gi;
                                let match;
                                while ((match = regex.exec(buffer)) !== null) {
                                    const inner = match[1];
                                    const question = extractTagContent(inner, "question");
                                    const options = extractMultiTags(inner, "o");
                                    const answer = extractTagContent(inner, "answer");
                                    const explanation = extractTagContent(inner, "explanation");

                                    if (question && options.length > 0 && answer) {
                                        qzIndex++;
                                        const ansIdx = options.findIndex(o => o.trim() === answer.trim());
                                        const item = {
                                            id: `qz-${Date.now()}-${qzIndex}`,
                                            question,
                                            choices: options,
                                            answer_index: ansIdx !== -1 ? ansIdx : 0,
                                            explanation
                                        };
                                        state.quiz.push(item);
                                        manager.send("qz_item", { ...item, index: qzIndex });
                                    }
                                }
                                const lastTagIndex = buffer.lastIndexOf("<qz>");
                                if (lastTagIndex > -1 && !buffer.includes("</qz>", lastTagIndex)) {
                                    buffer = buffer.slice(lastTagIndex);
                                } else {
                                    buffer = buffer.slice(-50);
                                }
                            }
                        );
                        manager.send("section_end", { section: "quiz" });
                    }

                    // --- PHASE 4: INSIGHTS ---
                    if (!manager.isClosed && (isFullGen || targetType === "insights")) {
                        manager.send("status", { message: "Generating Insights...", progress: 90 });
                        manager.send("section_start", { section: "insights" });

                        let buffer = "";
                        await streamLLM(
                            sysPrompt,
                            fillPrompt(INSIGHTS_PROMPT, note.sourceText, userInstructions),
                            manager,
                            (chunk) => {
                                buffer += chunk;
                                const da = extractTagContent(buffer, "da");
                                const meta = extractTagContent(buffer, "meta");
                                const cp = extractTagContent(buffer, "cp");

                                if (da && da !== state.insights.da) {
                                    state.insights.da = da;
                                    manager.send("insight_item", { type: "da", content: da });
                                }
                                if (meta && meta !== state.insights.meta) {
                                    state.insights.meta = meta;
                                    manager.send("insight_item", { type: "meta", content: meta });
                                }
                                if (cp && cp !== state.insights.cp) {
                                    state.insights.cp = cp;
                                    manager.send("insight_item", { type: "cp", content: cp });
                                }
                            }
                        );
                        manager.send("section_end", { section: "insights" });
                    }

                    // --- FINAL: UPDATE DB ---
                    if (!manager.isClosed) {
                        const updatedGen = await prisma.generation.update({
                            where: { id: currentGen.id },
                            data: {
                                outlineMd: state.outline,
                                flashcardsJson: JSON.stringify(state.flashcards),
                                quizJson: JSON.stringify(state.quiz),
                                devilsAdvocateMd: state.insights.da,
                                metaphorsMd: state.insights.meta,
                                connectionsMd: state.insights.cp,
                            }
                        });
                        manager.send("final", { generation: updatedGen });
                    }

                } catch (error: any) {
                    console.error("Stream Error:", error);
                    manager.send("error", { message: error.message || "Unknown error" });
                } finally {
                    manager.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// --- CORE LLM STREAMING HELPER (Đã Fix Buffer) ---
async function streamLLM(
    sysPrompt: string, 
    userContent: string, 
    manager: StreamManager,
    onChunk: (content: string) => void
) {
    if (manager.isClosed) return;

    try {
        const aiStream = await llm.chatStream(sysPrompt, [{ role: "user", content: userContent }]);
        if (!aiStream) throw new Error("LLM returned no stream");

        const reader = aiStream.getReader();
        const decoder = new TextDecoder();
        
        // BUFFER QUAN TRỌNG: Lưu các mảnh vỡ của dòng
        let buffer = ""; 

        while (true) {
            if (manager.isClosed) {
                await reader.cancel();
                break;
            }
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // Nối chunk mới vào buffer cũ
            buffer += chunk;
            
            // Tách thành các dòng
            const lines = buffer.split("\n");
            
            // GIỮ LẠI dòng cuối cùng trong buffer (vì dòng cuối có thể chưa hoàn thiện)
            // Ví dụ: "data: {"con" ... (hết chunk)" -> dòng này phải chờ chunk sau
            buffer = lines.pop() || ""; 

            for (const line of lines) {
                if (line.trim().startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "").trim();
                    if (dataStr === "[DONE]") return;
                    
                    try {
                        const parsed = JSON.parse(dataStr);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        // Nếu vẫn lỗi parse JSON ở đây thì là do provider trả về rác, 
                        // nhưng logic lines.pop() đã fix được 99% trường hợp.
                    }
                }
            }
        }
    } catch (e) {
        console.error("LLM Stream function error:", e);
        throw e;
    }
}