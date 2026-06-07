import type { AgentResponse, GeneratedFile } from "@/lib/contracts"

const html = `<main class="site-shell">
  <nav>
    <a class="brand" href="#"><span></span> Northstar</a>
    <div class="nav-links"><a href="#work">Work</a><a href="#about">About</a></div>
    <button>Start a project</button>
  </nav>
  <section class="hero">
    <p class="eyebrow">Independent creative studio · Copenhagen</p>
    <h1>Digital work with a pulse.</h1>
    <p class="intro">We shape useful brands and expressive digital experiences for teams moving culture forward.</p>
    <div class="actions"><button>See our work</button><a href="#about">Meet the studio →</a></div>
  </section>
  <section class="ticker"><span>Identity</span><span>Digital</span><span>Motion</span><span>Strategy</span></section>
  <section id="work" class="work">
    <article><p>01 / Brand platform</p><h2>Good Days</h2><span>Food & beverage</span></article>
    <article><p>02 / Digital flagship</p><h2>Form / Field</h2><span>Design & architecture</span></article>
  </section>
</main>`

const css = `:root{font-family:Arial,sans-serif;color:#181714;background:#f1eee7}*{box-sizing:border-box}body{margin:0}.site-shell{min-height:100vh;overflow:hidden}nav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid #c7c2b7}nav a{color:inherit;text-decoration:none}.brand{font-weight:800;font-size:20px}.brand span{display:inline-block;width:12px;height:12px;background:#ff4b2b;border-radius:50%;margin-right:8px}.nav-links{display:flex;gap:30px}button{border:1px solid #181714;background:#181714;color:#fff;padding:12px 18px;border-radius:0}.hero{padding:11vh 5vw 9vh;max-width:1100px}.eyebrow{text-transform:uppercase;font-size:11px;letter-spacing:2px}.hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(64px,10vw,150px);line-height:.86;letter-spacing:-7px;max-width:950px;margin:35px 0}.intro{font-size:19px;line-height:1.5;max-width:540px}.actions{display:flex;align-items:center;gap:26px;margin-top:34px}.actions a{color:inherit}.ticker{background:#ff4b2b;color:#181714;padding:20px 5vw;display:flex;justify-content:space-between;text-transform:uppercase;font-weight:800}.work{display:grid;grid-template-columns:1fr 1fr;min-height:320px}.work article{padding:40px 5vw;background:#d7d0c2;border-right:1px solid #b6ad9c}.work article+article{background:#292a25;color:#eee}.work h2{font-family:Georgia,serif;font-size:48px;font-weight:400;margin:80px 0 10px}@media(max-width:700px){.nav-links{display:none}.hero h1{letter-spacing:-3px}.ticker{gap:25px;overflow:auto}.work{grid-template-columns:1fr}.work article{min-height:270px}}`

const javascript = `document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Let's make something";
  });
});`

export const starterFiles: readonly GeneratedFile[] = [
  { path: "index.html", language: "html", content: html },
  { path: "styles.css", language: "css", content: css },
  { path: "app.js", language: "javascript", content: javascript },
]

export function createDemoResponse(prompt: string): AgentResponse {
  const trimmed = prompt.trim()
  const accent = trimmed.toLowerCase().includes("blue") ? "#478cff" : "#ff4b2b"
  const files = starterFiles.map((file) =>
    file.path === "styles.css"
      ? { ...file, content: file.content.replaceAll("#ff4b2b", accent) }
      : file,
  )

  return {
    title: "Refined the project direction",
    summary: `I translated “${trimmed}” into a focused creative landing page, then tightened the responsive layout and interaction details.`,
    files,
    tasks: [
      "Mapped the visual direction",
      "Built the responsive page structure",
      "Added live interaction details",
    ],
    source: "demo",
  }
}
