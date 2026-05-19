import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("writing", ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  return rss({
    title: "David Frost",
    description:
      "Writing on software engineering, with a focus on cloud infrastructure, infrastructure as code, and CI/CD.",
    site: context.site ?? "https://dhfrost.com",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/writing/${post.id}`,
    })),
    customData: "<language>en-us</language>",
    trailingSlash: false,
  });
}
