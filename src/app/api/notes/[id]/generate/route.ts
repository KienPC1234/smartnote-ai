import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { llm } from "@/lib/llm";
import {
  normalizeLang,
  SYSTEM_PROMPT,
  OUTLINE_PROMPT,
  FLASHCARDS_PROMPT,
  QUIZ_PROMPT,
  INSIGHTS_PROMPT,
  WEAKSPOTS_PROMPT,
  type Lang,
} from "@/lib/prompts";

import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// -------------------- ENV FLAGS --------------------

const AI_DEBUG = process.env.AI_DEBUG === "1"; // bật ghi file /logs
const AI_DEBUG_DIR = process.env.AI_DEBUG_DIR || "logs";
const FILTER_HAN = process.env.FILTER_HAN !== "0"; // mặc định ON

// -------------------- HELPERS --------------------

function fillPrompt(template: string, sourceText: string, instructions: string = "") {
  return template
    .replace("{{SOURCE_TEXT}}", sourceText)
    .replace("{{USER_INSTRUCTIONS}}", instructions ? `YÊU CẦU NGƯỜI DÙNG: ${instructions}` : "");
}

function fillWeakspots(template: string, sourceText: string, quizResults: string) {
  return template
    .replace("{{SOURCE_TEXT}}", sourceText)
    .replace("{{QUIZ_RESULTS}}", quizResults || "");
}

