import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getProviderConfig,
  getSelectableProviders,
  isProviderConfigured,
  parseLLMProvider,
  resolveDefaultProvider,
} from "$lib/server/providers/config";
import { createProviderClient } from "$lib/server/providers/provider";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const providerParam = url.searchParams.get("provider");

    const provider = parseLLMProvider(providerParam) ?? resolveDefaultProvider();

    if (!isProviderConfigured(provider)) {
      const { apiKeyEnvVar } = getProviderConfig(provider);
      return json(
        {
          error: apiKeyEnvVar
            ? `Provider is not configured. Set ${apiKeyEnvVar} in .env.local.`
            : "Provider is not configured or is disabled.",
        },
        { status: 400 },
      );
    }

    const providerClient = createProviderClient(provider);
    const models = await providerClient.getModels();

    return json(models);
  } catch (error) {
    console.error("Error fetching models:", error);

    // Connection hints for local servers are safe to surface; everything else
    // stays generic so upstream error details are not leaked.
    const message = error instanceof Error &&
        error.message.startsWith("Cannot connect to")
      ? error.message
      : "Models could not be loaded. Check your configuration.";

    return json({ error: message }, { status: 500 });
  }
};

export const POST: RequestHandler = async () => {
  try {
    // Every provider that is not disabled; `configured` tells the UI whether
    // it can be used or still needs an API key / base URL.
    const providers = getSelectableProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      isLocal: provider.isLocal,
      examples: provider.examples,
      configured: isProviderConfigured(provider.id),
      apiKeyEnvVar: provider.apiKeyEnvVar,
      baseUrlEnvVar: provider.baseUrlEnvVar,
    }));

    return json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);

    return json({ error: "Error fetching providers" }, { status: 500 });
  }
};
