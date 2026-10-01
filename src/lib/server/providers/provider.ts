import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createCerebras } from "@ai-sdk/cerebras";
import { createOllama } from "ai-sdk-ollama";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  extractReasoningMiddleware,
  type LanguageModel,
  streamText,
  wrapLanguageModel,
} from "ai";
import { env } from "$env/dynamic/private";
import {
  getProviderApiKey,
  getProviderBaseUrl,
  LLMProvider,
  requireProviderApiKey,
} from "./config";
import { DEFAULT_SYSTEM_PROMPT } from "./prompts";

// Model metadata returned to the client. Size/parameter/quantization details
// are only known for providers that report them (currently Ollama).
export interface ModelInfo {
  id: string;
  name: string;
  size?: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
}

// Common interface for all providers
export interface LLMProviderClient {
  getModels: () => Promise<ModelInfo[]>;
  getModel: (modelId: string) => LanguageModel;
}

// Helper function to wrap a model with reasoning middleware for <think> tag extraction
function wrapWithReasoningMiddleware(model: LanguageModel): LanguageModel {
  return wrapLanguageModel({
    model: model as Parameters<typeof wrapLanguageModel>[0]["model"],
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  }) as LanguageModel;
}

// Provider factory functions
function getDeepSeekProvider() {
  return createDeepSeek({
    apiKey: requireProviderApiKey(LLMProvider.DEEPSEEK),
    baseURL: getProviderBaseUrl(LLMProvider.DEEPSEEK),
  });
}

function getOpenRouterProvider() {
  return createOpenRouter({
    apiKey: requireProviderApiKey(LLMProvider.OPENROUTER),
    baseURL: getProviderBaseUrl(LLMProvider.OPENROUTER),
  });
}

function getAnthropicProvider() {
  return createAnthropic({
    apiKey: requireProviderApiKey(LLMProvider.ANTHROPIC),
    baseURL: getProviderBaseUrl(LLMProvider.ANTHROPIC),
  });
}

function getGoogleProvider() {
  return createGoogleGenerativeAI({
    apiKey: requireProviderApiKey(LLMProvider.GOOGLE),
    baseURL: getProviderBaseUrl(LLMProvider.GOOGLE),
  });
}

function getMistralProvider() {
  return createMistral({
    apiKey: requireProviderApiKey(LLMProvider.MISTRAL),
    baseURL: getProviderBaseUrl(LLMProvider.MISTRAL),
  });
}

function getCerebrasProvider() {
  return createCerebras({
    apiKey: requireProviderApiKey(LLMProvider.CEREBRAS),
    baseURL: getProviderBaseUrl(LLMProvider.CEREBRAS),
  });
}

function getOpenAICompatibleProvider() {
  return createOpenAICompatible({
    name: "openai_compatible",
    baseURL: getProviderBaseUrl(LLMProvider.OPENAI_COMPATIBLE),
    apiKey: requireProviderApiKey(LLMProvider.OPENAI_COMPATIBLE),
  });
}

function getLMStudioProvider() {
  return createOpenAICompatible({
    name: "lm_studio",
    baseURL: getProviderBaseUrl(LLMProvider.LM_STUDIO),
    apiKey: "lm-studio",
  });
}

