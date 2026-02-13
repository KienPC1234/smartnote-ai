// src/lib/prompts.ts

const getLangStr = (lang: string) => lang === "vi" ? "VIETNAMESE (Tiếng Việt)" : "ENGLISH";

export const SYSTEM_PROMPT = (lang: string) => `
You are "SmartNote AI Pro", an elite educational architect.
STRICT OUTPUT LANGUAGE: ${getLangStr(lang)}.
FORMATTING: Use clean Markdown for text. Use $...$ for math equations.
STRICTNESS: Output ONLY the requested data format. No preamble (e.g., "Here is the outline..."). No chat.
TAGS: Use the exact XML tags specified in the instructions.
`;

export const OUTLINE_PROMPT = (lang: string) => `
Task: Create a Scientific Outline.
Target Language: ${getLangStr(lang)}.
Requirement: Output ONLY valid Markdown.
Structure: 
- H1 title (in ${getLangStr(lang)})
- H2 Roman numeral sections (I, II, III...)
- H3 numbered sub-sections (1, 2, 3...)
- Bold key terms. 
- Use "> [!NOTE]" for key takeaways.
- No introductions or conclusions.

Source Text:
{{SOURCE_TEXT}}

User Instructions (incorporate if relevant):
{{USER_INSTRUCTIONS}}
`;

export const FLASHCARDS_PROMPT = (lang: string) => `
Task: Generate 10-15 Flashcards for Active Recall.
Target Language: ${getLangStr(lang)}.
Protocol: Output ONLY <fc> tags. No markdown code blocks like \`\`\`xml.
Format:
<fc>
<front>Question (in ${getLangStr(lang)})</front>
<back>Answer (in ${getLangStr(lang)})</back>
</fc>

CRITICAL: Start immediately with <fc>. Do not wrap in other tags.
Source Text:
{{SOURCE_TEXT}}

User Instructions:
{{USER_INSTRUCTIONS}}
`;

export const QUIZ_PROMPT = (lang: string) => `
Task: Generate 5-8 Multiple Choice Questions (Diagnostic Quiz).
Target Language: ${getLangStr(lang)}.
Protocol: Output ONLY <qz> tags. No markdown code blocks.
Format:
<qz>
<question>Question text (in ${getLangStr(lang)})</question>
<o>Option A</o>
<o>Option B</o>
<o>Option C</o>
<o>Option D</o>
<answer>TEXT OF CORRECT OPTION (Must match exactly one <o>)</answer>
<explanation>Explanation of why it is correct (in ${getLangStr(lang)})</explanation>
</qz>

CRITICAL: The content inside <answer> must be a strict string match to one of the <o> tags.
Source Text:
{{SOURCE_TEXT}}

User Instructions:
{{USER_INSTRUCTIONS}}
`;

export const INSIGHTS_PROMPT = (lang: string) => `
Task: Generate 3 Neural Insights to deepen understanding.
Target Language: ${getLangStr(lang)}.
Protocol: Output ONLY this structure (no markdown formatting around tags):

<insights>
<da>Devil's Advocate: Challenge a concept from the text (in ${getLangStr(lang)})...</da>
<meta>Metaphor Magic: Explain a complex idea using an analogy (in ${getLangStr(lang)})...</meta>
<cp>Cross-pollination: Connect this topic to a different field (in ${getLangStr(lang)})...</cp>
</insights>

Source Text:
{{SOURCE_TEXT}}

User Instructions:
{{USER_INSTRUCTIONS}}
`;

export const WEAKSPOTS_PROMPT = (lang: string) => `
Task: Identify knowledge gaps and provide remediation.
Target Language: ${getLangStr(lang)}.

Source Text: 
{{SOURCE_TEXT}}

Quiz History (User's performance): 
{{QUIZ_RESULTS}}

Instructions:
Based on the quiz results and the source text, identify 3 specific areas where the user showed weakness. 
Provide a concise explanation and a mini-recap for each in ${getLangStr(lang)}.
Output in clean Markdown.
`;