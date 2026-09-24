// Generates every SVG in assets/ for the profile README.
// Edit the data below, then run: node scripts/build.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// LachlanCB brand: purple + black, Inter + JetBrains Mono.
const C = {
  bg: "#0A0A0B",
  surface: "#111114",
  raised: "#16161B",
  line: "#26262D",
  text: "#FFFFFF",
  soft: "#E5E7EB",
  muted: "#9CA3AF",
  dim: "#6B7280",
  purple: "#C084FC",
  violet: "#A855F7",
  deep: "#7C3AED",
  lilac: "#D8B4FE",
};
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function write(path, svg) {
  const file = join(root, "assets", path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg.trim() + "\n");
  console.log("wrote assets/" + path);
}

function wrap(text, max) {
  const lines = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const next = cur ? cur + " " + word : word;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Shared gradient for purple text and borders.
const ink = (id) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.lilac}"/>
    <stop offset=".55" stop-color="${C.purple}"/>
    <stop offset="1" stop-color="${C.deep}"/>
  </linearGradient>`;

// Pill: rounded rect with centred-left text. Width estimated from a mono char width.
function pill({ x, y, h = 26, text, size = 12, cw = 7.3, fill = C.raised, stroke = C.line, color = C.lilac, dot = null }) {
  const pad = 11;
  const dotW = dot ? 14 : 0;
  const w = Math.round(text.length * cw + pad * 2 + dotW);
  const dotSvg = dot
    ? `<circle cx="${x + pad + 3}" cy="${y + h / 2}" r="3.5" fill="${dot}">
        <animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/>
      </circle>`
    : "";
  return {
    w,
    svg: `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}"/>
    ${dotSvg}
    <text x="${x + pad + dotW}" y="${y + h / 2 + size * 0.36}" textLength="${Math.round(text.length * cw)}" font-family="${MONO}" font-size="${size}" fill="${color}">${esc(text)}</text>`,
  };
}

// ---------------------------------------------------------------- hero
function hero() {
  const W = 1200;
  const H = 420;
  const x0 = 64;

  // Typed line: "> shipping <phrase>" with a moving cursor.
  const phrases = ["AI agents", "automation systems", "internal tools", "client portals", "self-hosted infra"];
  const slot = 3.2;
  const T = slot * phrases.length;
  const cw = 12; // mono char width at 20px
  const px = x0 + "> shipping ".length * cw;
  const kt = (t) => +(t / T).toFixed(4);
  const widths = phrases.map((p) => p.length * cw + 2);
  const anim = (pts) => `values="${pts.map((p) => p[1]).join(";")}" keyTimes="${pts.map((p) => kt(p[0])).join(";")}"`;

  const typed = phrases
    .map((p, i) => {
      const s = i * slot;
      const w = widths[i];
      const pts = [[s, 0], [s + 1, w], [s + 2.4, w], [s + 2.8, 0], [T, 0]];
      if (s > 0) pts.unshift([0, 0]);
      // Without SMIL the first phrase shows in full and the rest stay hidden.
      return `
    <clipPath id="cp${i}"><rect x="${px}" y="296" height="30" width="${i === 0 ? w : 0}">
      <animate attributeName="width" dur="${T}s" repeatCount="indefinite" ${anim(pts)}/>
    </rect></clipPath>
    <text x="${px}" y="318" clip-path="url(#cp${i})" textLength="${p.length * cw}" font-family="${MONO}" font-size="20" fill="${C.purple}">${esc(p)}</text>`;
    })
    .join("");

  const cursorPts = [];
  phrases.forEach((_, i) => {
    const s = i * slot;
    const w = widths[i];
    cursorPts.push([s, px + 2], [s + 1, px + w + 2], [s + 2.4, px + w + 2], [s + 2.8, px + 2]);
  });
  cursorPts.push([T, px + 2]);

  // Chips under the headline.
  let cx = x0;
  const chips = [
    { text: "open to founder-led teams", dot: C.purple },
    { text: "Chiang Mai, TH" },
    { text: "20+ products shipped" },
  ]
    .map((c) => {
      const p = pill({ x: cx, y: 356, h: 32, text: c.text, size: 13, cw: 7.8, fill: C.surface, color: C.muted, dot: c.dot });
      cx += p.w + 10;
      return p.svg;
    })
    .join("");

  // Right panel: how a typical build flows.
  const nodes = {
    in: [["webhook", 130], ["cron", 215], ["inbox", 300]],
    out: [["crm", 130], ["dashboard", 215], ["telegram", 300]],
  };
  const inX = 720, inW = 104, agX = 915, agW = 150, agH = 64, outX = 1095, outW = 112, nh = 38;
  const node = (label, x, y, w) => `
    <rect x="${x - w / 2}" y="${y - nh / 2}" width="${w}" height="${nh}" rx="${nh / 2}" fill="${C.surface}" stroke="${C.line}"/>
    <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${C.soft}">${label}</text>`;

  const edges = [];
  nodes.in.forEach(([, y], i) => {
    const x1 = inX + inW / 2, x2 = agX - agW / 2, mid = (x1 + x2) / 2;
    edges.push({ d: `M${x1} ${y} C${mid} ${y} ${mid} 215 ${x2} 215`, begin: i * 0.8 });
  });
  nodes.out.forEach(([, y], i) => {
    const x1 = agX + agW / 2, x2 = outX - outW / 2, mid = (x1 + x2) / 2;
    edges.push({ d: `M${x1} 215 C${mid} 215 ${mid} ${y} ${x2} ${y}`, begin: 1.2 + i * 0.8 });
  });
  const edgeSvg = edges
    .map(
      (e) => `
    <path d="${e.d}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
    <path d="${e.d}" fill="none" stroke="${C.purple}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="3 9">
      <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.2s" repeatCount="indefinite"/>
    </path>
    <circle r="6" fill="${C.purple}" opacity="0">
      <animateMotion dur="2.4s" begin="${e.begin}s" repeatCount="indefinite" path="${e.d}"/>
      <animate attributeName="opacity" values="0;.3;.3;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="${e.begin}s" repeatCount="indefinite"/>
    </circle>
    <circle r="2.8" fill="${C.lilac}" opacity="0">
      <animateMotion dur="2.4s" begin="${e.begin}s" repeatCount="indefinite" path="${e.d}"/>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="${e.begin}s" repeatCount="indefinite"/>
    </circle>`,
    )
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">LachlanCB, Growth Operator</title>
  <desc id="desc">I build the systems a business runs on: AI agents, automation systems, internal tools, client portals and self-hosted infrastructure.</desc>
  <defs>
    ${ink("ink")}
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.purple}"/>
      <stop offset=".35" stop-color="${C.line}"/>
      <stop offset=".65" stop-color="${C.line}"/>
      <stop offset="1" stop-color="${C.deep}"/>
      <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="14s" repeatCount="indefinite"/>
    </linearGradient>
    <radialGradient id="glowA">
      <stop offset="0" stop-color="${C.deep}" stop-opacity=".42"/>
      <stop offset="1" stop-color="${C.deep}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB">
      <stop offset="0" stop-color="${C.purple}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${C.purple}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fadeGrad" cx=".5" cy=".4" r=".7">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <mask id="fade"><rect width="${W}" height="${H}" fill="url(#fadeGrad)"/></mask>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#FFFFFF" fill-opacity=".07"/>
    </pattern>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="20" fill="${C.bg}"/>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#fade)"/>
    <circle cx="960" cy="110" r="340" fill="url(#glowA)">
      <animate attributeName="cx" values="960;1040;960" dur="16s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="110;170;110" dur="16s" repeatCount="indefinite"/>
    </circle>
    <circle cx="120" cy="430" r="300" fill="url(#glowB)">
      <animate attributeName="cx" values="120;220;120" dur="20s" repeatCount="indefinite"/>
    </circle>
  </g>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="19.5" fill="none" stroke="url(#edge)" stroke-width="1.5"/>

  <text x="${x0}" y="86" font-family="${MONO}" font-size="17"><tspan fill="${C.purple}">lachy@chiangmai</tspan><tspan fill="${C.dim}">:</tspan><tspan fill="${C.muted}">~</tspan><tspan fill="${C.dim}">$ </tspan><tspan fill="${C.text}">whoami</tspan></text>

  <text x="${x0 - 3}" y="176" font-family="${SANS}" font-size="80" font-weight="800" letter-spacing="-2.5" fill="${C.text}">Lachlan<tspan fill="url(#ink)">CB</tspan></text>

  <text x="${x0}" y="222" font-family="${MONO}" font-size="15" letter-spacing="5" fill="${C.purple}">GROWTH OPERATOR</text>
  <text x="${x0}" y="264" font-family="${SANS}" font-size="26" font-weight="500" fill="${C.soft}">I build the systems a business runs on.</text>

  <text x="${x0}" y="318" textLength="${10 * cw}" font-family="${MONO}" font-size="20"><tspan fill="${C.dim}">&gt; </tspan><tspan fill="${C.muted}">shipping</tspan></text>
  ${typed}
  <rect x="${px + widths[0] + 2}" y="301" width="11" height="22" rx="1.5" fill="${C.purple}">
    <animate attributeName="x" dur="${T}s" repeatCount="indefinite" ${anim(cursorPts)}/>
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1s" repeatCount="indefinite"/>
  </rect>

  ${chips}

  <text x="668" y="86" font-family="${MONO}" font-size="13" fill="${C.dim}">// how my builds run</text>
  ${edgeSvg}
  ${nodes.in.map(([l, y]) => node(l, inX, y, inW)).join("")}
  ${nodes.out.map(([l, y]) => node(l, outX, y, outW)).join("")}
  <rect x="${agX - agW / 2 - 6}" y="${215 - agH / 2 - 6}" width="${agW + 12}" height="${agH + 12}" rx="20" fill="none" stroke="${C.purple}" stroke-width="1.5" opacity="0">
    <animate attributeName="opacity" values="0;.55;0" dur="3s" repeatCount="indefinite"/>
  </rect>
  <rect x="${agX - agW / 2}" y="${215 - agH / 2}" width="${agW}" height="${agH}" rx="16" fill="${C.raised}" stroke="url(#ink)" stroke-width="1.5"/>
  <text x="${agX}" y="211" text-anchor="middle" font-family="${SANS}" font-size="19" font-weight="700" fill="${C.text}">agent</text>
  <text x="${agX}" y="232" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${C.muted}">claude + n8n</text>
