"use client"

import { Code2, Eye, PanelRightOpen } from "lucide-react"
import { useState } from "react"
import { CodeEditor } from "@/components/code-editor"
import { PreviewFrame } from "@/components/preview-frame"
import type { GeneratedFile } from "@/lib/contracts"

type WorkspacePanelProps = {
  readonly files: readonly GeneratedFile[]
  readonly projectName?: string
  readonly isGenerating?: boolean
  readonly mode?: WorkspaceView
  readonly onModeChange?: (mode: WorkspaceView) => void
  readonly onFileChange?: (path: string, content: string) => void
  readonly onFilesChange?: (files: readonly GeneratedFile[]) => void
}

type WorkspaceView = "preview" | "code"

export function WorkspacePanel({
  files,
  projectName = "Untitled project",
  isGenerating = false,
  mode,
  onModeChange,
  onFileChange,
  onFilesChange,
}: WorkspacePanelProps) {
  const [internalView, setInternalView] = useState<WorkspaceView>("preview")
  const [selectedPath, setSelectedPath] = useState<string | null>(files[0]?.path ?? null)
  const view = mode ?? internalView
  const activePath = files.some((file) => file.path === selectedPath)
    ? selectedPath
    : (files[0]?.path ?? null)
  const updateFile = (path: string, content: string): void => {
    if (onFileChange) {
      onFileChange(path, content)
      return
    }
    onFilesChange?.(files.map((file) => (file.path === path ? { ...file, content } : file)))
  }
  const selectView = (nextView: WorkspaceView): void => {
    setInternalView(nextView)
    onModeChange?.(nextView)
  }

  return (
    <section className="workspace-panel" aria-label="Builder workspace">
      <header className="workspace-heading">
        <div className="workspace-title">
          <PanelRightOpen size={14} />
          <div>
            <strong>{view === "preview" ? "Live canvas" : "Project source"}</strong>
            <span>
              {isGenerating ? "Agent is updating your project" : `${files.length} files ready`}
            </span>
          </div>
        </div>
        <fieldset className="view-switcher">
          <legend className="sr-only">Workspace view</legend>
          <button
            type="button"
            className={view === "preview" ? "active" : ""}
            onClick={() => selectView("preview")}
            aria-pressed={view === "preview"}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className={view === "code" ? "active" : ""}
            onClick={() => selectView("code")}
            aria-pressed={view === "code"}
          >
            <Code2 size={14} />
            <span>Code</span>
          </button>
        </fieldset>
      </header>
      <div className="workspace-body">
        {view === "preview" ? (
          <PreviewFrame files={files} projectName={projectName} isGenerating={isGenerating} />
        ) : (
          <CodeEditor
            files={files}
            activePath={activePath}
            onSelectFile={setSelectedPath}
            onFileChange={onFileChange || onFilesChange ? updateFile : undefined}
          />
        )}
      </div>
      <style jsx>{`
        .workspace-panel { display: flex; height: 100%; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; border: 1px solid #2a2c31; border-radius: 7px; background: #101113; box-shadow: 0 18px 50px #0000003d; }
        .workspace-heading { display: flex; height: 56px; flex: 0 0 56px; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #2a2c31; padding: 0 12px 0 15px; background: #17181b; color: #dfe1e6; }
        .workspace-title { display: flex; min-width: 0; align-items: center; gap: 10px; }
        .workspace-title div { display: grid; min-width: 0; gap: 2px; }
        .workspace-title strong { overflow: hidden; font-size: 11px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
        .workspace-title span { overflow: hidden; color: #6f737c; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
        .view-switcher { display: flex; flex: 0 0 auto; gap: 2px; margin: 0; border: 1px solid #303239; border-radius: 5px; background: #111215; padding: 2px; }
        button { display: flex; height: 29px; align-items: center; gap: 6px; border: 0; border-radius: 3px; background: transparent; padding: 0 9px; color: #777b84; font: inherit; font-size: 10px; cursor: pointer; transition: 140ms ease; }
        button:hover, button.active { background: #292b30; color: #f0f1f3; }
        button.active { box-shadow: 0 1px 2px #0000003d; }
        button:focus-visible { outline: 2px solid #8aa0ff; outline-offset: 1px; }
        .workspace-body { min-height: 0; flex: 1; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }
        @media (max-width: 540px) {
          .workspace-heading { height: 50px; flex-basis: 50px; padding: 0 8px 0 12px; }
          .workspace-title span, button span { display: none; }
          button { width: 29px; justify-content: center; padding: 0; }
        }
      `}</style>
    </section>
  )
}
