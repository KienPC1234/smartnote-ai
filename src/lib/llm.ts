import { Ollama } from 'ollama';

type ChatMsg = { role: "system" | "user" | "assistant"; content: string; images?: string[] };

type StreamOpts = {
  temperature?: number;
  top_p?: number;
  stop?: string[];
};

const host = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const apiKey = process.env.OLLAMA_API_KEY;

const ollama = new Ollama({
  host: host.replace(/\/v1$/, ""), 
  headers: apiKey ? {
    Authorization: `Bearer ${apiKey}`,
  } : undefined,
});

/**
 * Simple Semaphore to limit concurrent LLM requests
 */
class Semaphore {
  private tasks: (() => void)[] = [];
  private activeCount = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      console.log(`[LLM_CONCURRENCY] Slot acquired. Active: ${this.activeCount}/${this.maxConcurrency}`);
      return Promise.resolve();
    }

    console.log(`[LLM_CONCURRENCY] Waiting for slot... Queue size: ${this.tasks.length + 1}`);
    return new Promise((resolve) => {
      this.tasks.push(resolve);
    });
  }

  release(): void {
    if (this.tasks.length > 0) {
      const nextTask = this.tasks.shift();
      console.log(`[LLM_CONCURRENCY] Slot released. Next task from queue starting. Queue size: ${this.tasks.length}`);
      if (nextTask) nextTask();
    } else {
      this.activeCount--;
      console.log(`[LLM_CONCURRENCY] Slot released. Active: ${this.activeCount}/${this.maxConcurrency}`);
    }
  }
}

// Default to 2 concurrent requests to avoid overwhelming local Ollama
// Can be adjusted via ENV
const limit = new Semaphore(parseInt(process.env.LLM_CONCURRENCY_LIMIT || "2"));

export const llm = {
  chatStream: async (system: string, messages: ChatMsg[], opts: StreamOpts = {}) => {
    const model = process.env.LLM_MODEL || "qwen3-vl:8b";

    const formattedMessages = [
      { role: "system", content: system },
      ...messages
    ];

    await limit.acquire();

    try {
      const response = await ollama.chat({
        model,
        messages: formattedMessages as any,
        stream: true,
        options: {
          temperature: opts.temperature ?? 0.2,
          top_p: opts.top_p ?? 0.9,
          stop: opts.stop,
        }
      });

      return new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const part of response) {
              const chunk = {
                choices: [
                  {
                    delta: {
                      content: part.message.content,
                    },
                  },
                ],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (e) {
            controller.error(e);
          } finally {
            limit.release();
          }
        },
        cancel() {
          limit.release();
        }
      });
    } catch (error) {
      limit.release();
      throw error;
    }
  },

  chatText: async (system: string, user: string, options: StreamOpts = {}): Promise<string> => {
    const model = process.env.LLM_MODEL || "gemma3:12b";
    
    await limit.acquire();
    
    try {
      const response = await ollama.chat({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        options: {
          temperature: options.temperature ?? 0.3,
          top_p: options.top_p ?? 0.9,
        }
      });
      return response.message.content;
    } catch (error) {
      console.error("[LLM_CHAT_TEXT_ERROR]", error);
      throw error;
    } finally {
      limit.release();
    }
  },
};
