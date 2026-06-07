import { describe, expect, it, vi } from "vitest"
import { AgentResponseSchema } from "./contracts"

vi.mock("@/lib/contracts", async () => import("./contracts"))

const { createDemoResponse, starterFiles } = await import("./demo-project")

describe("demo project agent", () => {
  it("returns a response that satisfies the agent contract", () => {
    // Given
    const prompt = "Build a modern creative studio"

    // When
    const response = createDemoResponse(prompt)

    // Then
    expect(AgentResponseSchema.safeParse(response).success).toBe(true)
  })

  it("uses a blue accent when the prompt requests blue", () => {
    // Given
    const prompt = "Make the accent BLUE"

    // When
    const response = createDemoResponse(prompt)

    // Then
    expect(response.files.find((file) => file.path === "styles.css")?.content).toContain("#478cff")
  })

  it("keeps the default accent when blue is not requested", () => {
    // Given
    const prompt = "Make the layout more editorial"

    // When
    const response = createDemoResponse(prompt)

    // Then
    expect(response.files.find((file) => file.path === "styles.css")?.content).toContain("#ff4b2b")
  })

  it("trims the instruction in the generated summary", () => {
    // Given
    const prompt = "  Add a stronger call to action  "

    // When
    const response = createDemoResponse(prompt)

    // Then
    expect(response.summary).toContain("“Add a stronger call to action”")
  })

  it("does not mutate the starter files while creating a variant", () => {
    // Given
    const originalCss = starterFiles.find((file) => file.path === "styles.css")?.content

    // When
    createDemoResponse("Use blue throughout")

    // Then
    expect(starterFiles.find((file) => file.path === "styles.css")?.content).toBe(originalCss)
  })
})
