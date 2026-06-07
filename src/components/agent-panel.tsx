"use client"

import { ArrowUp, Blocks, Sparkles } from "lucide-react"
import type { FormEvent, KeyboardEvent } from "react"
import { TaskList } from "@/components/task-list"

export type AgentMessage = {
  readonly id: string
  readonly role: "agent" | "user"
  readonly content: string
  readonly meta?: string
}

type AgentPanelProps = {
  readonly fileCount: string
  readonly isGenerating: boolean
  readonly messages: readonly AgentMessage[]
  readonly prompt: string
  readonly tasks: readonly string[]
  readonly onOpenConnectors: () => void
  readonly onPromptChange: (value: string) => void
  readonly onSubmit: () => void
}

function assertNever(value: never): never {
  throw new TypeError(`Unexpected agent message role: ${String(value)}`)
}

function messageLabel(message: AgentMessage): string {
  if (message.meta) {
    return message.meta
  }

  const role = message.role
  switch (role) {
    case "agent":
      return "Build agent"
    case "user":
      return "You"
    default:
      return assertNever(role)
  }
}

export function AgentPanel({
  fileCount,
  isGenerating,
  messages,
  prompt,
  tasks,
  onOpenConnectors,
  onPromptChange,
  onSubmit,
}: AgentPanelProps) {
  const canSubmit = prompt.trim().length > 1 && !isGenerating

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSubmit) {
      onSubmit()
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canSubmit) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <aside className="agent-panel" aria-label="AI builder agent">
      <header className="agent-header">
        <div className="prompt-toolbar">
          <div>
            <p className="agent-kicker">{isGenerating ? "Building now" : fileCount}</p>
            <h1 className="agent-heading">Build with Agent</h1>
          </div>
          <button
            aria-label="Open connectors"
            className="icon-button"
            onClick={onOpenConnectors}
            title="Open connectors"
            type="button"
          >
            <Blocks aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <div className="conversation" aria-live="polite">
        {messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <span className="message-meta">{messageLabel(message)}</span>
            <p>{message.content}</p>
          </article>
        ))}
        {isGenerating ? (
          <article className="message agent">
            <span className="message-meta">Agent is working</span>
            <p>Reading your direction, composing the interface, and preparing the preview…</p>
          </article>
        ) : null}
        <TaskList isGenerating={isGenerating} tasks={tasks} />
      </div>

      <form className="prompt-wrap" onSubmit={submit}>
        <label className="agent-kicker" htmlFor="agent-prompt">
          Describe your next change
        </label>
        <textarea
          className="prompt-input"
          id="agent-prompt"
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Agent to build, refine, or connect…"
          rows={3}
          value={prompt}
        />
        <div className="prompt-toolbar">
          <div className="prompt-actions">
            <button className="compact-button" onClick={onOpenConnectors} type="button">
              <Sparkles aria-hidden="true" size={13} />
              Connectors
            </button>
          </div>
          <button
            aria-label="Send prompt"
            className="primary-button"
            disabled={!canSubmit}
            type="submit"
          >
            <ArrowUp aria-hidden="true" size={15} />
          </button>
        </div>
      </form>
    </aside>
  )
}
