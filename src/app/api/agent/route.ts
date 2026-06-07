import { after } from "next/server"
import { z } from "zod"
import { AgentRequestSchema } from "@/lib/contracts"
import { createDemoResponse } from "@/lib/demo-project"
import { deliverWorkflowEvent, IntegrationError } from "@/lib/integrations"
import { generateWithOpenRouter, isOpenRouterConfigured, OpenRouterError } from "@/lib/openrouter"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
  try {
    const input: unknown = await request.json()
    const agentRequest = AgentRequestSchema.parse(input)
    const response = isOpenRouterConfigured()
      ? await generateWithOpenRouter(agentRequest)
      : createDemoResponse(agentRequest.prompt)

    after(() =>
      deliverWorkflowEvent({
        event: "generation.completed",
        projectName: agentRequest.projectName,
        detail: response.summary,
      })
        .then(() => undefined)
        .catch((error: unknown) => {
          logBackgroundWorkflowFailure("generation.completed", error)
        }),
    )

    return Response.json(response)
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { error: "The generation request is invalid", issues: error.message },
        { status: 400 },
      )
    }
    if (error instanceof OpenRouterError) {
      console.error("agent.openrouter_failed", {
        message: error.message,
        status: error.status,
      })
      return Response.json({ error: error.message }, { status: 502 })
    }

    console.error("agent.unhandled_error", { error })
    return Response.json({ error: "The agent could not complete this request" }, { status: 500 })
  }
}

function logBackgroundWorkflowFailure(event: string, error: unknown): void {
  if (error instanceof IntegrationError) {
    console.error("agent.workflow_delivery_failed", {
      event,
      message: error.message,
      service: error.service,
      status: error.status,
    })
    return
  }
  console.error("agent.workflow_delivery_failed", { event, error })
}
