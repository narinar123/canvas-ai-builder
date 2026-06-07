"use client"

import { Blocks, Code2, Eye, Rocket, Share2 } from "lucide-react"

type BuilderMode = "preview" | "code"

type TopBarProps = {
  readonly projectName: string
  readonly mode: BuilderMode
  readonly onModeChange: (mode: BuilderMode) => void
  readonly onProjectNameChange: (projectName: string) => void
  readonly onOpenConnectors: () => void
  readonly onPublish: () => void
  readonly onShare: () => void
}

const ICON_SIZE = 16

export function TopBar({
  projectName,
  mode,
  onModeChange,
  onProjectNameChange,
  onOpenConnectors,
  onPublish,
  onShare,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-left">
        <span className="brand-mark" aria-hidden="true" />
        <input
          aria-label="Project name"
          className="project-name"
          maxLength={80}
          onChange={(event) => onProjectNameChange(event.currentTarget.value)}
          spellCheck={false}
          title="Rename project"
          value={projectName}
        />
      </div>

      <div className="top-center">
        <div className="mode-tabs" role="tablist" aria-label="Workspace mode">
          <button
            aria-selected={mode === "preview"}
            className={`mode-button${mode === "preview" ? " active" : ""}`}
            onClick={() => onModeChange("preview")}
            role="tab"
            title="Preview"
            type="button"
          >
            <Eye aria-hidden="true" size={ICON_SIZE} />
            Preview
          </button>
          <button
            aria-selected={mode === "code"}
            className={`mode-button${mode === "code" ? " active" : ""}`}
            onClick={() => onModeChange("code")}
            role="tab"
            title="Code"
            type="button"
          >
            <Code2 aria-hidden="true" size={ICON_SIZE} />
            Code
          </button>
        </div>
      </div>

      <div className="top-right">
        <button
          aria-label="Open connectors"
          className="icon-button"
          onClick={onOpenConnectors}
          title="Open connectors"
          type="button"
        >
          <Blocks aria-hidden="true" size={ICON_SIZE} />
        </button>
        <button className="ghost-button" onClick={onShare} title="Share project" type="button">
          <Share2 aria-hidden="true" size={ICON_SIZE} />
          Share
        </button>
        <button
          className="primary-button"
          onClick={onPublish}
          title="Publish project"
          type="button"
        >
          <Rocket aria-hidden="true" size={ICON_SIZE} />
          Publish
        </button>
      </div>
    </header>
  )
}
