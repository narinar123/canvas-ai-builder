"use client"

import { Check, ExternalLink, Search, Settings2, Unplug, X, Zap } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  type ConnectorDefinition,
  type ConnectorFilter,
  connectorCatalog,
  connectorFilters,
} from "@/lib/connectors"

type ConnectorModalProps = {
  readonly onClose: () => void
}

function ConnectorCard({
  connector,
  enabled,
  onToggle,
}: {
  readonly connector: ConnectorDefinition
  readonly enabled: boolean
  readonly onToggle: () => void
}) {
  return (
    <article className="connector-card">
      <div className="connector-mark" style={{ backgroundColor: connector.color }}>
        {connector.mark}
      </div>
      <div className="connector-copy">
        <h3>{connector.name}</h3>
        <p>{connector.description}</p>
      </div>
      <button
        aria-label={`${enabled ? "Disable" : "Set up"} ${connector.name}`}
        className={`connector-toggle ${enabled ? "is-enabled" : ""}`}
        type="button"
        onClick={onToggle}
      >
        {enabled ? <Check size={13} /> : <Zap size={13} />}
        {enabled ? "Enabled" : "Set up"}
      </button>
    </article>
  )
}

export function ConnectorModal({ onClose }: ConnectorModalProps) {
  const [filter, setFilter] = useState<ConnectorFilter>("All")
  const [query, setQuery] = useState("")
  const [enabledIds, setEnabledIds] = useState<ReadonlySet<string>>(
    () => new Set(connectorCatalog.filter((item) => item.enabled).map((item) => item.id)),
  )

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  const visibleConnectors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return connectorCatalog.filter((connector) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Enabled" && enabledIds.has(connector.id)) ||
        (filter !== "Enabled" && connector.categories.includes(filter))
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${connector.name} ${connector.description}`.toLocaleLowerCase().includes(normalizedQuery)
      return matchesFilter && matchesQuery
    })
  }, [enabledIds, filter, query])

  function countForFilter(candidate: ConnectorFilter): number {
    if (candidate === "All") return connectorCatalog.length
    if (candidate === "Enabled") return enabledIds.size
    return connectorCatalog.filter((item) => item.categories.includes(candidate)).length
  }

  function toggleConnector(id: string): void {
    setEnabledIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sectionTitle = filter === "All" || filter === "Enabled" ? "App connectors" : filter

  return (
    <div className="connector-overlay">
      <section
        aria-label="Connector explorer"
        aria-modal="true"
        className="connector-modal"
        role="dialog"
      >
        <aside className="connector-rail">
          <label className="connector-search">
            <Search size={16} />
            <input
              aria-label="Search connectors"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <nav aria-label="Connector categories">
            {connectorFilters.map((candidate) => (
              <button
                className={filter === candidate ? "is-active" : ""}
                key={candidate}
                type="button"
                onClick={() => setFilter(candidate)}
              >
                <span>{candidate}</span>
                <small>{countForFilter(candidate)}</small>
              </button>
            ))}
          </nav>
          <div className="connector-rail-actions">
            <div className="connector-request">
              <Unplug size={17} />
              <strong>Missing a connector?</strong>
              <button type="button">Request</button>
            </div>
            <button className="connector-admin" type="button">
              <Settings2 size={15} /> Admin settings
            </button>
          </div>
        </aside>
        <div className="connector-main">
          <header className="connector-header">
            <span>
              <Unplug size={16} /> Connectors {filter !== "All" ? `/ ${filter}` : ""}
            </span>
            <button aria-label="Close connectors" type="button" onClick={onClose}>
              <X size={18} />
            </button>
          </header>
          <div className="connector-scroll">
            <section className="connector-hero">
              <div className="connector-marquee" aria-hidden="true">
                {connectorCatalog.slice(0, 12).map((item) => (
                  <span key={item.id}>{item.mark}</span>
                ))}
              </div>
              <h2>Build from what you already use</h2>
              <p>Connect your agent to models, workflows, data, and the tools your team trusts.</p>
              <a href="https://docs.lovable.dev/" rel="noreferrer" target="_blank">
                View the docs <ExternalLink size={14} />
              </a>
            </section>
            <section className="connector-results">
              <div className="connector-section-heading">
                <div>
                  <h2>{sectionTitle}</h2>
                  <p>{visibleConnectors.length} integrations ready to connect</p>
                </div>
                <span>{enabledIds.size} enabled</span>
              </div>
              <div className="connector-grid">
                {visibleConnectors.map((connector) => (
                  <ConnectorCard
                    connector={connector}
                    enabled={enabledIds.has(connector.id)}
                    key={connector.id}
                    onToggle={() => toggleConnector(connector.id)}
                  />
                ))}
              </div>
              {visibleConnectors.length === 0 ? (
                <div className="connector-empty">
                  <Search size={18} />
                  <strong>No connectors found</strong>
                  <button type="button" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>
      <style jsx global>{`
        .connector-overlay{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:14px;background:#050606c7;backdrop-filter:blur(5px)}
        .connector-modal{width:min(1480px,100%);height:min(920px,calc(100dvh - 28px));display:grid;grid-template-columns:252px minmax(0,1fr);overflow:hidden;border:1px solid #373939;border-radius:12px;background:#171818;box-shadow:0 30px 100px #000c}
        .connector-rail{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:18px;padding:12px 10px;border-right:1px solid #2c2e2e;background:#141515}
        .connector-search{height:40px;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid #313333;border-radius:7px;color:#858986;background:#181919}.connector-search:focus-within{border-color:#6f9de4}.connector-search input{min-width:0;width:100%;border:0;outline:0;background:transparent}
        .connector-rail nav{overflow:auto}.connector-rail nav button{width:100%;height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border:0;border-radius:6px;background:transparent;color:#c2c5c1;text-align:left}.connector-rail nav button:nth-child(3){margin-top:16px}.connector-rail nav button:hover,.connector-rail nav button.is-active{background:#2a2c2c;color:#fff}.connector-rail nav small{color:#838783}
        .connector-rail-actions{display:grid;gap:8px}.connector-request{display:grid;gap:12px;padding:14px;border:1px solid #323434;border-radius:8px;background:linear-gradient(180deg,#1b1c1c,#161717)}.connector-request button,.connector-admin{height:34px;border:1px solid #393c3b;border-radius:6px;background:transparent;color:#d5d7d3}.connector-admin{display:flex;align-items:center;justify-content:center;gap:7px;background:#202221;color:#979b97}
        .connector-main{min-width:0;display:grid;grid-template-rows:58px minmax(0,1fr)}.connector-header{display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid #2d2f2f;color:#d8dad6}.connector-header span{display:flex;align-items:center;gap:8px;font-weight:650}.connector-header button{width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:#a6aaa6}.connector-header button:hover{background:#2a2c2c;color:#fff}.connector-scroll{overflow:auto}
        .connector-hero{position:relative;overflow:hidden;min-height:245px;padding:116px 36px 30px;border-bottom:1px solid #282a2a;text-align:center}.connector-marquee{position:absolute;inset:12px -30px auto;display:flex;justify-content:center;gap:10px;opacity:.3;filter:saturate(.45)}.connector-marquee span{width:47px;height:47px;display:grid;place-items:center;border:1px solid #444747;border-radius:50%;background:#222424;color:#ddd;font-size:11px;font-weight:800}.connector-hero h2{margin:0 0 8px;font-size:24px;letter-spacing:0}.connector-hero p{max-width:630px;margin:0 auto 18px;color:#9ea29d;line-height:1.5}.connector-hero a{height:34px;display:inline-flex;align-items:center;gap:6px;padding:0 12px;border:1px solid #464948;border-radius:6px;color:#e5e7e3;text-decoration:none}
        .connector-results{padding:32px 36px 48px}.connector-section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:20px}.connector-section-heading h2{margin:0 0 4px;font-size:21px}.connector-section-heading p,.connector-section-heading span{margin:0;color:#8d918d;font-size:12px}.connector-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .connector-card{min-width:0;min-height:76px;display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid #333535;border-radius:8px;background:#1b1c1c;transition:border-color .16s ease,background .16s ease}.connector-card:hover{border-color:#4a4d4c;background:#202121}.connector-mark{width:45px;height:45px;display:grid;place-items:center;border-radius:7px;color:#101111;font-size:11px;font-weight:850;box-shadow:0 0 0 1px #ffffff32 inset}.connector-copy{min-width:0}.connector-copy h3{margin:0 0 4px;font-size:14px}.connector-copy p{overflow:hidden;margin:0;color:#969a96;font-size:12px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}.connector-toggle{height:30px;display:flex;align-items:center;gap:5px;padding:0 9px;border:1px solid #424544;border-radius:6px;background:#242626;color:#afb3af;font-size:11px}.connector-toggle:hover{color:#fff}.connector-toggle.is-enabled{border-color:#315c39;background:#18391e;color:#70c779}.connector-empty{min-height:240px;display:grid;place-content:center;justify-items:center;gap:10px;color:#8e928e}.connector-empty button{border:0;background:transparent;color:#85b4fa}
        @media(max-width:880px){.connector-overlay{padding:0}.connector-modal{height:100dvh;border:0;border-radius:0;grid-template-columns:1fr}.connector-rail{display:none}.connector-results{padding:24px 16px 40px}.connector-grid{grid-template-columns:1fr}.connector-hero{min-height:220px;padding:105px 18px 24px}.connector-toggle{width:32px;padding:0;justify-content:center;font-size:0}.connector-copy p{white-space:normal}.connector-section-heading span{display:none}}
      `}</style>
    </div>
  )
}