</svg>`;
}

// ---------------------------------------------------------------- stats
function stats(items) {
  const W = 1200, H = 150, gap = 16, tw = (W - gap * (items.length - 1)) / items.length, th = 140, y = 5;
  const tiles = items
    .map(([num, label, sub], i) => {
      const x = i * (tw + gap);
      return `
  <g class="t" style="animation-delay:${(i * 0.12).toFixed(2)}s">
    <rect x="${x + 0.75}" y="${y}" width="${tw - 1.5}" height="${th}" rx="16" fill="${C.bg}" stroke="${C.line}" stroke-width="1.5"/>
    <rect x="${x + 24}" y="${y}" height="2" width="60" rx="1" fill="url(#ink)">
      <animate attributeName="width" from="0" to="60" dur=".9s" begin="${(0.2 + i * 0.12).toFixed(2)}s" fill="freeze"/>
    </rect>
    <text x="${x + tw - 24}" y="${y + 32}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.dim}">0${i + 1}</text>
    <text x="${x + 22}" y="${y + 80}" font-family="${SANS}" font-size="54" font-weight="800" letter-spacing="-1.5" fill="url(#ink)">${esc(num)}</text>
    <text x="${x + 24}" y="${y + 107}" font-family="${SANS}" font-size="16" font-weight="600" fill="${C.soft}">${esc(label)}</text>
    <text x="${x + 24}" y="${y + 127}" font-family="${SANS}" font-size="14" fill="${C.muted}">${esc(sub)}</text>
  </g>`;
    })
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
  <title id="title">${esc(items.map(([n, l, s]) => `${n} ${l} ${s}`).join(" · "))}</title>
  <defs>${ink("ink")}</defs>
  <style>
    .t { animation: rise .7s cubic-bezier(.2,.7,.2,1) backwards; }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
  ${tiles}
</svg>`;
}

