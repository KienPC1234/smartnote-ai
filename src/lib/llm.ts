// src/lib/llm.ts

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "https://ai.fptoj.com/v1";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
// Dùng chung 1 model mặc định nếu không có env, tránh hardcode nhiều chỗ
const DEFAULT_MODEL = process.env.LLM_MODEL || "qwen3-vl:8b"; 
const DEFAULT_TEMP = parseFloat(process.env.LLM_TEMPERATURE || "0.3");

export const llm = {
  // Hàm dùng cho Streaming (Outline, Flashcards...)
  chatStream: async (system: string, messages: { role: string, content: string, images?: string[] }[]) => {
    console.log(`[AI STREAM] Model: ${DEFAULT_MODEL} | URL: ${OLLAMA_BASE_URL}`);

    const formattedMessages = [
        { role: "system", content: system },
        ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.images && msg.images.length > 0 ? { images: msg.images } : {})
        }))
    ];

    const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: formattedMessages,
        stream: true,
        temperature: DEFAULT_TEMP,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error ${response.status}: ${errorText}`);
    }

    return response.body;
  },

  // Hàm dùng để lấy text liền (Generate title, summary ngắn...)
  chatText: async (system: string, user: string): Promise<string> => {
    console.log(`[AI TEXT] Model: ${DEFAULT_MODEL}`);

    const requestBody = {
      model: DEFAULT_MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: true, // Vẫn dùng stream để giảm time-to-first-byte phía server provider
      temperature: DEFAULT_TEMP,
    };

    try {
      const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OLLAMA_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI Provider Error: ${response.status} - ${text.substring(0, 500)}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Giữ lại phần chưa hoàn thiện

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content || "";
              fullContent += content;
            } catch (e) { }
          }
        }
      }

      return fullContent;

    } catch (error) {
      console.error("chatText failed:", error);
      throw error;
    }
  },

  // Hàm helper để lấy JSON (dùng cho các task cần cấu trúc dữ liệu chặt chẽ)
  chatJson: async (system: string, user: string, repairPrompt: string = "Fix JSON"): Promise<any> => {
    const raw = await llm.chatText(system, user);
    
    // Helper clean markdown json codeblock
    const cleanJson = (text: string) => {
        return text.replace(/```json/g, "").replace(/```/g, "").trim();
    };

    try {
      return JSON.parse(cleanJson(raw));
    } catch (e) {
      console.warn("[AI JSON] Parse failed, attempting repair...");
      const repaired = await llm.chatText(
          system, 
          `The previous output was not valid JSON. Error: ${e}. \n\nInput: ${user}\n\nPrevious Output: ${raw}\n\nTask: ${repairPrompt}. Output ONLY valid JSON.`
      );
      try {
        return JSON.parse(cleanJson(repaired));
      } catch (f) {
        console.error("[AI JSON] Repair failed.");
        return { error: "Failed to parse AI output", raw: raw };
      }
    }
  }
};