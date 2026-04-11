import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dhfrost.com",
  integrations: [mdx(), sitemap()],
  trailingSlash: "never",
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});
