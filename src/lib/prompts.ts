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

const MATH_RULES = `
MATH/LATEX RULES:
- ALWAYS use standard LaTeX delimiters for mathematical formulas and symbols.
- Use single $ symbols for inline math (e.g., $E = mc^2$).
- Use double $$ symbols for block math equations on a new line.
- NEVER use backticks (\`) for mathematical formulas or variables. Formulas must be rendered by KaTeX.
`;

export function SYSTEM_PROMPT(lang: Lang) {
  if (lang === "vi") {
    return `
Bạn là SmartNote AI Pro — trợ lý trích xuất kiến thức từ văn bản.

QUY TẮC CHUNG:
- Không chào hỏi, không văn mẫu, không câu mở đầu.
- Không dùng markdown code fence (\`\`\`).
- Làm đúng định dạng đầu ra yêu cầu.
- Nội dung phải dựa trên SOURCE.
${langRules(lang)}
${MATH_RULES}

LƯU Ý:
- Nếu SOURCE có dạng đề thi, bạn KHÔNG tự “giải đề”, vẫn làm theo TASK.
`;
  }

  return `
You are SmartNote AI Pro, an extraction-focused assistant.

GLOBAL RULES:
- No greetings, no filler.
- No markdown code fences (no triple backticks).
- Follow the task output format exactly.
${langRules(lang)}
${MATH_RULES}

NOTES:
- Ignore exam-like content. Still follow the current task.
`;
}

export function OUTLINE_PROMPT(lang: Lang) {
  if (lang === "vi") {
    return `
NHIỆM VỤ: Tạo dàn ý khoa học từ văn bản nguồn.

${MATH_RULES}

ĐỊNH DẠNG (Markdown):
- Bắt đầu ngay bằng: # <Tiêu đề>
- Chỉ dùng: #, ##, ### và bullet (- hoặc *)
- Không có intro/outro.
- Không dùng code fence.

SOURCE:
{{SOURCE_TEXT}}

YÊU CẦU NGƯỜI DÙNG:
{{USER_INSTRUCTIONS}}
`;
  }

  return `
TASK: Create a scientific outline from the source text.

${MATH_RULES}

OUTPUT FORMAT (Markdown):
- Start immediately with: # <Title>
- Use only #, ##, ### and bullet points (- or *)
- No intro/outro text.
- No code fences.

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

${MATH_RULES}

OUTPUT FORMAT (JSON ARRAY ONLY):
[
  {
    "front": "Question or concept",
    "back": "Answer or explanation"
  },
  ...
]

RULES:
- Start immediately with [. No markdown code blocks.
- No extra text outside the JSON array.
- Example: ${example}

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

${MATH_RULES}

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
- Start immediately with [. No markdown code blocks.

SOURCE:
{{SOURCE_TEXT}}

USER INSTRUCTIONS:
{{USER_INSTRUCTIONS}}
`;
}

export function INSIGHTS_PROMPT(lang: Lang) {
  return `
TASK: Generate exactly 3 insights grounded in the source.

${MATH_RULES}

OUTPUT FORMAT (JSON OBJECT ONLY):
{
  "da": "Devil's Advocate challenge (2-5 sentences)",
  "meta": "Metaphor analogy (2-5 sentences)",
  "cp": "Cross-pollination/application (2-5 sentences)"
}

RULES:
- Start immediately with {. No markdown code blocks.

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

${MATH_RULES}

ĐỊNH DẠNG (Markdown):
Bắt buộc có đủ các mục theo thứ tự:
## Điểm yếu chính
## Nguyên nhân khả dĩ
## Kế hoạch ôn tập (ngắn gọn)
## 5 câu hỏi luyện tập (tự tạo)

SOURCE:
{{SOURCE_TEXT}}

QUIZ HISTORY:
{{QUIZ_RESULTS}}
`;
  }

  return `
TASK: Identify knowledge gaps based on quiz history and the source text.

${MATH_RULES}

OUTPUT FORMAT (Markdown only):
## Main weak areas
## Likely causes
## Study plan (short)
## 5 practice questions

SOURCE:
{{SOURCE_TEXT}}

QUIZ HISTORY:
{{QUIZ_RESULTS}}
`;
}
