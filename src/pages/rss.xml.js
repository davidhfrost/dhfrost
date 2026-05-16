import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

export async function GET(context) {
  const posts = await getCollection("writing", ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  return rss({
    title: "David Frost",
    description: "Writing on cloud infrastructure, infrastructure as code, and CI/CD.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/writing/${post.id}`,
    })),
    customData: "<language>en-us</language>",
  });
}
