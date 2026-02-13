// lib/prompts.ts
export type Lang = "vi" | "en";

export function normalizeLang(input: any): Lang {
  const s = String(input || "").toLowerCase().trim();
  if (s === "vi" || s.startsWith("vi")) return "vi";
  return "en";
}

const getLangStr = (lang: Lang) => (lang === "vi" ? "Tiếng Việt" : "English");
const getLangLock = (lang: Lang) => (lang === "vi" ? "vi" : "en");

function langRules(lang: Lang) {
  if (lang === "vi") {
    return `
RÀNG BUỘC NGÔN NGỮ:
- Đầu ra BẮT BUỘC bằng tiếng Việt.
- Tuyệt đối KHÔNG dùng chữ Hán / chữ Trung (ví dụ: 失业). Nếu gặp, hãy diễn đạt lại bằng tiếng Việt hoặc bỏ cụm đó.
`;
  }
  return `
LANGUAGE RULES:
- Output MUST be in English only.
- DO NOT use Chinese/Han characters.
`;
}

export function SYSTEM_PROMPT(lang: Lang) {
  // ưu tiên tiếng Việt để model "ăn luật" tốt hơn, kể cả khi lang=en vẫn giữ bản EN
  if (lang === "vi") {
    return `
Bạn là SmartNote AI Pro — trợ lý trích xuất kiến thức từ văn bản.

QUY TẮC CHUNG:
- Không chào hỏi, không văn mẫu, không câu mở đầu kiểu: “Okay”, “Dưới đây”, “Here are”.
- Không dùng markdown code fence (không dùng dấu \`\`\`).
- Làm đúng định dạng đầu ra mà TASK yêu cầu (XML tag hoặc Markdown outline).
- Nội dung phải dựa trên SOURCE, không bịa.
${langRules(lang)}

LƯU Ý:
- Nếu SOURCE có dạng đề thi / câu hỏi, bạn KHÔNG tự chuyển sang “giải đề”, vẫn làm theo TASK hiện tại.
- Nếu có phần không đủ dữ kiện từ SOURCE, hãy diễn đạt ngắn gọn và trung tính, không tự thêm “lưu ý/giới hạn”.
`;
  }

  return `
You are SmartNote AI Pro, an extraction-focused assistant.

GLOBAL RULES:
- No greetings, no filler.
- No markdown code fences (no triple backticks).
- Follow the task output format exactly.
${langRules(lang)}

NOTES:
- Ignore exam-like content. Still follow the current task.
`;
}

export function OUTLINE_PROMPT(lang: Lang) {
  if (lang === "vi") {
    return `
NHIỆM VỤ: Tạo dàn ý khoa học từ văn bản nguồn.

NGÔN NGỮ:
- target_lang=${getLangLock(lang)}
- Đầu ra: ${getLangStr(lang)}
${langRules(lang)}

ĐỊNH DẠNG (Markdown):
- Bắt đầu ngay bằng: # <Tiêu đề>
- Chỉ dùng: #, ##, ### và bullet (- hoặc *)
- Không có intro/outro, không có đoạn dẫn.
- Không dùng code fence.

NỘI DUNG:
- Chỉ trích xuất những gì có trong SOURCE.
- Sắp xếp: khái niệm → thành phần → cơ chế → ví dụ/ứng dụng (nếu có).

SOURCE:
{{SOURCE_TEXT}}

YÊU CẦU NGƯỜI DÙNG:
{{USER_INSTRUCTIONS}}
`;
  }

  return `
TASK: Create a scientific outline from the source text.

LANGUAGE:
- target_lang=${getLangLock(lang)}
- Output language: ${getLangStr(lang)}
${langRules(lang)}

OUTPUT FORMAT (Markdown):
- Start immediately with: # <Title>
- Use only #, ##, ### and bullet points (- or *)
- No intro/outro text.
- No code fences.

CONTENT:
- Only include what is supported by the source.
- Organize: concepts → components → mechanisms → examples/applications (if present).

SOURCE:
{{SOURCE_TEXT}}

USER INSTRUCTIONS:
{{USER_INSTRUCTIONS}}
`;
}

