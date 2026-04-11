/**
 * Build-time OG image generation.
 *
 * Runs as the `prebuild` npm script (see package.json) before every
 * `astro build`. Writes public/og.png, which is then copied into
 * dist/ by Astro's static asset pipeline and referenced from
 * Meta.astro as the og:image / twitter:image for the index page.
 *
 * No external image services, no runtime cost — the PNG is regenerated
 * whenever the build runs.
 *
 * Fonts: satori needs TTF/OTF — it can't parse woff2 — so we ship a
 * second copy of Newsreader 400 as TTF under scripts/fonts/, used only
 * by this script. The user-facing font in public/fonts/ stays woff2.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const NAME = "David Frost";
const BIO = "Software engineer working on cloud infrastructure at Capital One.";
const URL_LABEL = "dhfrost.com";

const BG = "#0e0e10";
const FG = "#e6e6e6";
const MUTED = "#8a8a92";
const ACCENT = "#f5a524";

async function main() {
  const fontPath = resolve(repoRoot, "scripts/fonts/newsreader-latin-400.ttf");
  const fontData = await readFile(fontPath);

  const svg = await satori(
    {
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
              style: { fontSize: 84, letterSpacing: "-0.015em", marginBottom: 32 },
              children: NAME,
            },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 40, color: MUTED, lineHeight: 1.4, maxWidth: "90%" },
              children: BIO,
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
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Newsreader",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

  const outPath = resolve(repoRoot, "public/og.png");
  await writeFile(outPath, png);
  console.log(`[og] wrote ${outPath} (${png.byteLength} bytes)`);
}

main().catch((err) => {
  console.error("[og] failed:", err);
  process.exit(1);
});
