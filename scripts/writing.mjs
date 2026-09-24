// Refreshes the ~/writing list in README.md from the lachlancb.me RSS feed.
// Runs in .github/workflows/profile.yml; locally: node scripts/writing.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FEED = "https://lachlancb.me/rss/";
const MAX = 5;
const readmePath = join(dirname(fileURLToPath(import.meta.url)), "..", "README.md");

const res = await fetch(FEED);
if (!res.ok) throw new Error(`feed ${res.status}`);
const xml = await res.text();

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
const field = (item, name) => decode((item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1] || "");

// Articles only: the weekly vlog is personal diary material, not proof of work.
const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  .map((m) => ({ title: field(m[1], "title"), link: field(m[1], "link"), date: new Date(field(m[1], "pubDate")) }))
  .filter((p) => p.title && p.link && !p.link.includes("/vlog/") && !Number.isNaN(p.date.getTime()))
  .sort((a, b) => b.date - a.date)
  .slice(0, MAX);
if (!posts.length) throw new Error("feed returned no articles");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const list = posts.map((p) => `- **[${p.title.replace(/[[\]]/g, "")}](${p.link})** <sub>· ${day(p.date)}</sub>`).join("\n");

const readme = readFileSync(readmePath, "utf8");
const markers = /(<!-- WRITING:START -->)[\s\S]*?(<!-- WRITING:END -->)/;
if (!markers.test(readme)) throw new Error("WRITING markers missing from README.md");
const next = readme.replace(markers, `$1\n${list}\n$2`);
if (next === readme) console.log("writing list unchanged");
else {
  writeFileSync(readmePath, next);
  console.log(`writing list updated: ${posts.length} posts, newest ${day(posts[0].date)}`);
}
