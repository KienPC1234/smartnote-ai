export const llm = {
  chatStream: async (system: string, messages: { role: string, content: string }[]) => {
    const baseUrl = process.env.OLLAMA_BASE_URL || "https://ai.fptoj.com/v1";
    const apiKey = process.env.OLLAMA_API_KEY;
    const model = process.env.LLM_MODEL || "qwen3-vl:8b";

    console.log(`--- AI REQUEST DEBUG ---`);
    console.log(`URL: ${baseUrl}/chat/completions`);
    console.log(`Model: ${model}`);

    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error ${response.status}: ${errorText}`);
    }

    return response.body;
  },

  chatText: async (system: string, user: string): Promise<string> => {
    const baseUrl = process.env.OLLAMA_BASE_URL || "https://ai.fptoj.com/v1";
    console.log(`[AI DEBUG] URL: ${baseUrl.replace(/\/+$/, "")}/chat/completions`);

    const temperature = parseFloat(process.env.LLM_TEMPERATURE || "0.3");

    const requestBody = {
      model: process.env.LLM_MODEL || "gemma3:12b",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: true,
      temperature: temperature,
    };

    console.log(`[AI DEBUG] Request Body:`, JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OLLAMA_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[AI DEBUG] Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI Provider Error: ${response.status} - ${text.substring(0, 500)}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

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
              const parsed = JSON.parse(dataStr);
              // Ollama/OpenAI standard: choices[0].delta.content
              const content = parsed.choices?.[0]?.delta?.content || "";
              fullContent += content;
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

      console.log(`[AI DEBUG] Full Content Length: ${fullContent.length}`);
      return fullContent;

    } catch (error) {
      console.error("chatText failed:", error);
      throw error;
    }
  },

  chatJson: async (system: string, user: string, repairPrompt: string): Promise<any> => {
    const raw = await llm.chatText(system, user);
    try {
      return JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      const repaired = await llm.chatText(system + "\nPrevious: " + raw, repairPrompt);
      try {
        return JSON.parse(repaired.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch (f) {
        return { error: "Failed to parse AI output" };
      }
    }
  }
};