// Factory function to create a provider client
export function createProviderClient(provider: LLMProvider): LLMProviderClient {
  switch (provider) {
    case LLMProvider.DEEPSEEK:
      return new DeepSeekProviderClient();
    case LLMProvider.OPENROUTER:
      return new OpenRouterProviderClient();
    case LLMProvider.ANTHROPIC:
      return new AnthropicProviderClient();
    case LLMProvider.GOOGLE:
      return new GoogleProviderClient();
    case LLMProvider.MISTRAL:
      return new MistralProviderClient();
    case LLMProvider.CEREBRAS:
      return new CerebrasProviderClient();
    case LLMProvider.OPENAI_COMPATIBLE:
      return new OpenAICompatibleProviderClient();
    case LLMProvider.OLLAMA:
      return new OllamaProviderClient();
    case LLMProvider.LM_STUDIO:
      return new LMStudioProviderClient();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// DeepSeek Provider Client
class DeepSeekProviderClient implements LLMProviderClient {
  private provider = getDeepSeekProvider();

  async getModels() {
    const apiKey = getProviderApiKey(LLMProvider.DEEPSEEK);
    if (!apiKey) {
      throw new Error("Cannot fetch DeepSeek models. Check your API key.");
    }

    // DeepSeek has fixed models (no public API for listing)
    return [
      { id: "deepseek-chat", name: "DeepSeek Chat" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner" },
    ];
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// OpenRouter Provider Client
class OpenRouterProviderClient implements LLMProviderClient {
  private provider = getOpenRouterProvider();

  async getModels() {
    try {
      const apiKey = getProviderApiKey(LLMProvider.OPENROUTER);
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });

      if (!response.ok) {
        throw new Error(
          `Error fetching OpenRouter models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string; name?: string }) => ({
          id: model.id,
          name: model.name || model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      throw new Error("Cannot fetch OpenRouter models. Check your API key.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider.chat(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Anthropic Provider Client
class AnthropicProviderClient implements LLMProviderClient {
  private provider = getAnthropicProvider();

  async getModels() {
    try {
      const apiKey = getProviderApiKey(LLMProvider.ANTHROPIC);
      const response = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": apiKey || "",
          "anthropic-version": "2023-06-01",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error fetching Anthropic models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string; display_name?: string }) => ({
          id: model.id,
          name: model.display_name || model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching Anthropic models:", error);
      throw new Error("Cannot fetch Anthropic models. Check your API key.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Google AI Provider Client
class GoogleProviderClient implements LLMProviderClient {
  private provider = getGoogleProvider();

  async getModels() {
    try {
      const apiKey = getProviderApiKey(LLMProvider.GOOGLE);
      if (!apiKey) {
        throw new Error("Cannot fetch Google AI models. Check your API key.");
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models",
        {
          headers: { "x-goog-api-key": apiKey },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching Google AI models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.models
        ? data.models
          .filter(
            (model: {
              name: string;
              supportedGenerationMethods?: string[];
            }) => {
              const id = model.name.replace("models/", "");
              if (/embedding/i.test(id)) return false;
              if (
                model.supportedGenerationMethods &&
                !model.supportedGenerationMethods.includes("generateContent")
              ) {
                return false;
              }
              return true;
            },
          )
          .map((model: { name: string; displayName?: string }) => ({
            id: model.name.replace("models/", ""),
            name: model.displayName || model.name.replace("models/", ""),
          }))
        : [];
    } catch (error) {
      console.error("Error fetching Google AI models:", error);
      throw new Error("Cannot fetch Google AI models. Check your API key.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Mistral Provider Client
class MistralProviderClient implements LLMProviderClient {
  private provider = getMistralProvider();

  async getModels() {
    try {
      const apiKey = getProviderApiKey(LLMProvider.MISTRAL);
      if (!apiKey) {
        throw new Error("Cannot fetch Mistral models. Check your API key.");
      }

      const response = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        throw new Error(
          `Error fetching Mistral models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string; name?: string }) => ({
          id: model.id,
          name: model.name || model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching Mistral models:", error);
      throw new Error("Cannot fetch Mistral models. Check your API key.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Cerebras Provider Client
class CerebrasProviderClient implements LLMProviderClient {
  private provider = getCerebrasProvider();

  async getModels() {
    try {
      const apiKey = getProviderApiKey(LLMProvider.CEREBRAS);
      if (!apiKey) {
        throw new Error("Cannot fetch Cerebras models. Check your API key.");
      }

      const response = await fetch("https://api.cerebras.ai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        throw new Error(
          `Error fetching Cerebras models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string }) => ({
          id: model.id,
          name: model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching Cerebras models:", error);
      throw new Error("Cannot fetch Cerebras models. Check your API key.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Generic OpenAI-Compatible Provider Client
class OpenAICompatibleProviderClient implements LLMProviderClient {
  private provider = getOpenAICompatibleProvider();

  async getModels() {
    const envModel = env.OPENAI_COMPATIBLE_MODEL;
    if (envModel) {
      return [{ id: envModel, name: envModel }];
    }

    try {
      const baseUrl = getProviderBaseUrl(LLMProvider.OPENAI_COMPATIBLE);
      const apiKey = getProviderApiKey(LLMProvider.OPENAI_COMPATIBLE);
      const response = await fetch(`${baseUrl}/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string }) => ({
          id: model.id,
          name: model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching OpenAI-compatible models:", error);
      throw new Error("Cannot fetch models. Check your API configuration.");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Ollama Provider Client
class OllamaProviderClient implements LLMProviderClient {
  private baseUrl = getProviderBaseUrl(LLMProvider.OLLAMA);
  private ollamaProvider = createOllama({ baseURL: this.baseUrl });

  async getModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Error fetching Ollama models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models
        ? data.models.map((
          model: {
            name: string;
            size?: number;
            details?: {
              parameter_size?: string;
              quantization_level?: string;
              family?: string;
            };
          },
        ): ModelInfo => ({
          id: model.name,
          name: model.name,
          size: typeof model.size === "number" ? model.size : undefined,
          parameterSize: model.details?.parameter_size || undefined,
          quantization: model.details?.quantization_level || undefined,
          family: model.details?.family || undefined,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      throw new Error("Cannot connect to Ollama. Is the server running?");
    }
  }

  getModel(modelId: string): LanguageModel {
    // Enable Ollama's native thinking support for reasoning models (deepseek-r1, qwen3)
    // The 'think' option enables the model to return thinking in message.thinking field
    return this.ollamaProvider(modelId, { think: true }) as LanguageModel;
  }
}

// LM Studio Provider Client
class LMStudioProviderClient implements LLMProviderClient {
  private provider = getLMStudioProvider();
  private baseUrl = getProviderBaseUrl(LLMProvider.LM_STUDIO);

  async getModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(
          `Error fetching LM Studio models: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data
        ? data.data.map((model: { id: string }) => ({
          id: model.id,
          name: model.id,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching LM Studio models:", error);
      throw new Error("Cannot connect to LM Studio. Is the server running?");
    }
  }

  getModel(modelId: string): LanguageModel {
    const baseModel = this.provider(modelId) as unknown as LanguageModel;
    return wrapWithReasoningMiddleware(baseModel);
  }
}

// Helper function to generate code using streamText with reasoning support
export async function generateCodeStream(
  provider: LLMProvider,
  modelId: string,
  prompt: string,
  systemPrompt?: string | null,
  maxTokens?: number,
): Promise<ReturnType<typeof streamText>> {
  const client = createProviderClient(provider);
  const model = client.getModel(modelId);

  const result = streamText({
    model,
    system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    prompt,
    ...(maxTokens ? { maxTokens } : {}),
  });

  return result;
}
