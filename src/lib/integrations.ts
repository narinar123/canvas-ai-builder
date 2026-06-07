import "server-only"

import { createHmac, randomUUID } from "node:crypto"
import ky, { HTTPError, TimeoutError } from "ky"
import { z } from "zod"
import type { WorkflowRequest } from "@/lib/contracts"

const DeployHookResponseSchema = z.object({
  job: z.object({
    id: z.string().min(1),
    state: z.string().optional(),
  }),
})

const VercelDeploymentResponseSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1).optional(),
})

const VercelDeploymentListSchema = z.object({
  deployments: z.array(z.object({ uid: z.string().min(1) })).min(1),
})

export type WorkflowDelivery = {
  readonly accepted: true
  readonly id: string
  readonly source: "demo" | "n8n"
}

export type PublishResult = {
  readonly deploymentId: string
  readonly message: string
  readonly source: "demo" | "vercel-api" | "vercel-hook"
  readonly url?: string
}

export class IntegrationError extends Error {
  readonly service: "n8n" | "vercel"
  readonly status: number | null

  constructor(service: "n8n" | "vercel", message: string, status: number | null = null) {
    super(message)
    this.name = "IntegrationError"
    this.service = service
    this.status = status
  }
}

export async function deliverWorkflowEvent(event: WorkflowRequest): Promise<WorkflowDelivery> {
  const id = randomUUID()
  const { N8N_WEBHOOK_SECRET, N8N_WEBHOOK_URL } = process.env
  const webhookUrl = N8N_WEBHOOK_URL?.trim()
  if (!webhookUrl) {
    return { accepted: true, id, source: "demo" }
  }

  const envelope = {
    id,
    occurredAt: new Date().toISOString(),
    event: event.event,
    projectName: event.projectName,
    detail: event.detail,
  }
  const body = JSON.stringify(envelope)
  const secret = N8N_WEBHOOK_SECRET?.trim()
  const headers = secret
    ? { "x-lovable-signature": `sha256=${createHmac("sha256", secret).update(body).digest("hex")}` }
    : undefined

  try {
    await ky.post(webhookUrl, {
      body,
      headers: { ...headers, "content-type": "application/json" },
      retry: { limit: 0 },
      timeout: 15_000,
    })
    return { accepted: true, id, source: "n8n" }
  } catch (error) {
    throwIntegrationError("n8n", error)
  }
}

export async function publishProject(projectName: string): Promise<PublishResult> {
  const { VERCEL_DEPLOY_HOOK_URL, VERCEL_PROJECT_ID, VERCEL_TOKEN } = process.env
  const deployHookUrl = VERCEL_DEPLOY_HOOK_URL?.trim()
  if (deployHookUrl) {
    return publishWithHook(deployHookUrl)
  }

  const token = VERCEL_TOKEN?.trim()
  const projectId = VERCEL_PROJECT_ID?.trim()
  if (token && projectId) {
    return publishWithApi(projectName, token, projectId)
  }

  return {
    deploymentId: `demo-${randomUUID()}`,
    message: "Demo publish completed. Connect Vercel to create a production deployment.",
    source: "demo",
  }
}

async function publishWithHook(deployHookUrl: string): Promise<PublishResult> {
  try {
    const payload: unknown = await ky
      .post(deployHookUrl, { retry: { limit: 1, methods: ["post"] }, timeout: 30_000 })
      .json<unknown>()
    const result = DeployHookResponseSchema.parse(payload)
    return {
      deploymentId: result.job.id,
      message: "Production deployment queued through the Vercel deploy hook.",
      source: "vercel-hook",
    }
  } catch (error) {
    throwIntegrationError("vercel", error)
  }
}

async function publishWithApi(
  projectName: string,
  token: string,
  projectId: string,
): Promise<PublishResult> {
  const { VERCEL_TEAM_ID } = process.env
  const teamId = VERCEL_TEAM_ID?.trim()
  const searchParams = teamId ? { teamId } : {}

  try {
    const latestPayload: unknown = await ky
      .get("https://api.vercel.com/v6/deployments", {
        headers: { authorization: `Bearer ${token}` },
        retry: { limit: 1 },
        timeout: 30_000,
        searchParams: {
          ...searchParams,
          limit: 1,
          projectId,
          target: "production",
        },
      })
      .json<unknown>()
    const latest = VercelDeploymentListSchema.parse(latestPayload).deployments.at(0)
    if (!latest) {
      throw new IntegrationError("vercel", "No production deployment is available to redeploy")
    }

    const payload: unknown = await ky
      .post("https://api.vercel.com/v13/deployments", {
        headers: { authorization: `Bearer ${token}` },
        json: {
          deploymentId: latest.uid,
          name: toDeploymentName(projectName),
          project: projectId,
          target: "production",
          withLatestCommit: true,
        },
        retry: { limit: 1 },
        timeout: 30_000,
        searchParams,
      })
      .json<unknown>()
    const deployment = VercelDeploymentResponseSchema.parse(payload)
    return {
      deploymentId: deployment.id,
      message: "Production deployment created on Vercel.",
      source: "vercel-api",
      ...(deployment.url ? { url: `https://${deployment.url}` } : {}),
    }
  } catch (error) {
    throwIntegrationError("vercel", error)
  }
}

function throwIntegrationError(service: "n8n" | "vercel", error: unknown): never {
  if (error instanceof HTTPError) {
    throw new IntegrationError(service, `${service} rejected the request`, error.response.status)
  }
  if (error instanceof TimeoutError) {
    throw new IntegrationError(service, `${service} request timed out`)
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    throw new IntegrationError(service, `${service} returned an invalid response`)
  }
  throw error
}

function toDeploymentName(projectName: string): string {
  return (
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/gu, "-")
      .replace(/-{2,}/gu, "-")
      .replace(/^-+|-+$/gu, "") || "app"
  )
}
