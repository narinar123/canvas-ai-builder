"use client"

import type { LucideIcon } from "lucide-react"
import { Braces, FileCode2, Palette } from "lucide-react"
import type { GeneratedFile } from "@/lib/contracts"

type CodeEditorProps = {
  readonly files: readonly GeneratedFile[]
  readonly activePath: string | null
  readonly onSelectFile: (path: string) => void
  readonly onFileChange: ((path: string, content: string) => void) | undefined
}

const fileIcons: Record<GeneratedFile["language"], LucideIcon> = {
  html: FileCode2,
  css: Palette,
  javascript: Braces,
}

export function CodeEditor({ files, activePath, onSelectFile, onFileChange }: CodeEditorProps) {
  const selectedFile = files.find((file) => file.path === activePath) ?? files[0]
  const lineCount = selectedFile?.content.split("\n").length ?? 0

  return (
    <section className="editor-shell" aria-label="Code editor">
      <aside className="file-rail">
        <div className="rail-heading">
          <span>Files</span>
          <span>{files.length}</span>
        </div>
        <nav aria-label="Project files">
          {files.map((file) => {
            const FileIcon = fileIcons[file.language]
            return (
              <button
                type="button"
                key={file.path}
                className={file.path === selectedFile?.path ? "active" : ""}
                onClick={() => onSelectFile(file.path)}
              >
                <FileIcon size={14} />
                <span>{file.path}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <div className="editor-workspace">
        {selectedFile ? (
          <>
            <header className="editor-heading">
              <div>
                <span className={`language-dot ${selectedFile.language}`} />
                <strong>{selectedFile.path}</strong>
              </div>
              <span>
                {lineCount} {lineCount === 1 ? "line" : "lines"} · {selectedFile.language}
              </span>
            </header>
            <label className="sr-only" htmlFor="project-code">
              Edit {selectedFile.path}
            </label>
            <textarea
              id="project-code"
              value={selectedFile.content}
              onChange={(event) => onFileChange?.(selectedFile.path, event.currentTarget.value)}
              readOnly={!onFileChange}
              spellCheck={false}
              aria-readonly={!onFileChange}
            />
            <footer>
              <span>UTF-8</span>
              <span>{onFileChange ? "Changes update preview instantly" : "Generated file"}</span>
            </footer>
          </>
        ) : (
          <div className="empty-state">
            <FileCode2 size={22} />
            <strong>No files yet</strong>
            <span>Ask the agent to build your first screen.</span>
          </div>
        )}
      </div>
      <style jsx>{`
        .editor-shell { display: grid; height: 100%; min-height: 0; grid-template-columns: 174px minmax(0, 1fr); background: #101113; color: #d9dce2; }
        .file-rail { min-width: 0; border-right: 1px solid #292b30; background: #16171a; padding: 12px 8px; }
        .rail-heading { display: flex; align-items: center; justify-content: space-between; padding: 3px 8px 10px; color: #777b84; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .rail-heading span:last-child { display: grid; min-width: 18px; height: 18px; place-items: center; border-radius: 3px; background: #25272c; color: #9da1aa; font-size: 9px; }
        nav { display: grid; gap: 2px; }
        button { display: flex; width: 100%; min-width: 0; align-items: center; gap: 8px; border: 0; border-radius: 4px; background: transparent; padding: 8px; color: #858993; font: inherit; font-size: 11px; text-align: left; cursor: pointer; }
        button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        button:hover, button.active { background: #23252a; color: #f2f3f5; }
        button.active { box-shadow: inset 2px 0 #8aa0ff; }
        button:focus-visible { outline: 2px solid #8aa0ff; outline-offset: -2px; }
        .editor-workspace { display: flex; min-width: 0; min-height: 0; flex-direction: column; }
        .editor-heading, footer { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #292b30; background: #191a1e; padding: 0 14px; }
        .editor-heading { height: 44px; flex: 0 0 44px; }
        .editor-heading div { display: flex; align-items: center; gap: 8px; }
        .editor-heading strong { font-size: 11px; font-weight: 600; }
        .editor-heading > span, footer { color: #6f737c; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
        .language-dot { width: 7px; height: 7px; border-radius: 2px; background: #e86f52; }
        .language-dot.css { background: #62a2ed; }
        .language-dot.javascript { background: #e2be54; }
        textarea { width: 100%; min-height: 0; flex: 1; resize: none; border: 0; outline: 0; background: #111215; padding: 18px 20px 40px; color: #cfd3da; caret-color: #9db0ff; font-family: var(--font-mono), monospace; font-size: 12px; line-height: 1.75; tab-size: 2; }
        textarea::selection { background: #5069bd66; }
        footer { height: 28px; flex: 0 0 28px; border-top: 1px solid #292b30; border-bottom: 0; }
        .empty-state { display: grid; height: 100%; place-content: center; justify-items: center; gap: 8px; color: #767a83; font-size: 11px; text-align: center; }
        .empty-state strong { color: #c9ccd2; font-size: 13px; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }
        @media (max-width: 760px) {
          .editor-shell { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
          .file-rail { border-right: 0; border-bottom: 1px solid #292b30; padding: 6px; }
          .rail-heading { display: none; }
          nav { display: flex; overflow-x: auto; }
          button { width: auto; flex: 0 0 auto; }
          button.active { box-shadow: inset 0 -2px #8aa0ff; }
        }
      `}</style>
    </section>
  )
}
