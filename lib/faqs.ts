import clientPromise from "@/lib/mongodb";
import type { FAQ } from "@/types";

type FaqAnswerSource = Pick<FAQ, "content" | "list" | "href" | "link">;

/** Plain-text answer for FAQPage JSON-LD (content, steps, and optional link). */
export function formatFaqAnswerText(faq: FaqAnswerSource): string {
  const parts: string[] = [];

  if (faq.content?.trim()) {
    parts.push(faq.content.trim());
  }

  if (faq.list?.length) {
    parts.push(faq.list.map((item) => `• ${item}`).join("\n"));
  }

  if (faq.href?.trim()) {
    const label = faq.link?.trim();
    parts.push(label ? `${label}: ${faq.href.trim()}` : faq.href.trim());
  }

  return parts.join("\n\n");
}

/** Load troubleshooting FAQs for SSR and structured data. */
export async function getFaqsForTroubleshoot(): Promise<FAQ[]> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const faqs = await db
      .collection("FAQs")
      .find({ category: "errors" })
      .sort({ order: 1 })
      .toArray();

    return faqs.map((faq, index) => ({
      _id: String(faq._id),
      title: typeof faq.title === "string" ? faq.title : "",
      content: typeof faq.content === "string" ? faq.content : "",
      list: Array.isArray(faq.list)
        ? faq.list.filter((item): item is string => typeof item === "string")
        : [],
      href: typeof faq.href === "string" ? faq.href : "",
      link: typeof faq.link === "string" ? faq.link : "",
      category: typeof faq.category === "string" ? faq.category : "errors",
      order: typeof faq.order === "number" ? faq.order : index,
    }));
  } catch {
    return [];
  }
}
