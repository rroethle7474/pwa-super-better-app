// Supabase Edge Function: daily-content
//
// Server-side proxy for the daily quote (ZenQuotes) and daily image (Bing HP).
// Both upstream APIs block browser requests via CORS, so we fetch them from
// Deno and return the combined payload with permissive CORS headers to the PWA.
//
// Deploy with: supabase functions deploy daily-content --no-verify-jwt
// (No JWT verification — this only returns public data and has no side effects.)

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — Deno runtime types aren't available in the Vite TS project.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Quote {
  text: string;
  author: string;
}

interface DailyImage {
  url: string;
  title: string;
  copyright: string;
}

interface DailyContent {
  quote: Quote | null;
  image: DailyImage | null;
}

// Simple in-memory cache — Edge Functions are short-lived but while an
// instance is warm this saves us repeated upstream calls within the same day.
let cache: { date: string; data: DailyContent } | null = null;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchQuote(): Promise<Quote | null> {
  try {
    const res = await fetch("https://zenquotes.io/api/today", {
      headers: { "User-Agent": "SuperBetter-PWA/1.0 (+edge-function)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || typeof first.q !== "string" || typeof first.a !== "string") {
      return null;
    }
    return { text: first.q, author: first.a };
  } catch (err) {
    console.error("[daily-content] ZenQuotes fetch failed:", err);
    return null;
  }
}

async function fetchImage(): Promise<DailyImage | null> {
  try {
    const res = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US",
      { headers: { "User-Agent": "SuperBetter-PWA/1.0 (+edge-function)" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const img = data?.images?.[0];
    if (!img || typeof img.url !== "string") return null;
    // Bing returns a relative url like "/th?id=OHR...."
    const url = img.url.startsWith("http")
      ? img.url
      : `https://www.bing.com${img.url}`;
    return {
      url,
      title: typeof img.title === "string" ? img.title : "",
      copyright: typeof img.copyright === "string" ? img.copyright : "",
    };
  } catch (err) {
    console.error("[daily-content] Bing fetch failed:", err);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const date = todayUtc();
  if (cache && cache.date === date) {
    return new Response(JSON.stringify(cache.data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const [quote, image] = await Promise.all([fetchQuote(), fetchImage()]);
  const data: DailyContent = { quote, image };
  cache = { date, data };

  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
