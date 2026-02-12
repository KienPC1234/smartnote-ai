export const SYSTEM_PROMPT = (lang: string) => `
You are "SmartNote AI Pro", an elite educational architect.
LANGUAGE: ${lang === "vi" ? "VIETNAMESE (Tiếng Việt)" : "ENGLISH"}.
CRITICAL: The content MUST BE IN ${lang === "vi" ? "VIETNAMESE" : "ENGLISH"}.
START IMMEDIATELY. NO INTRODUCTIONS.
`;

export const OUTLINE_PROMPT = `
Task: Create a High-Density Markdown Outline.
Requirement: Output ONLY valid Markdown. Use LaTeX for math ($...$ or $$...$$).
Additional Instructions: {{USER_INSTRUCTIONS}}
Source Data:
{{SOURCE_TEXT}}
`;

export const FLASHCARDS_PROMPT = `
Task: Generate EXACTLY 10-15 Active Recall Flashcards (Max 15).
STREAMING PROTOCOL: Use [FC] JSON_OBJECT [/FC] for each card.
Example: [FC] {"id": "1", "front": "...", "back": "...", "tags": [], "difficulty": 1} [/FC]
{{USER_INSTRUCTIONS}}
Source Data:
{{SOURCE_TEXT}}
`;

export const QUIZ_PROMPT = `
Task: Generate EXACTLY 5 Diagnostic Questions (Multiple Choice).
STREAMING PROTOCOL: Use [QZ] JSON_OBJECT [/QZ] for each question.
Example: [QZ] {"id": "1", "question": "...", "choices": ["...", "..."], "answer_index": 0, "explanation": "..."} [/QZ]
{{USER_INSTRUCTIONS}}
Source Data:
{{SOURCE_TEXT}}
`;

export const INSIGHTS_PROMPT = `
Task: Generate 3 Neural Insights (Devil's Advocate, Metaphor, Cross-Pollination).
Format: Return ONLY a raw JSON object string.
{
  "devils_advocate": "...",
  "metaphor": "...",
  "cross_pollination": "..."
}
Source Data:
{{SOURCE_TEXT}}
`;

export const JSON_REPAIR_PROMPT = `Return ONLY raw JSON.`;