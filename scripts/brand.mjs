// LachlanCB brand tokens shared by every generated SVG: purple + black, Inter + JetBrains Mono.
export const C = {
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
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
export const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Horizontal purple gradient for text and borders.
export const ink = (id) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.lilac}"/>
    <stop offset=".55" stop-color="${C.purple}"/>
    <stop offset="1" stop-color="${C.deep}"/>
  </linearGradient>`;
