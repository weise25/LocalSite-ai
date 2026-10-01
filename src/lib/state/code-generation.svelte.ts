import { toast } from "svelte-sonner";

export interface GenerateCodeParams {
  prompt: string;
  model: string;
  provider: string;
  maxTokens?: number;
  systemPromptType: string; // 'default', 'thinking', 'custom'
  customSystemPrompt?: string;
  /** Current HTML to iterate on; omitted for a fresh generation */
  previousCode?: string;
}

// Interface for NDJSON stream parts
interface StreamPart {
  type: "text" | "reasoning" | "error";
  content: string;
}

export type GenerationStatus = "idle" | "generating" | "done" | "stopped" | "error";

/** Removes markdown code fences the model may have wrapped around the HTML. */
export function stripFences(s: string): string {
  return s
    .replace(/^[\s\S]*?```(?:[a-zA-Z0-9]+)?\s*\n/i, "")
    .replace(/\n\s*```[\s\S]*$/i, "");
}

/**
 * Rune-based replacement for the former `useCodeGeneration` React hook.
 * Holds all generation state and the streaming logic.
 */
export class CodeGeneration {
  generatedCode = $state("");
  isGenerating = $state(false);
  generationComplete = $state(false);
  thinkingOutput = $state("");
  isThinking = $state(false);
  status = $state<GenerationStatus>("idle");
  /** Epoch ms timestamps for the status capsule and version metadata */
  startedAt = $state(0);
  endedAt = $state(0);
  thinkingStartedAt = $state(0);
  thinkingEndedAt = $state(0);

  private abortController: AbortController | null = null;

  abort() {
    this.abortController?.abort();
  }

  /**
   * Stops a running generation but keeps what was written so far,
   * so it can still be previewed, edited and exported.
   */
  stop() {
    if (!this.isGenerating) return;
    const partial = stripFences(this.generatedCode);
    this.abort();
    this.isGenerating = false;
    this.isThinking = false;
    if (this.thinkingStartedAt && !this.thinkingEndedAt) this.thinkingEndedAt = Date.now();
    this.endedAt = Date.now();
    this.generatedCode = partial;
    this.generationComplete = !!partial;
    this.status = "stopped";
  }

  reset() {
    this.abort();
    this.generatedCode = "";
    this.isGenerating = false;
    this.generationComplete = false;
    this.thinkingOutput = "";
    this.isThinking = false;
    this.status = "idle";
    this.startedAt = 0;
    this.endedAt = 0;
    this.thinkingStartedAt = 0;
    this.thinkingEndedAt = 0;
  }

  /** Shows an existing version without generating (e.g. a restored session). */
  load(code: string) {
    this.reset();
    this.generatedCode = code;
    this.generationComplete = true;
    this.status = "done";
  }

  async generateCode({
    prompt,
    model,
    provider,
    maxTokens,
    systemPromptType,
    customSystemPrompt,
    previousCode,
  }: GenerateCodeParams): Promise<boolean> {
    if (!prompt.trim() || !model || !provider) {
      toast.error("Please enter a prompt and select a provider and model.");
      return false;
    }

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const { signal } = controller;

    this.isGenerating = true;
    this.generatedCode = "";
    this.thinkingOutput = "";
    this.isThinking = false;
    this.generationComplete = false;
    this.status = "generating";
    this.startedAt = Date.now();
    this.endedAt = 0;
    this.thinkingStartedAt = 0;
    this.thinkingEndedAt = 0;

    try {
      // Construct the system prompt logic here or in the API route.
      let finalCustomSystemPrompt: string | null = null;

      if (systemPromptType === "custom") {
        finalCustomSystemPrompt = customSystemPrompt ?? null;
      }

      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          provider,
          maxTokens,
          systemPromptType,
          customSystemPrompt: finalCustomSystemPrompt,
          ...(previousCode ? { previousCode } : {}),
        }),
        signal,
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            throw new Error(errorData.error);
          }
        } catch {
          // Ignore json parse error
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream could not be read");
      }

      const codeChunks: string[] = [];
      const reasoningChunks: string[] = [];
      let lineBuffer = "";
      let hasReceivedReasoning = false;
      const decoder = new TextDecoder();

      let streamError = "";

      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();

        if (done || signal.aborted) {
          break;
        }

        lineBuffer += decoder.decode(value, { stream: true });

        // Process complete lines (NDJSON format)
        const lines = lineBuffer.split("\n");
        // Keep the last incomplete line in the buffer
        lineBuffer = lines.pop() || "";

        let codeUpdated = false;
        let reasoningUpdated = false;

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const part: StreamPart = JSON.parse(line);

            if (part.type === "text") {
              if (this.isThinking) {
                this.isThinking = false;
                this.thinkingEndedAt = Date.now();
              }
              codeChunks.push(part.content);
              codeUpdated = true;
            } else if (part.type === "error") {
              streamError = part.content || "Stream error occurred";
            } else if (part.type === "reasoning") {
              if (!hasReceivedReasoning) {
                this.isThinking = true;
                this.thinkingStartedAt = Date.now();
                hasReceivedReasoning = true;
              }
              reasoningChunks.push(part.content);
              reasoningUpdated = true;
            }
          } catch {
            // Legacy plain-text stream: treat raw line as content
            if (this.isThinking) {
              this.isThinking = false;
            }
            codeChunks.push(line);
            codeUpdated = true;
          }
        }

        // Batch state updates once per reader.read() call
        if (codeUpdated) {
          this.generatedCode = codeChunks.join("");
        }
        if (reasoningUpdated) {
          this.thinkingOutput = reasoningChunks.join("");
        }
      }

      // Process any remaining content in the buffer
      if (lineBuffer.trim()) {
        try {
          const part: StreamPart = JSON.parse(lineBuffer);
          if (part.type === "text") {
            codeChunks.push(part.content);
          } else if (part.type === "reasoning") {
            reasoningChunks.push(part.content);
            this.thinkingOutput = reasoningChunks.join("");
          }
        } catch {
          // Legacy plain-text stream: treat remaining buffer as content
          codeChunks.push(lineBuffer);
        }
      }

      // End thinking state
      if (hasReceivedReasoning) {
        this.isThinking = false;
        if (!this.thinkingEndedAt) this.thinkingEndedAt = Date.now();
      }

      if (signal.aborted) return false;

      const finalCode = stripFences(codeChunks.join(""));
      if (!finalCode.trim()) {
        throw new Error(streamError || "The model returned no code.");
      }
      this.generatedCode = finalCode;
      this.generationComplete = true;
      this.endedAt = Date.now();
      this.status = "done";
      return true;
    } catch (error) {
      if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        return false;
      }
      this.status = "error";
      this.endedAt = Date.now();
      console.error("Error generating code:", error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("Ollama")) {
          toast.error("Cannot connect to Ollama. Is the server running?");
        } else if (errorMessage.includes("LM Studio")) {
          toast.error("Cannot connect to LM Studio. Is the server running?");
        } else if (
          provider === "deepseek" || provider === "openai_compatible"
        ) {
          toast.error(
            "Make sure the Base URL and API Keys are correct in your .env.local file.",
          );
        } else {
          toast.error(
            errorMessage || "Error generating code. Please try again later.",
          );
        }
      } else {
        toast.error("Error generating code. Please try again later.");
      }
      return false;
    } finally {
      if (this.abortController === controller) {
        this.isGenerating = false;
      }
    }
  }
}
