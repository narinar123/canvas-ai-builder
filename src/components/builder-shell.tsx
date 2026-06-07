"use client"

import { useEffect, useMemo, useState } from "react"
import { AgentPanel } from "@/components/agent-panel"
import { ConnectorModal } from "@/components/connector-modal"
import { TopBar } from "@/components/top-bar"
import { WorkspacePanel } from "@/components/workspace-panel"
import { AgentResponseSchema, type GeneratedFile } from "@/lib/contracts"
import { starterFiles } from "@/lib/demo-project"

type BuilderMode = "preview" | "code"

type ChatMessage = {
  readonly id: string
  readonly role: "agent" | "user"
  readonly content: string
  readonly meta?: string
}

const initialMessages: readonly ChatMessage[] = [
  {
    id: "welcome",
    role: "agent",
    content:
      "I’m ready to shape this with you. Describe a page, product, or change and I’ll build it into the preview.",
    meta: "Builder ready",
  },
]

export function BuilderShell() {
  const [projectName, setProjectName] = useState("Northstar studio")
  const [mode, setMode] = useState<BuilderMode>("preview")
  const [files, setFiles] = useState<readonly GeneratedFile[]>(starterFiles)
  const [messages, setMessages] = useState<readonly ChatMessage[]>(initialMessages)
  const [tasks, setTasks] = useState<readonly string[]>(["Draft ready for your next instruction"])
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [connectorsOpen, setConnectorsOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem("canvas-ai-project")
    if (!stored) return
    try {
      const parsed = AgentResponseSchema.pick({ files: true }).parse(JSON.parse(stored))
      setFiles(parsed.files)
    } catch {
      window.localStorage.removeItem("canvas-ai-project")
    }
  }, [])

  const fileCount = useMemo(() => `${files.length} generated files`, [files.length])

  function updateFiles(nextFiles: readonly GeneratedFile[]): void {
    setFiles(nextFiles)
    window.localStorage.setItem("canvas-ai-project", JSON.stringify({ files: nextFiles }))
  }

  async function submitPrompt(): Promise<void> {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || isGenerating) return

    setPrompt("")
    setIsGenerating(true)
    setTasks(["Understanding your direction", "Composing the interface", "Preparing live preview"])
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: cleanPrompt },
    ])

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, files, projectName }),
      })
      const payload = AgentResponseSchema.parse(await response.json())
      updateFiles(payload.files)
      setTasks(payload.tasks)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: payload.summary,
          meta: payload.source === "openrouter" ? "Generated with OpenRouter" : "Demo agent",
        },
      ])
      setMode("preview")
    } catch (error) {
      setTasks(["Generation paused"])
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content:
            error instanceof Error
              ? `I couldn’t finish that pass: ${error.message}`
              : "I couldn’t finish that pass. Please try again.",
          meta: "Action needed",
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  async function publish(): Promise<void> {
    setNotice("Preparing production deployment…")
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectName }),
      })
      const payload: unknown = await response.json()
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Publish request accepted."
      setNotice(message)
    } catch {
      setNotice("Publish could not start. Check your Vercel connection.")
    }
  }

  return (
    <main className="builder-shell">
      <TopBar
        projectName={projectName}
        mode={mode}
        onModeChange={setMode}
        onProjectNameChange={setProjectName}
        onOpenConnectors={() => setConnectorsOpen(true)}
        onPublish={publish}
        onShare={() => setNotice("Share link copied to your workspace.")}
      />
      <section className="builder-workbench">
        <AgentPanel
          messages={messages}
          tasks={tasks}
          prompt={prompt}
          isGenerating={isGenerating}
          fileCount={fileCount}
          onPromptChange={setPrompt}
          onSubmit={submitPrompt}
          onOpenConnectors={() => setConnectorsOpen(true)}
        />
        <WorkspacePanel
          mode={mode}
          files={files}
          projectName={projectName}
          isGenerating={isGenerating}
          onModeChange={setMode}
          onFilesChange={updateFiles}
        />
      </section>
      {connectorsOpen ? <ConnectorModal onClose={() => setConnectorsOpen(false)} /> : null}
      {notice ? (
        <button className="toast" type="button" onClick={() => setNotice(null)}>
          {notice}
        </button>
      ) : null}
    </main>
  )
}
