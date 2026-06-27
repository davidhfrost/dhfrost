/**
 * Build-time OG image generation.
 *
 * Runs as the `prebuild` npm script (see package.json) before every
 * `astro build`. Renders, with satori + resvg:
 *   - public/og.png                  the default card (homepage, and any page
 *                                    that doesn't set its own image)
 *   - public/og/writing/<slug>.png   one card per published writing post
 *   - public/og/projects/<slug>.png  one card per project
 *
 * Post.astro / Project.astro pass the matching `image` down through Base to
 * Meta.astro. Everything here is regenerated on every build, so it's
 * gitignored (see .gitignore).
 *
 * Frontmatter is read with a small regex (only `title` and `draft` are
 * needed) to avoid pulling a YAML parser into this build-only script.
 *
 * Fonts: satori needs TTF/OTF — it can't parse woff2 — so we ship a second
 * copy of Newsreader 400 as TTF under scripts/fonts/, used only by this
 * script. The user-facing font in public/fonts/ stays woff2.
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const NAME = "David Frost";
const BIO = "Software engineer at Capital One, building platforms, distributed systems, and AI.";
const URL_LABEL = "dhfrost.com";

const BG = "#0e0e10";
const FG = "#e6e6e6";
const MUTED = "#8a8a92";
const ACCENT = "#f5a524";

const fontData = await readFile(resolve(repoRoot, "scripts/fonts/newsreader-latin-400.ttf"));

function card({
  heading,
  headingSize,
  sub,
}: {
  heading: string;
  headingSize: number;
  sub: string;
}) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: BG,
        color: FG,
        fontFamily: "Newsreader",
        padding: "80px 96px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: headingSize,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
              marginBottom: 32,
            },
            children: heading,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 40, color: MUTED, lineHeight: 1.4, maxWidth: "90%" },
            children: sub,
          },
        },
        {
          type: "div",
          props: {
            style: { marginTop: "auto", fontSize: 28, color: ACCENT },
            children: URL_LABEL,
          },
        },
      ],
    },
  };
}

async function renderPng(node: ReturnType<typeof card>) {
  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts: [{ name: "Newsreader", data: fontData, weight: 400, style: "normal" }],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

function frontmatterBlock(raw: string): string {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? "";
}

function field(block: string, key: string): string {
  const match = block.match(new RegExp(`^${key}:[ \\t]*(.+?)[ \\t]*$`, "m"));
  const value = match?.[1]?.trim();
  if (!value) return "";
  const quoted = /^(["'])([\s\S]*)\1$/.exec(value);
  return quoted?.[2] ?? value;
}

async function entries(dir: string) {
  const files = (await readdir(dir)).filter((file) => /\.mdx?$/.test(file));
  return Promise.all(
    files.map(async (file) => {
      const block = frontmatterBlock(await readFile(resolve(dir, file), "utf8"));
      return {
        slug: file.replace(/\.mdx?$/, ""),
        title: field(block, "title"),
        draft: field(block, "draft") === "true",
      };
    }),
  );
}

async function writeCard(relPath: string, node: ReturnType<typeof card>) {
  const out = resolve(repoRoot, relPath);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, await renderPng(node));
}

async function main() {
  await writeCard("public/og.png", card({ heading: NAME, headingSize: 84, sub: BIO }));

  const writing = (await entries(resolve(repoRoot, "src/content/writing"))).filter(
    (entry) => !entry.draft,
  );
  for (const entry of writing) {
    await writeCard(
      `public/og/writing/${entry.slug}.png`,
      card({ heading: entry.title, headingSize: 60, sub: NAME }),
    );
  }

  const projects = await entries(resolve(repoRoot, "src/content/projects"));
  for (const entry of projects) {
    await writeCard(
      `public/og/projects/${entry.slug}.png`,
      card({ heading: entry.title, headingSize: 60, sub: NAME }),
    );
  }

  console.log(`[og] wrote ${1 + writing.length + projects.length} card(s)`);
}

main().catch((err) => {
  console.error("[og] failed:", err);
  process.exit(1);
});
