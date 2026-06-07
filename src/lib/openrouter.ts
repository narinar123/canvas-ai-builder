import "server-only"

import ky, { HTTPError, TimeoutError } from "ky"
import { z } from "zod"
import { type AgentRequest, type AgentResponse, AgentResponseSchema } from "@/lib/contracts"

const OpenRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().min(1),
        }),
      }),
    )
    .min(1),
})

const GeneratedAgentResponseSchema = AgentResponseSchema.omit({ source: true })

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6"

export class OpenRouterError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "OpenRouterError"
    this.status = status
  }
}

export function isOpenRouterConfigured(): boolean {
  const { OPENROUTER_API_KEY } = process.env
  return Boolean(OPENROUTER_API_KEY?.trim())
}

export async function generateWithOpenRouter(request: AgentRequest): Promise<AgentResponse> {
  const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = process.env
  const apiKey = OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new OpenRouterError("OpenRouter is not configured")
  }

  const model = OPENROUTER_MODEL?.trim() || DEFAULT_MODEL

  try {
    const payload: unknown = await ky
      .post("https://openrouter.ai/api/v1/chat/completions", {
        headers: {
          authorization: `Bearer ${apiKey}`,
          "x-title": "Lovable Agent Builder",
        },
        json: {
          model,
          max_tokens: 12_000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You are the implementation agent inside a visual web builder.",
                "Return only valid JSON with title, summary, tasks, and files.",
                "Files must be complete, runnable, and limited to HTML, CSS, and JavaScript.",
                "Preserve useful existing work while applying the user's request.",
                "Every file needs path, language, and content. Never wrap JSON in markdown.",
              ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify({
                projectName: request.projectName,
                instruction: request.prompt,
                currentFiles: request.files,
              }),
            },
          ],
        },
        retry: { limit: 1 },
        timeout: 60_000,
      })
      .json<unknown>()

    const completion = OpenRouterResponseSchema.parse(payload)
    const choice = completion.choices.at(0)
    if (!choice) {
      throw new OpenRouterError("OpenRouter returned no completion")
    }

    const generated = GeneratedAgentResponseSchema.parse(parseJson(choice.message.content))
    return { ...generated, source: "openrouter" }
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error
    }
    if (error instanceof HTTPError) {
      throw new OpenRouterError("OpenRouter rejected the generation request", error.response.status)
    }
    if (error instanceof TimeoutError) {
      throw new OpenRouterError("OpenRouter generation timed out")
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      throw new OpenRouterError("OpenRouter returned an invalid generated project")
    }
    throw error
  }
}

function parseJson(content: string): unknown {
  const trimmed = content.trim()
  const normalized = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "")
    : trimmed
  return JSON.parse(normalized)
}
