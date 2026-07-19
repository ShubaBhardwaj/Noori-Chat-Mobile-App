import { Firecrawl } from "firecrawl";

import { env } from "../env";

export async function fetchWebText(url: string): Promise<string> {
  const firecrawl = new Firecrawl({ apiKey: env.firecrawlApiKey });
  const result = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  const markdown = result.markdown?.trim();
  if (!markdown) throw new Error("Firecrawl returned no content for url");
  return markdown;
}