// ---------------------------------------------------------------- project cards
function card(c) {
  const W = 600, H = 230;
  const lines = wrap(c.desc, 70).slice(0, 3);
  const statusColor = { public: C.muted, private: C.dim, live: C.purple, "in production": C.purple }[c.status];
  const status = pill({ x: 0, y: 24, text: c.status, size: 12, cw: 7.3, fill: C.surface, color: statusColor, dot: statusColor });
  const statusSvg = pill({ x: W - 24 - status.w, y: 24, text: c.status, size: 12, cw: 7.3, fill: C.surface, color: statusColor, dot: statusColor }).svg;

  let tx = 28;
  const tags = c.tags
    .map((t) => {
      const p = pill({ x: tx, y: 180, text: t });
      tx += p.w + 8;
      return p.svg;
    })
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(c.title)}</title>
  <desc id="desc">${esc(c.desc)}</desc>
  <defs>
    ${ink("ink")}
    <radialGradient id="glow">
      <stop offset="0" stop-color="${C.deep}" stop-opacity=".32"/>
      <stop offset="1" stop-color="${C.deep}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.purple}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${C.purple}" stop-opacity=".8"/>
      <stop offset="1" stop-color="${C.purple}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
  <g clip-path="url(#card)">
    <circle cx="${W - 20}" cy="-10" r="240" fill="url(#glow)">
      <animate attributeName="opacity" values="1;.55;1" dur="6s" repeatCount="indefinite"/>
    </circle>
    <rect x="-200" y="0" width="200" height="1.5" fill="url(#sheen)">
      <animate attributeName="x" values="-200;${W}" dur="5s" repeatCount="indefinite"/>
    </rect>
  </g>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="17.25" fill="none" stroke="${C.line}" stroke-width="1.5"/>

  <text x="28" y="42" font-family="${MONO}" font-size="13" fill="${C.purple}">${esc(c.path)}</text>
  ${statusSvg}
  <text x="28" y="84" font-family="${SANS}" font-size="25" font-weight="700" letter-spacing="-.4" fill="${C.text}">${esc(c.title)}</text>
  ${lines.map((l, i) => `<text x="28" y="${114 + i * 22}" font-family="${SANS}" font-size="15" fill="${C.muted}">${esc(l)}</text>`).join("\n  ")}
  ${tags}
