import { z } from "zod"
import { WorkflowRequestSchema } from "@/lib/contracts"
import { deliverWorkflowEvent, IntegrationError } from "@/lib/integrations"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
  try {
    const input: unknown = await request.json()
    const event = WorkflowRequestSchema.parse(input)
    const delivery = await deliverWorkflowEvent(event)

    return Response.json(delivery, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { error: "The workflow event is invalid", issues: error.message },
        { status: 400 },
      )
    }
    if (error instanceof IntegrationError) {
      console.error("workflow.delivery_failed", {
        message: error.message,
        service: error.service,
        status: error.status,
      })
      return Response.json({ error: error.message }, { status: 502 })
    }

    console.error("workflow.unhandled_error", { error })
    return Response.json({ error: "The workflow event could not be delivered" }, { status: 500 })
  }
}
