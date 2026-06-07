import { z } from "zod"

export const GeneratedFileSchema = z.object({
  path: z.string().min(1).max(160),
  language: z.enum(["html", "css", "javascript"]),
  content: z.string().max(60_000),
})

export const AgentRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(4_000),
  files: z.array(GeneratedFileSchema).max(12),
  projectName: z.string().trim().min(1).max(80),
})

export const AgentResponseSchema = z.object({
  summary: z.string().min(1).max(2_000),
  title: z.string().min(1).max(100),
  files: z.array(GeneratedFileSchema).min(1).max(12),
  tasks: z.array(z.string().min(1).max(160)).min(1).max(8),
  source: z.enum(["openrouter", "demo"]),
})

export const WorkflowRequestSchema = z.object({
  event: z.enum(["generation.started", "generation.completed", "deployment.requested"]),
  projectName: z.string().min(1).max(80),
  detail: z.string().max(2_000),
})

export const PublishRequestSchema = z.object({
  projectName: z.string().trim().min(1).max(80),
})

export type AgentRequest = z.infer<typeof AgentRequestSchema>
export type AgentResponse = z.infer<typeof AgentResponseSchema>
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>
export type WorkflowRequest = z.infer<typeof WorkflowRequestSchema>
