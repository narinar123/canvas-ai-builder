"use client"

import { Check, Circle, LoaderCircle } from "lucide-react"

type TaskListProps = {
  readonly isGenerating: boolean
  readonly tasks: readonly string[]
}

export function TaskList({ isGenerating, tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return null
  }

  return (
    <section className="task-list" aria-label="Build progress">
      <span className="message-meta">
        {isGenerating ? "Build plan in progress" : "Latest build complete"}
      </span>
      {tasks.map((task, index) => {
        const isActive = isGenerating && index === 0
        const isPending = isGenerating && index > 0

        return (
          <div className="task-row" key={task}>
            {isActive ? (
              <LoaderCircle aria-hidden="true" className="task-spinner" size={13} />
            ) : isPending ? (
              <Circle aria-hidden="true" size={11} />
            ) : (
              <Check aria-hidden="true" size={13} />
            )}
            <span>{task}</span>
          </div>
        )
      })}
    </section>
  )
}
