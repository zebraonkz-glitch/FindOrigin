import { getOpenAiApiKey, getOpenAiBaseUrl, getOpenAiModel } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 45_000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export async function chatCompletionJson(
  messages: ChatMessage[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    };

    if (getOpenAiBaseUrl().includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "https://findorigin.app";
      headers["X-Title"] = "FindOrigin";
    }

    const response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: getOpenAiModel(),
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}
