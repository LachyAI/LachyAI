// Renders dist/activity.svg from the public contribution calendar (private contributions included,
// since "Include private contributions" is on). Runs in .github/workflows/profile.yml.
// Locally: GITHUB_TOKEN=$(gh auth token) node scripts/activity.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { C, MONO, SANS, esc, ink } from "./brand.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const login = process.env.PROFILE_USER || "LachyAI";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "lachyai-profile" },
  body: JSON.stringify({ query, variables: { login } }),
});
if (!res.ok) throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
const json = await res.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));

const cal = json.data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks.map((w) => w.contributionDays);
const days = weeks.flat();

// Streaks: today may not have a commit yet, so a zero on the last day doesn't break the current streak.
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue;
  else break;
}
let longest = 0;
let run = 0;
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
const weekTotals = weeks.map((w) => w.reduce((n, d) => n + d.contributionCount, 0));
const activeDays = days.filter((d) => d.contributionCount > 0).length;
const bestWeek = Math.max(...weekTotals);

const fmt = (n) => n.toLocaleString("en-US");
const stats = [
  [fmt(cal.totalContributions), "contributions"],
  [fmt(activeDays), "active days"],
  [`${current}d`, "current streak"],
  [`${longest}d`, "longest streak"],
  [fmt(bestWeek), "best week"],
];

const W = 1200, H = 312, pad = 40;
const colW = (W - pad * 2) / stats.length;
const statSvg = stats
  .map(
    ([n, label], i) => `
  <text x="${pad + i * colW}" y="116" font-family="${SANS}" font-size="40" font-weight="800" letter-spacing="-1" fill="url(#ink)">${esc(n)}</text>
  <text x="${pad + i * colW + 2}" y="140" font-family="${SANS}" font-size="14" fill="${C.muted}">${esc(label)}</text>`,
  )
  .join("");

const top = 170, bottom = 268, gap = 4;
const bw = (W - pad * 2 - gap * (weekTotals.length - 1)) / weekTotals.length;
const bars = weekTotals
  .map((t, i) => {
    const x = pad + i * (bw + gap);
    const h = t ? Math.max(4, ((bottom - top) * t) / bestWeek) : 3;
    return `<rect class="b" style="animation-delay:${(i * 0.012).toFixed(3)}s" x="${x.toFixed(1)}" y="${(bottom - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="${t ? "url(#bar)" : C.raised}"/>`;
  })
  .join("\n  ");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let lastMonth = -1;
const months = weeks
  .map((w, i) => {
    const m = new Date(w[0].date + "T00:00:00Z").getUTCMonth();
    if (m === lastMonth) return "";
    lastMonth = m;
    return i === 0 ? "" : `<text x="${(pad + i * (bw + gap)).toFixed(1)}" y="${bottom + 22}" font-family="${MONO}" font-size="11" fill="${C.dim}">${MONTHS[m]}</text>`;
  })
  .join("");

const updated = new Date().toISOString().slice(0, 10);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Contribution activity, last 12 months</title>
  <desc id="desc">${esc(stats.map(([n, l]) => `${n} ${l}`).join(", "))}. Updated ${updated}.</desc>
  <defs>
    ${ink("ink")}
    <linearGradient id="bar" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${bottom}">
      <stop offset="0" stop-color="${C.lilac}"/>
      <stop offset=".45" stop-color="${C.purple}"/>
      <stop offset="1" stop-color="${C.deep}"/>
    </linearGradient>
  </defs>
  <style>
    .b { transform-box: fill-box; transform-origin: 50% 100%; animation: grow .7s cubic-bezier(.2,.7,.2,1) backwards; }
    @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  </style>
  <rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="17.25" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <text x="${pad}" y="48" font-family="${MONO}" font-size="14" fill="${C.purple}">~/activity</text>
  <text x="${W - pad}" y="48" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.dim}">contributions per week · last 12 months · updated ${updated}</text>
  ${statSvg}
  ${bars}
  ${months}
</svg>
`;

const out = join(root, "dist", "activity.svg");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`wrote dist/activity.svg: ${stats.map(([n, l]) => `${n} ${l}`).join(", ")}`);
