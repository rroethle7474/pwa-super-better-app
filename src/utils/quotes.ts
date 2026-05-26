interface Quote {
  text: string;
  author: string;
}

interface CachedQuote extends Quote {
  date: string;
}

interface CachedImage {
  url: string;
  date: string;
}

interface DailyContentResponse {
  quote: Quote | null;
  image: { url: string; title?: string; copyright?: string } | null;
}

const QUOTE_KEY = 'daily_quote';
const IMAGE_KEY = 'daily_image';

// Single-flight cache so a page that calls getDailyQuote() and getDailyImage()
// in parallel only hits the edge function once.
let inflight: Promise<DailyContentResponse | null> | null = null;

// iOS Safari can throw on localStorage access in private mode or under storage
// pressure (QuotaExceededError). Treat the cache as best-effort.
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — skip caching this run.
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

const QUOTES = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot' },
  { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
  { text: 'Everything you have ever wanted is on the other side of fear.', author: 'George Addair' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis' },
  { text: 'Your limitation—it is only your imagination.', author: 'Unknown' },
  { text: 'Great things never come from comfort zones.', author: 'Unknown' },
  { text: 'Dream it. Wish it. Do it.', author: 'Unknown' },
  { text: 'Don\'t stop when you\'re tired. Stop when you\'re done.', author: 'Unknown' },
  { text: 'Wake up with determination. Go to bed with satisfaction.', author: 'Unknown' },
  { text: 'Little things make big days.', author: 'Unknown' },
  { text: 'It\'s going to be hard, but hard does not mean impossible.', author: 'Unknown' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Unknown' },
  { text: 'Sometimes later becomes never. Do it now.', author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Work hard in silence, let your success be your noise.', author: 'Frank Ocean' },
  { text: 'Stay patient and trust your journey.', author: 'Unknown' },
  { text: 'Every champion was once a contender that refused to give up.', author: 'Rocky Balboa' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'If you\'re going through hell, keep going.', author: 'Winston Churchill' },
  { text: 'What seems impossible today will one day become your warm-up.', author: 'Unknown' },
];

function localFallbackQuote(): Quote {
  // Use day of year for a rotating daily quote.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

function localFallbackImage(today: string): string {
  const seed = today.replace(/-/g, '');
  return `https://picsum.photos/seed/${seed}/800/400`;
}

/**
 * Call the `daily-content` edge function to fetch the real daily quote (ZenQuotes)
 * and daily image (Bing). Returns null on any failure so callers can fall back
 * to the local rotation. Aborts after 8s so a slow edge function can't hang the UI.
 */
async function fetchDailyContent(): Promise<DailyContentResponse | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !anonKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/daily-content`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as DailyContentResponse;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getDailyContent(): Promise<DailyContentResponse | null> {
  if (!inflight) {
    inflight = fetchDailyContent().finally(() => {
      // Clear after a tick so concurrent callers share the result but a later
      // call (e.g. after midnight refresh) can re-fetch.
      setTimeout(() => { inflight = null; }, 0);
    });
  }
  return inflight;
}

/**
 * Synchronous, instant read of the last-known quote — regardless of which day
 * it was cached. Lets the UI paint immediately while today's real quote is
 * fetched in the background. Falls back to the local rotation so it's never empty.
 */
export function getCachedQuote(): Quote {
  const cached = safeGet(QUOTE_KEY);
  if (cached) {
    try {
      const parsed: CachedQuote = JSON.parse(cached);
      return { text: parsed.text, author: parsed.author };
    } catch {
      // Corrupt cache — fall through to local rotation.
    }
  }
  return localFallbackQuote();
}

/**
 * Synchronous, instant read of the last-known image URL — regardless of day.
 * Returns null when nothing is cached yet so the caller can show a skeleton
 * instead of an empty box on a first-ever load.
 */
export function getCachedImage(): string | null {
  const cached = safeGet(IMAGE_KEY);
  if (cached) {
    try {
      const parsed: CachedImage = JSON.parse(cached);
      return parsed.url;
    } catch {
      // Corrupt cache — show skeleton until the real image arrives.
    }
  }
  return null;
}

export async function getDailyQuote(): Promise<Quote> {
  const today = getToday();

  const cached = safeGet(QUOTE_KEY);
  if (cached) {
    try {
      const parsed: CachedQuote = JSON.parse(cached);
      if (parsed.date === today) {
        return { text: parsed.text, author: parsed.author };
      }
    } catch {
      // Corrupt cache — ignore and re-fetch.
    }
  }

  const remote = await getDailyContent();
  const quote = remote?.quote ?? localFallbackQuote();
  safeSet(QUOTE_KEY, JSON.stringify({ ...quote, date: today }));
  return quote;
}

export async function getDailyImage(): Promise<string | null> {
  const today = getToday();

  const cached = safeGet(IMAGE_KEY);
  if (cached) {
    try {
      const parsed: CachedImage = JSON.parse(cached);
      if (parsed.date === today) {
        return parsed.url;
      }
    } catch {
      // Corrupt cache — ignore and re-fetch.
    }
  }

  const remote = await getDailyContent();
  const url = remote?.image?.url ?? localFallbackImage(today);
  safeSet(IMAGE_KEY, JSON.stringify({ url, date: today }));
  return url;
}
