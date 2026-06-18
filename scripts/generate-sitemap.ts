// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls dynamic /paper/:id and /user/:userId entries from Supabase REST.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://qphub.lovable.app";
const SUPABASE_URL = "https://fziapohwzcbcfumaffeo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aWFwb2h3emNiY2Z1bWFmZmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MzQ0NDgsImV4cCI6MjA4MTUxMDQ0OH0.YsZyM3OplHeKbzynX2wVarAXB1wW8Jbi8JLK-rWQKJM";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/upload", changefreq: "monthly", priority: "0.6" },
  { path: "/requests", changefreq: "weekly", priority: "0.6" },
  { path: "/calendar", changefreq: "weekly", priority: "0.5" },
  { path: "/groups", changefreq: "weekly", priority: "0.5" },
  { path: "/study-plan", changefreq: "monthly", priority: "0.5" },
  { path: "/profile", changefreq: "weekly", priority: "0.4" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
  { path: "/forgot-password", changefreq: "yearly", priority: "0.2" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.2" },
];

async function fetchRows(table: string, query: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`sitemap: failed to fetch ${table} (${res.status})`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`sitemap: error fetching ${table}`, err);
    return [];
  }
}

function toIsoDate(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

async function buildEntries(): Promise<SitemapEntry[]> {
  const entries = [...staticEntries];

  const papers = await fetchRows(
    "question_papers",
    "select=id,updated_at&status=eq.approved&order=updated_at.desc&limit=5000"
  );
  for (const p of papers) {
    entries.push({
      path: `/paper/${p.id}`,
      lastmod: toIsoDate(p.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  const profiles = await fetchRows(
    "public_profiles",
    "select=id,updated_at&limit=5000"
  );
  for (const u of profiles) {
    entries.push({
      path: `/user/${u.id}`,
      lastmod: toIsoDate(u.updated_at),
      changefreq: "weekly",
      priority: "0.4",
    });
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const entries = await buildEntries();
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