function extractTagContent(text: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractMultiTags(text: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return Array.from(text.matchAll(regex), (m) => m[1].trim());
}

function cleanRawOutput(text: string): string {
  return text.replace(/```xml/gi, "").replace(/```html/gi, "").replace(/```/g, "").trim();
}

// Lọc chữ Hán (Han script) trên content (không đụng vào tag)
function stripHanChars(input: string) {
  if (!FILTER_HAN) return input;
  return input.replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, "");
}

// Stop sequences để giảm preface / fence
function getStopForTarget(targetType?: string) {
  const common = ["```", "Okay", "Here are", "important notes", "limitations", "verification"];
  if (targetType === "outline" || targetType === "weakspots") return ["```"];
  return common;
}

// -------------------- LOG HELPERS (TRUNCATE SOURCE) --------------------

function shortenTextForLog(text: string, maxChars: number) {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + `\n...[TRUNCATED ${t.length - maxChars} chars]...`;
}

// Cắt phần SOURCE trong prompt khi log để file đỡ khổng lồ
function redactSourceInPromptForLog(prompt: string, maxSourceChars = 2500) {
  const marker = "\nSOURCE:\n";
  const idx = prompt.indexOf(marker);
  if (idx === -1) return shortenTextForLog(prompt, 12000);

  const before = prompt.slice(0, idx + marker.length);
  const after = prompt.slice(idx + marker.length);

  const breaks = [
    "\n\nUSER INSTRUCTIONS:",
    "\n\nYÊU CẦU NGƯỜI DÙNG:",
    "\n\nQUIZ HISTORY:",
    "\n\nQUIZ RESULTS:",
  ];

  let nextBreak = -1;
  for (const b of breaks) {
    const p = after.indexOf(b);
    if (p !== -1 && (nextBreak === -1 || p < nextBreak)) nextBreak = p;
  }

  if (nextBreak === -1) {
    return before + shortenTextForLog(after, maxSourceChars);
  }

  const sourcePart = after.slice(0, nextBreak);
  const tail = after.slice(nextBreak);

  return before + shortenTextForLog(sourcePart, maxSourceChars) + tail;
}

// -------------------- LOG WRITER (EASY READ) --------------------

class DebugLog {
  private enabled: boolean;
  private filePath: string | null = null;

  private blocks: string[] = [];
  private transcriptBySection: Record<string, string> = {};
  private flushEveryChars = 25_000;
  private maxSectionTranscript = 250_000;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  async init(meta: { noteId: string; userId: string; targetType: string; model?: string; lang: Lang }) {
    if (!this.enabled) return;

    const dir = path.resolve(process.cwd(), AI_DEBUG_DIR);
    await fs.mkdir(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.filePath = path.join(dir, `ai-${meta.noteId}-${meta.targetType}-${stamp}.log`);

    const header =
      `=== AI DEBUG LOG ===\n` +
      `time=${new Date().toISOString()}\n` +
      `noteId=${meta.noteId}\n` +
      `userId=${meta.userId}\n` +
      `targetType=${meta.targetType}\n` +
      `lang=${meta.lang}\n` +
      `model=${meta.model || ""}\n` +
      `FILTER_HAN=${FILTER_HAN}\n` +
      `AI_DEBUG_DIR=${AI_DEBUG_DIR}\n\n`;

    await fs.writeFile(this.filePath, header, "utf8");
  }

  async writeBlock(title: string, content: string) {
    if (!this.enabled || !this.filePath) return;
    this.blocks.push(`\n[${title}]\n${content}\n`);
    await this.maybeFlush();
  }

  appendSection(section: string, text: string) {
    if (!this.enabled || !this.filePath) return;
    const cur = this.transcriptBySection[section] || "";
    let next = cur + text;
    if (next.length > this.maxSectionTranscript) {
      next = next.slice(-Math.floor(this.maxSectionTranscript * 0.7));
    }
    this.transcriptBySection[section] = next;
  }

  async flushSection(section: string) {
    if (!this.enabled || !this.filePath) return;
    const t = this.transcriptBySection[section];
    if (!t) return;
    this.blocks.push(`\n[AI_TRANSCRIPT:${section}]\n${t}\n`);
    this.transcriptBySection[section] = "";
    await this.maybeFlush(true);
  }

  private async maybeFlush(force = false) {
    if (!this.enabled || !this.filePath) return;

    const blocksSize = this.blocks.reduce((a, b) => a + b.length, 0);
    if (!force && blocksSize < this.flushEveryChars) return;

    const payload = this.blocks.join("");
    this.blocks = [];
    if (payload) await fs.appendFile(this.filePath, payload, "utf8");
  }

  async flushAll() {
    if (!this.enabled || !this.filePath) return;
    for (const k of Object.keys(this.transcriptBySection)) {
      await this.flushSection(k);
    }
    await this.maybeFlush(true);
  }
}

// -------------------- STREAM MANAGER (SSE) --------------------

class StreamManager {
  private controller: ReadableStreamDefaultController;
  private encoder = new TextEncoder();
  public isClosed = false;
  private warned = false;

  constructor(controller: ReadableStreamDefaultController) {
    this.controller = controller;
  }

  send(event: string, data: any) {
    if (this.isClosed) return;
    try {
      const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(msg));
    } catch {
      this.isClosed = true;
      if (!this.warned) {
        this.warned = true;
        console.warn("[StreamManager] Controller closed (client disconnected).");
      }
    }
  }

  close() {
    if (!this.isClosed) {
      this.isClosed = true;
      try {
        this.controller.close();
      } catch {}
    }
  }
}

// -------------------- PARSERS --------------------

type Flashcard = { id: string; front: string; back: string };
type QuizItem = { id: string; question: string; choices: string[]; answer_index: number; explanation: string };

/**
 * Cố gắng trích xuất các object hoàn chỉnh từ một chuỗi bắt đầu bằng '[' (JSON array)
 * Sử dụng thuật toán đếm ngoặc nhọn để phát hiện object hoàn chỉnh trong stream.
 */
function parseJsonArrayStep(buffer: string): { items: any[]; rest: string } {
  const items: any[] = [];
  let currentBuffer = buffer.trim();
  
  // Tìm điểm bắt đầu của mảng nếu chưa thấy
  if (!currentBuffer.includes('[') && !currentBuffer.startsWith('{')) {
    const firstBrace = currentBuffer.indexOf('{');
    if (firstBrace === -1) return { items: [], rest: buffer };
    currentBuffer = currentBuffer.slice(firstBrace);
  } else if (currentBuffer.startsWith('[')) {
    // Nếu buffer bắt đầu bằng '[', ta bỏ qua nó để tìm các '{'
    const firstBrace = currentBuffer.indexOf('{');
    if (firstBrace === -1) return { items: [], rest: buffer };
    currentBuffer = currentBuffer.slice(firstBrace);
  }

  let braceCount = 0;
  let startIdx = -1;
  let lastParsedIdx = 0;

  for (let i = 0; i < currentBuffer.length; i++) {
    if (currentBuffer[i] === '{') {
      if (braceCount === 0) startIdx = i;
      braceCount++;
    } else if (currentBuffer[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIdx !== -1) {
        const potentialObj = currentBuffer.slice(startIdx, i + 1);
        try {
          const obj = JSON.parse(potentialObj);
          items.push(obj);
          lastParsedIdx = i + 1;
        } catch (e) {
          // Malformed hoặc nested phức tạp, đợi thêm dữ liệu
        }
      }
    }
  }

  // Phần còn lại là phần chưa parse được (có thể là object đang dang dở)
  let rest = currentBuffer.slice(lastParsedIdx).trim();
  // Xử lý dấu phẩy giữa các object trong array
  if (rest.startsWith(',')) rest = rest.slice(1).trim();

  return { items, rest };
}

function parseFlashcardsFromBuffer(buffer: string): { items: Omit<Flashcard, "id">[]; rest: string } {
  const { items, rest } = parseJsonArrayStep(buffer);
  const valid = items.filter(it => it.front && it.back);
  return { items: valid, rest };
}

function parseQuizFromBuffer(buffer: string): { items: Omit<QuizItem, "id">[]; rest: string } {
  const { items, rest } = parseJsonArrayStep(buffer);
  const valid: Omit<QuizItem, "id">[] = [];

  for (const it of items) {
    if (it.question && Array.isArray(it.choices) && it.choices.length === 4 && it.answer) {
      const choices = it.choices.map((c: any) => String(c));
      const ansIdx = choices.findIndex((c: string) => c.trim() === String(it.answer).trim());
      if (ansIdx !== -1) {
        valid.push({
          question: String(it.question),
          choices: choices,
          answer_index: ansIdx,
          explanation: String(it.explanation || "")
        });
      }
    }
  }
  return { items: valid, rest };
}

function parseInsightsFromBuffer(buffer: string): { da: string, meta: string, cp: string } {
  const clean = cleanRawOutput(buffer);
  
  const extractPartialKey = (key: string) => {
    // Tìm "key": "
    const startReg = new RegExp(`"${key}"\\s*:\\s*"`, "i");
    const startMatch = clean.match(startReg);
    if (!startMatch) return "";
    
    const startIdx = startMatch.index! + startMatch[0].length;
    const rest = clean.slice(startIdx);
    
    // Tìm dấu ngoặc kép kết thúc (không bị escape - đơn giản hóa)
    const endIdx = rest.indexOf('"');
    if (endIdx === -1) return rest; 
    return rest.slice(0, endIdx);
  };

  return {
    da: extractPartialKey("da"),
    meta: extractPartialKey("meta"),
    cp: extractPartialKey("cp")
  };
}

// -------------------- LLM STREAM (FIX: AWAIT onDelta) --------------------

async function streamLLM(
  sysPrompt: string,
  userPrompt: string,
  manager: StreamManager,
  onDelta: (text: string) => void | Promise<void>,
  dbg: DebugLog,
  meta: { section: string; targetType: string; temperature?: number; top_p?: number }
) {
  const stop = getStopForTarget(meta.targetType);

  if (AI_DEBUG) {
    await dbg.writeBlock("SYS_PROMPT", sysPrompt);
    await dbg.writeBlock("USER_PROMPT", redactSourceInPromptForLog(userPrompt, 2500));
  }

  const aiStream = await llm.chatStream(
    sysPrompt,
    [{ role: "user", content: userPrompt }],
    {
      stop,
      temperature: meta.temperature ?? 0.2,
      top_p: meta.top_p ?? 0.9,
    }
  );

  const reader = aiStream.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = "";

  while (true) {
    if (manager.isClosed) {
      try {
        await reader.cancel();
      } catch {}
      break;
    }

    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") return;

      try {
        const parsed = JSON.parse(dataStr);
        let content = parsed.choices?.[0]?.delta?.content ?? "";
        if (!content) continue;

        content = stripHanChars(content);

        if (AI_DEBUG) dbg.appendSection(meta.section, content);

        // FIX RACE: await để parsing kịp, không bị mất <fc>/<qz>
        await onDelta(content);
      } catch {
        // ignore
      }
    }
  }
}

// -------------------- ROUTE --------------------

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log("[AI_GENERATE] Request received");

  try {
    const session = await auth();
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { lang, targetType, userInstructions } = body;

    const langNorm = normalizeLang(lang);
    const { id } = await params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: { generations: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!note || note.userId !== session.user.id) return new Response("Not found", { status: 404 });

    let currentGen = note.generations[0];
    if (!currentGen) {
      currentGen = await prisma.generation.create({
        data: {
          noteId: note.id,
          model: process.env.LLM_MODEL || "",
          outlineMd: "",
          flashcardsJson: "[]",
          quizJson: "[]",
        },
      });
    }

    const state = {
      outline: currentGen.outlineMd || "",
      flashcards: JSON.parse(currentGen.flashcardsJson || "[]") as any[],
      quiz: JSON.parse(currentGen.quizJson || "[]") as any[],
      insights: {
        da: currentGen.devilsAdvocateMd || "",
        meta: currentGen.metaphorsMd || "",
        cp: currentGen.connectionsMd || "",
      },
    };

    const sysPrompt = SYSTEM_PROMPT(langNorm);
    const isFullGen = !targetType || targetType === "all";

    const dbg = new DebugLog(AI_DEBUG);
    await dbg.init({
      noteId: note.id,
      userId: session.user.id,
      targetType: targetType || "all",
      model: process.env.LLM_MODEL || "",
      lang: langNorm,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const manager = new StreamManager(controller);

        // client abort => đóng stream
        const onAbort = () => {
          manager.close();
        };
        req.signal.addEventListener("abort", onAbort);

        try {
          // -------- OUTLINE --------
          if (isFullGen || targetType === "outline") {
            manager.send("status", { message: "Generating Outline...", progress: 10 });
            manager.send("section_start", { section: "outline" });

            let outline = "";
            const userPrompt = fillPrompt(OUTLINE_PROMPT(langNorm), note.sourceText, userInstructions);

            await streamLLM(
              sysPrompt,
              userPrompt,
              manager,
              (delta) => {
                outline += delta;
                manager.send("outline_chunk", { chunk: delta });
              },
              dbg,
              { section: "outline", targetType: "outline" }
            );

            state.outline = outline.trim();
            manager.send("section_end", { section: "outline" });
            await dbg.flushSection("outline");
          }

          // -------- FLASHCARDS --------
          if (!manager.isClosed && (isFullGen || targetType === "flashcards")) {
            manager.send("status", { message: "Generating Flashcards...", progress: 40 });
            manager.send("section_start", { section: "flashcards" });

            let buffer = "";
            let fcIndex = state.flashcards.length;

            const userPrompt = fillPrompt(FLASHCARDS_PROMPT(langNorm), note.sourceText, userInstructions);

            await streamLLM(
              sysPrompt,
              userPrompt,
              manager,
              async (delta) => {
                // ✅ trả về AI thô cho client (để debug UI/stream)
                manager.send("flashcards_chunk", { chunk: delta });

                buffer += delta;

                const parsed = parseFlashcardsFromBuffer(buffer);
                buffer = parsed.rest;

                for (const it of parsed.items) {
                  fcIndex++;
                  const card = { id: `fc-${Date.now()}-${fcIndex}`, front: it.front, back: it.back };
                  state.flashcards.push(card);
                  manager.send("fc_item", { ...card, index: fcIndex });

                  if (AI_DEBUG) await dbg.writeBlock("PARSED_FC", JSON.stringify(card, null, 2));
                }
              },
              dbg,
              { section: "flashcards", targetType: "flashcards" }
            );

            manager.send("section_end", { section: "flashcards" });
            await dbg.flushSection("flashcards");
          }

          // -------- QUIZ --------
          if (!manager.isClosed && (isFullGen || targetType === "quiz")) {
            manager.send("status", { message: "Generating Quiz...", progress: 70 });
            manager.send("section_start", { section: "quiz" });

            let buffer = "";
            let qzIndex = state.quiz.length;

            const userPrompt = fillPrompt(QUIZ_PROMPT(langNorm), note.sourceText, userInstructions);

            await streamLLM(
              sysPrompt,
              userPrompt,
              manager,
              async (delta) => {
                // ✅ trả về AI thô cho client (để debug)
                manager.send("quiz_chunk", { chunk: delta });

                buffer += delta;

                const parsed = parseQuizFromBuffer(buffer);
                buffer = parsed.rest;

                for (const it of parsed.items) {
                  qzIndex++;
                  const item: QuizItem = { ...it, id: `qz-${Date.now()}-${qzIndex}` };
                  state.quiz.push(item);
                  manager.send("qz_item", { ...item, index: qzIndex });

                  if (AI_DEBUG) await dbg.writeBlock("PARSED_QZ", JSON.stringify(item, null, 2));
                }
              },
              dbg,
              { section: "quiz", targetType: "quiz" }
            );

            manager.send("section_end", { section: "quiz" });
            await dbg.flushSection("quiz");
          }

          // -------- INSIGHTS --------
          if (!manager.isClosed && (isFullGen || targetType === "insights")) {
            manager.send("status", { message: "Generating Insights...", progress: 90 });
            manager.send("section_start", { section: "insights" });

            let buffer = "";
            const userPrompt = fillPrompt(INSIGHTS_PROMPT(langNorm), note.sourceText, userInstructions);

            await streamLLM(
              sysPrompt,
              userPrompt,
              manager,
              (delta) => {
                manager.send("insights_chunk", { chunk: delta });

                buffer += delta;
                const insights = parseInsightsFromBuffer(buffer);

                if (insights.da && insights.da !== state.insights.da) {
                  state.insights.da = insights.da;
                  manager.send("insight_item", { type: "da", content: insights.da });
                }
                if (insights.meta && insights.meta !== state.insights.meta) {
                  state.insights.meta = insights.meta;
                  manager.send("insight_item", { type: "meta", content: insights.meta });
                }
                if (insights.cp && insights.cp !== state.insights.cp) {
                  state.insights.cp = insights.cp;
                  manager.send("insight_item", { type: "cp", content: insights.cp });
                }
              },
              dbg,
              { section: "insights", targetType: "insights" }
            );

            manager.send("section_end", { section: "insights" });
            await dbg.flushSection("insights");
          }

          // -------- WEAKSPOTS (optional) --------
          if (!manager.isClosed && targetType === "weakspots") {
            manager.send("status", { message: "Generating Weakspots...", progress: 85 });
            manager.send("section_start", { section: "weakspots" });

            const quizHistoryStr = shortenTextForLog(JSON.stringify(state.quiz || [], null, 2), 40_000);
            const userPrompt = fillWeakspots(WEAKSPOTS_PROMPT(langNorm), note.sourceText, quizHistoryStr);

            let weakMd = "";
            await streamLLM(
              sysPrompt,
              userPrompt,
              manager,
              (delta) => {
                weakMd += delta;
                manager.send("weakspots_chunk", { chunk: delta });
              },
              dbg,
              { section: "weakspots", targetType: "weakspots" }
            );

            manager.send("section_end", { section: "weakspots" });
            await dbg.flushSection("weakspots");
          }

          // -------- FINAL: UPDATE DB --------
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
              },
            });

            if (AI_DEBUG) {
              await dbg.writeBlock("FINAL_STATE", shortenTextForLog(JSON.stringify(state, null, 2), 80_000));
              await dbg.flushAll();
            }

            manager.send("final", { generation: updatedGen });
          }
        } catch (error: any) {
          console.error("[STREAM_ERROR]", error);
          if (AI_DEBUG) {
            await dbg.writeBlock("ERROR", String(error?.message || error));
            await dbg.flushAll();
          }
          manager.send("error", { message: error?.message || "Unknown error" });
        } finally {
          req.signal.removeEventListener("abort", onAbort);
          if (AI_DEBUG) await dbg.flushAll();
          manager.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), { status: 500 });
  }
}
