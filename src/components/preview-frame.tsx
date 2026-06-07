"use client"

import { Monitor, RefreshCw, Smartphone } from "lucide-react"
import { useMemo, useState } from "react"
import type { GeneratedFile } from "@/lib/contracts"

type PreviewFrameProps = {
  readonly files: readonly GeneratedFile[]
  readonly projectName: string
  readonly isGenerating?: boolean
}

type Viewport = "desktop" | "mobile"

export function buildPreviewDocument(files: readonly GeneratedFile[]): string {
  const html = files.find((file) => file.language === "html")?.content ?? ""
  const css = files.find((file) => file.language === "css")?.content ?? ""
  const javascript = files.find((file) => file.language === "javascript")?.content ?? ""
  const safeCss = css.replaceAll("</style", "<\\/style")
  const safeJavascript = javascript.replaceAll("</script", "<\\/script")
  const documentBody =
    html ||
    '<main style="font-family: sans-serif; padding: 48px"><h1>Your preview will appear here.</h1></main>'

  if (documentBody.toLowerCase().includes("<html")) {
    const withStyles = documentBody.includes("</head>")
      ? documentBody.replace("</head>", `<style>${safeCss}</style></head>`)
      : documentBody
    return withStyles.includes("</body>")
      ? withStyles.replace("</body>", `<script>${safeJavascript}</script></body>`)
      : `${withStyles}<script>${safeJavascript}</script>`
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${safeCss}</style>
  </head>
  <body>${documentBody}<script>${safeJavascript}</script></body>
</html>`
}

export function PreviewFrame({ files, projectName, isGenerating = false }: PreviewFrameProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [refreshKey, setRefreshKey] = useState(0)
  const previewDocument = useMemo(() => buildPreviewDocument(files), [files])

  return (
    <section className="preview-shell" aria-label="App preview">
      <header className="preview-toolbar">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-address">
          <span className={isGenerating ? "status-dot generating" : "status-dot"} />
          <span>
            {isGenerating
              ? "Building preview…"
              : `${projectName.toLowerCase().replaceAll(" ", "-")}.canvas.app`}
          </span>
        </div>
        <div className="preview-actions">
          <button
            type="button"
            className={viewport === "desktop" ? "active" : ""}
            onClick={() => setViewport("desktop")}
            aria-label="Desktop preview"
            aria-pressed={viewport === "desktop"}
            title="Desktop preview"
          >
            <Monitor size={15} />
          </button>
          <button
            type="button"
            className={viewport === "mobile" ? "active" : ""}
            onClick={() => setViewport("mobile")}
            aria-label="Mobile preview"
            aria-pressed={viewport === "mobile"}
            title="Mobile preview"
          >
            <Smartphone size={15} />
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            aria-label="Refresh preview"
            title="Refresh preview"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>
      <div className="preview-stage" data-viewport={viewport}>
        <iframe
          key={refreshKey}
          className="preview-iframe"
          srcDoc={previewDocument}
          title={`${projectName} preview`}
          sandbox="allow-forms allow-modals allow-popups allow-scripts"
        />
      </div>
      <style jsx>{`
        .preview-shell { display: flex; height: 100%; min-height: 0; flex-direction: column; background: #101113; }
        .preview-toolbar { display: grid; height: 48px; flex: 0 0 48px; grid-template-columns: 1fr minmax(180px, 420px) 1fr; align-items: center; border-bottom: 1px solid #2b2d31; padding: 0 12px; background: #18191c; }
        .window-controls { display: flex; gap: 6px; }
        .window-controls span { width: 8px; height: 8px; border-radius: 50%; background: #3b3d42; }
        .window-controls span:first-child { background: #f46d5d; }
        .window-controls span:nth-child(2) { background: #e7b553; }
        .window-controls span:last-child { background: #58b785; }
        .preview-address { display: flex; min-width: 0; align-items: center; justify-content: center; gap: 8px; border: 1px solid #303237; border-radius: 5px; background: #121315; padding: 6px 12px; color: #858991; font-size: 11px; }
        .preview-address span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .status-dot { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: #58b785; box-shadow: 0 0 0 3px #58b7851f; }
        .status-dot.generating { background: #efb450; animation: pulse 1.1s ease-in-out infinite; }
        .preview-actions { display: flex; justify-content: flex-end; gap: 3px; }
        button { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #8c9098; cursor: pointer; transition: 140ms ease; }
        button:hover, button.active { border-color: #36383e; background: #27292e; color: #f1f2f4; }
        button:focus-visible { outline: 2px solid #8aa0ff; outline-offset: 1px; }
        .preview-stage { display: flex; min-height: 0; flex: 1; justify-content: center; overflow: auto; background: #0d0e10; padding: 12px; }
        .preview-iframe { width: 100%; height: 100%; border: 0; background: white; box-shadow: 0 0 0 1px #2d3035; transition: width 220ms ease, border-radius 220ms ease; }
        .preview-stage[data-viewport="mobile"] { padding: 18px; }
        .preview-stage[data-viewport="mobile"] .preview-iframe { width: min(390px, 100%); border-radius: 16px; }
        @keyframes pulse { 50% { opacity: .35; } }
        @media (max-width: 700px) {
          .preview-toolbar { grid-template-columns: auto 1fr auto; gap: 8px; }
          .window-controls { display: none; }
          .preview-address { justify-content: flex-start; }
        }
      `}</style>
    </section>
  )
}
