import type { RequestHandler } from "./$types";
import {
  isProviderConfigured,
  parseLLMProvider,
  resolveDefaultProvider,
} from "$lib/server/providers/config";
import { generateCodeStream } from "$lib/server/providers/provider";
import {
  DEFAULT_SYSTEM_PROMPT,
  THINKING_SYSTEM_PROMPT,
} from "$lib/server/providers/prompts";

const MAX_PROMPT_LENGTH = 100_000;
const MAX_PREVIOUS_CODE_LENGTH = 500_000;
const MAX_MODEL_LENGTH = 256;
const MAX_SYSTEM_PROMPT_LENGTH = 100_000;
const MAX_TOKENS = 128_000;
const VALID_SYSTEM_PROMPT_TYPES = new Set(["default", "thinking", "custom"]);

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Follow-up requests revise the current page instead of starting over
function buildIterationPrompt(previousCode: string, request: string): string {
  return `Here is the current version of the website as a single HTML file:

<current_file>
${previousCode}
</current_file>

Revise this file according to the request below. Keep everything that the request does not ask to change. Return the complete, updated HTML file.

Request: ${request}`;
}

function streamErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Stream error occurred";
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      prompt: rawPrompt,
      model: rawModel,
      provider: providerParam,
      customSystemPrompt: rawCustomSystemPrompt,
      maxTokens,
      systemPromptType,
      previousCode: rawPreviousCode,
    } = await request.json();

    if (typeof rawPrompt !== "string") {
      return jsonError("Prompt must be a string", 400);
    }
    if (typeof rawModel !== "string") {
      return jsonError("Model must be a string", 400);
    }

    const prompt = rawPrompt.trim();
    if (!prompt) {
      return jsonError("Prompt is required and cannot be empty", 400);
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return jsonError(
        `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`,
        400,
      );
    }

    if (rawPreviousCode !== undefined && rawPreviousCode !== null && typeof rawPreviousCode !== "string") {
      return jsonError("previousCode must be a string", 400);
    }
    const previousCode = typeof rawPreviousCode === "string" ? rawPreviousCode.trim() : "";
    if (previousCode.length > MAX_PREVIOUS_CODE_LENGTH) {
      return jsonError(
        `previousCode exceeds maximum length of ${MAX_PREVIOUS_CODE_LENGTH} characters`,
        400,
      );
    }

    const model = rawModel.trim();
    if (!model) {
      return jsonError("Model is required and cannot be empty", 400);
    }
    if (model.length > MAX_MODEL_LENGTH) {
      return jsonError(
        `Model name exceeds maximum length of ${MAX_MODEL_LENGTH} characters`,
        400,
      );
    }

    if (
      systemPromptType !== undefined &&
      systemPromptType !== null &&
      !VALID_SYSTEM_PROMPT_TYPES.has(String(systemPromptType))
    ) {
      return jsonError(
        "Invalid systemPromptType. Must be one of: default, thinking, custom",
        400,
      );
    }

    const customSystemPrompt = typeof rawCustomSystemPrompt === "string"
      ? rawCustomSystemPrompt.trim()
      : undefined;

    if (systemPromptType === "custom" && !customSystemPrompt) {
      return jsonError(
        "Custom system prompt required when systemPromptType is custom",
        400,
      );
    }

    if (
      customSystemPrompt &&
      customSystemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
    ) {
      return jsonError(
        `Custom system prompt exceeds maximum length of ${MAX_SYSTEM_PROMPT_LENGTH} characters`,
        400,
      );
    }

    let parsedMaxTokens: number | undefined;
    if (maxTokens !== undefined && maxTokens !== null && maxTokens !== "") {
      parsedMaxTokens = parseInt(String(maxTokens), 10);
      if (parsedMaxTokens && (isNaN(parsedMaxTokens) || parsedMaxTokens <= 0)) {
        parsedMaxTokens = undefined;
      }
      if (parsedMaxTokens !== undefined && parsedMaxTokens > MAX_TOKENS) {
        return jsonError(
          `maxTokens must be a positive integer up to ${MAX_TOKENS}`,
          400,
        );
      }
    }

    const provider =
      parseLLMProvider(typeof providerParam === "string" ? providerParam : null) ??
        resolveDefaultProvider();

    if (!isProviderConfigured(provider)) {
      return jsonError(`Provider "${provider}" is not configured or is disabled`, 400);
    }

    let finalSystemPrompt = customSystemPrompt;

    if (!finalSystemPrompt) {
      if (systemPromptType === "thinking") {
        finalSystemPrompt = THINKING_SYSTEM_PROMPT;
      } else {
        finalSystemPrompt = DEFAULT_SYSTEM_PROMPT;
      }
    }

    const result = await generateCodeStream(
      provider,
      model,
      previousCode ? buildIterationPrompt(previousCode, prompt) : prompt,
      finalSystemPrompt,
      parsedMaxTokens,
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onAbort = () => {
          controller.close();
        };
        request.signal.addEventListener("abort", onAbort);

        try {
          for await (const part of result.fullStream) {
            if (request.signal.aborted) {
              controller.close();
              return;
            }
            if (part.type === "text-delta") {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "text", content: part.text }) + "\n",
                ),
              );
            } else if (part.type === "reasoning-delta") {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "reasoning", content: part.text }) +
                    "\n",
                ),
              );
            } else if (part.type === "error") {
              const msg = streamErrorMessage(part.error);
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "error", content: msg }) + "\n",
                ),
              );
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          request.signal.removeEventListener("abort", onAbort);
        }
      },
      cancel() {
        // Client disconnected; loop checks request.signal.aborted
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating code:", error);

    return jsonError("Generation failed. Check your configuration.", 500);
  }
};
