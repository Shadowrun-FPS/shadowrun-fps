import { MetadataRoute } from "next";

const BASE_URL = "https://www.shadowrunfps.com";

/** Last content revision. A fresh `new Date()` would mark every URL as changed on each request. */
const LAST_UPDATED = new Date("2026-11-09");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/download`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/troubleshoot`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
