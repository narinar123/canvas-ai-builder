import { describe, expect, it } from "vitest"
import {
  AgentRequestSchema,
  AgentResponseSchema,
  GeneratedFileSchema,
  PublishRequestSchema,
  WorkflowRequestSchema,
} from "./contracts"

const generatedFile = {
  path: "index.html",
  language: "html",
  content: "<main>Hello</main>",
} as const

describe("builder contracts", () => {
  it("accepts a complete agent request", () => {
    // Given
    const request = {
      prompt: "Build a focused portfolio",
      files: [generatedFile],
      projectName: "Northstar",
    }

    // When
    const result = AgentRequestSchema.safeParse(request)

    // Then
    expect(result.success).toBe(true)
  })

  it("rejects an empty agent prompt after trimming", () => {
    // Given
    const request = { prompt: "   ", files: [], projectName: "Northstar" }

    // When
    const result = AgentRequestSchema.safeParse(request)

    // Then
    expect(result.success).toBe(false)
  })

  it("rejects unsupported generated file languages", () => {
    // Given
    const file = { ...generatedFile, language: "typescript" }

    // When
    const result = GeneratedFileSchema.safeParse(file)

    // Then
    expect(result.success).toBe(false)
  })

  it("accepts a complete generated response", () => {
    // Given
    const response = {
      title: "Portfolio built",
      summary: "Created the requested project.",
      files: [generatedFile],
      tasks: ["Created page structure"],
      source: "openrouter",
    }

    // When
    const result = AgentResponseSchema.safeParse(response)

    // Then
    expect(result.success).toBe(true)
  })

  it("rejects an unknown workflow event", () => {
    // Given
    const event = {
      event: "generation.failed",
      projectName: "Northstar",
      detail: "Model timed out",
    }

    // When
    const result = WorkflowRequestSchema.safeParse(event)

    // Then
    expect(result.success).toBe(false)
  })

  it("trims a valid publish project name", () => {
    // Given
    const request = { projectName: "  Northstar  " }

    // When
    const result = PublishRequestSchema.parse(request)

    // Then
    expect(result.projectName).toBe("Northstar")
  })
})
