import { after } from "next/server"
import { z } from "zod"
import { PublishRequestSchema } from "@/lib/contracts"
import { deliverWorkflowEvent, IntegrationError, publishProject } from "@/lib/integrations"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
  try {
    const input: unknown = await request.json()
    const publishRequest = PublishRequestSchema.parse(input)
    const result = await publishProject(publishRequest.projectName)

    after(() =>
      deliverWorkflowEvent({
        event: "deployment.requested",
        projectName: publishRequest.projectName,
        detail: JSON.stringify({
          deploymentId: result.deploymentId,
          source: result.source,
          url: result.url ?? null,
        }),
      })
        .then(() => undefined)
        .catch((error: unknown) => {
          logBackgroundWorkflowFailure("deployment.requested", error)
        }),
    )

    return Response.json(result, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { error: "The publish request is invalid", issues: error.message },
        { status: 400 },
      )
    }
    if (error instanceof IntegrationError) {
      console.error("publish.integration_failed", {
        message: error.message,
        service: error.service,
        status: error.status,
      })
      return Response.json({ error: error.message }, { status: 502 })
    }

    console.error("publish.unhandled_error", { error })
    return Response.json(
      { error: "The production deployment could not be created" },
      { status: 500 },
    )
  }
}

function logBackgroundWorkflowFailure(event: string, error: unknown): void {
  if (error instanceof IntegrationError) {
    console.error("publish.workflow_delivery_failed", {
      event,
      message: error.message,
      service: error.service,
      status: error.status,
    })
    return
  }
  console.error("publish.workflow_delivery_failed", { event, error })
}