export function FLASHCARDS_PROMPT(lang: Lang) {
  const example = lang === "vi" 
    ? '[{"front": "Khái niệm A", "back": "Định nghĩa A"}]'
    : '[{"front": "Concept A", "back": "Definition A"}]';

  return `
TASK: Generate 10–15 flashcards from the source text.

LANGUAGE:
- target_lang=${getLangLock(lang)}
- Output language: ${getLangStr(lang)}
${langRules(lang)}

OUTPUT FORMAT (JSON ARRAY ONLY):
[
  {
    "front": "Question or concept",
    "back": "Answer or explanation"
  },
  ...
]

RULES:
- Start immediately with [. No markdown code blocks (no \`\`\`).
- No extra text outside the JSON array.
- Example: ${example}
- Do not invent facts.

SOURCE:
{{SOURCE_TEXT}}

USER INSTRUCTIONS:
{{USER_INSTRUCTIONS}}
`;
}

export function QUIZ_PROMPT(lang: Lang) {
  const example = lang === "vi"
    ? '[{"question": "Câu hỏi?", "choices": ["A", "B", "C", "D"], "answer": "A", "explanation": "Giải thích..."}]'
    : '[{"question": "Question?", "choices": ["A", "B", "C", "D"], "answer": "A", "explanation": "Explanation..."}]';

  return `
TASK: Generate 5–8 multiple-choice questions from the source text.

LANGUAGE:
- target_lang=${getLangLock(lang)}
- Output language: ${getLangStr(lang)}
${langRules(lang)}

OUTPUT FORMAT (JSON ARRAY ONLY):
[
  {
    "question": "The question text",
    "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Exact text of the correct option",
    "explanation": "Brief explanation"
  },
  ...
]

HARD RULES:
- Exactly 4 options in "choices" array.
- "answer" MUST match EXACTLY one of the options in "choices".
- Start immediately with [. No markdown code blocks (no \`\`\`).
- No extra text outside the JSON array.
- Example: ${example}

SOURCE:
{{SOURCE_TEXT}}

USER INSTRUCTIONS:
{{USER_INSTRUCTIONS}}
`;
}

export function INSIGHTS_PROMPT(lang: Lang) {
  return `
TASK: Generate exactly 3 insights grounded in the source.

LANGUAGE:
- target_lang=${getLangLock(lang)}
- Output language: ${getLangStr(lang)}
${langRules(lang)}

OUTPUT FORMAT (JSON OBJECT ONLY):
{
  "da": "Devil's Advocate challenge (2-5 sentences)",
  "meta": "Metaphor analogy (2-5 sentences)",
  "cp": "Cross-pollination/application (2-5 sentences)"
}

RULES:
- Start immediately with {. No markdown code blocks (no \`\`\`).
- No extra text outside the JSON object.
- Ground every insight in the source.

SOURCE:
{{SOURCE_TEXT}}

USER INSTRUCTIONS:
{{USER_INSTRUCTIONS}}
`;
}

export function WEAKSPOTS_PROMPT(lang: Lang) {
  if (lang === "vi") {
    return `
NHIỆM VỤ: Phân tích lỗ hổng kiến thức dựa trên lịch sử làm quiz và văn bản nguồn.

NGÔN NGỮ:
- target_lang=${getLangLock(lang)}
- Đầu ra: ${getLangStr(lang)}
${langRules(lang)}

ĐỊNH DẠNG (Markdown):
Bắt buộc có đủ các mục theo thứ tự:
## Điểm yếu chính
## Nguyên nhân khả dĩ
## Kế hoạch ôn tập (ngắn gọn)
## 5 câu hỏi luyện tập (tự tạo)

QUY TẮC:
- Dùng QUIZ HISTORY làm bằng chứng (mẫu sai: nhầm định nghĩa, nhầm cơ chế, nhầm so sánh...).
- Nếu quiz history không đủ, chỉ xuất đúng:
<error>INSUFFICIENT_QUIZ_HISTORY</error>
- Không code fence, không intro/outro.

SOURCE:
{{SOURCE_TEXT}}

QUIZ HISTORY:
{{QUIZ_RESULTS}}
`;
  }

  return `
TASK: Identify knowledge gaps based on quiz history and the source text.

LANGUAGE:
- target_lang=${getLangLock(lang)}
- Output language: ${getLangStr(lang)}
${langRules(lang)}

OUTPUT FORMAT (Markdown only):
Must include these sections in order:
## Main weak areas
## Likely causes
## Study plan (short)
## 5 practice questions

RULES:
- Use quiz history as evidence.
- If quiz history is empty/insufficient, output EXACTLY:
<error>INSUFFICIENT_QUIZ_HISTORY</error>
- No code fences. No intro/outro.

SOURCE:
{{SOURCE_TEXT}}

QUIZ HISTORY:
{{QUIZ_RESULTS}}
`;
}