</svg>`;
}

// ---------------------------------------------------------------- data
const STATS = [
  ["20+", "products shipped", "end to end"],
  ["17", "self-hosted services", "running in production"],
  ["29", "scheduled jobs", "running on cron"],
  ["1", "operator", "no engineering team"],
];

const CARDS = [
  // Public repos
  {
    file: "time-guide",
    path: "LachyAI/time-guide",
    status: "public",
    title: "8 AI voice agents",
    desc: "A Time Guide, a Future Self, a Stoic Advisor, a Sales Coach and four more. You talk, they talk back. ElevenLabs does the voice, Claude does the thinking.",
    tags: ["ElevenLabs", "Claude", "Next.js", "TypeScript"],
  },
  {
    file: "demo-site-generator",
    path: "LachyAI/demo-site-generator",
    status: "public",
    title: "Demo sites in minutes",
    desc: "Turns a business profile into a complete branded demo website, so a prospect sees their new site live on the sales call.",
    tags: ["Next.js", "Vercel Blob", "framer-motion", "TypeScript"],
  },
  {
    file: "content-os",
    path: "LachyAI/content-os",
    status: "public",
    title: "Content OS",
    desc: "Tracks competitor Instagram accounts, runs the content board and shows which posts actually perform.",
    tags: ["Next.js", "Supabase", "framer-motion", "TypeScript"],
  },
  {
    file: "content-engine",
    path: "LachyAI/content-engine",
    status: "public",
    title: "Content engine",
    desc: "Idea browser, multi-platform publishing and day-to-day content ops for creators, all in one dashboard.",
    tags: ["React", "TypeScript"],
  },
  // Private builds, described without client names or verticals
  {
    file: "ops-platform",
    path: "client build",
    status: "private",
    title: "20+ module ops platform",
    desc: "Built from zero for an e-commerce client. Tasks, team chat, a shared inbox, an AI assistant that uses tools, an encrypted vault and push alerts. In daily use.",
    tags: ["AI assistant", "tool use", "AES-256 vault", "auth + roles"],
  },
  {
    file: "document-pipeline",
    path: "client build",
    status: "private",
    title: "Document AI pipeline",
    desc: "Upload a scan. A vision model reads the values, a rules engine writes the report, the owner approves it in Telegram and the client gets a bilingual PDF.",
    tags: ["vision AI", "rules engine", "Telegram", "PDF"],
  },
  {
    file: "multi-tenant-saas",
    path: "saas",
    status: "private",
    title: "Multi-tenant SaaS",
    desc: "One codebase, many client dashboards. Each tenant sees only its own data, enforced in the database with row-level security.",
    tags: ["Next.js", "Supabase", "Postgres RLS"],
  },
  {
    file: "automation-stack",
    path: "infra",
    status: "in production",
    title: "Self-hosted automation stack",
    desc: "One VPS running n8n, a LangGraph agent API, Postgres, Redis and a CDN. A Telegram bot runs Claude Code on it from my phone.",
    tags: ["Docker", "n8n", "LangGraph", "Caddy"],
  },
  {
    file: "ask-lachy",
    path: "lachlancb.me",
    status: "live",
    title: "Ask Lachy: RAG chat",
    desc: "A chat widget that answers only from what I've published. BM25 retrieval, streamed answers, prompt-injection guards and per-IP rate limits.",
    tags: ["Next.js", "RAG", "streaming"],
  },
  {
    file: "ai-operating-system",
    path: "tooling",
    status: "private",
    title: "My AI operating system",
    desc: "Claude Code with custom skills, hooks, a memory layer and six specialist agents for sales, SEO, copy and ops. It's how everything above gets built.",
    tags: ["Claude Code", "MCP", "subagents", "hooks"],
  },
];

write("hero.svg", hero());
write("stats.svg", stats(STATS));
for (const c of CARDS) write(`cards/${c.file}.svg`, card(c));
