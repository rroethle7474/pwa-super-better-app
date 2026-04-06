interface CachedQuote {
  text: string;
  author: string;
  date: string;
}

interface CachedImage {
  url: string;
  date: string;
}

const QUOTE_KEY = 'daily_quote';
const IMAGE_KEY = 'daily_image';

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

export async function getDailyQuote(): Promise<{ text: string; author: string }> {
  const today = getToday();

  const cached = localStorage.getItem(QUOTE_KEY);
  if (cached) {
    const parsed: CachedQuote = JSON.parse(cached);
    if (parsed.date === today) {
      return { text: parsed.text, author: parsed.author };
    }
  }

  // Use day of year for a rotating daily quote (no external API needed)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const quote = QUOTES[dayOfYear % QUOTES.length];
  localStorage.setItem(QUOTE_KEY, JSON.stringify({ ...quote, date: today }));
  return quote;
}

export async function getDailyImage(): Promise<string | null> {
  const today = getToday();

  const cached = localStorage.getItem(IMAGE_KEY);
  if (cached) {
    const parsed: CachedImage = JSON.parse(cached);
    if (parsed.date === today) {
      return parsed.url;
    }
  }

  // Use picsum with today's date as seed for a consistent daily image
  const seed = today.replace(/-/g, '');
  const url = `https://picsum.photos/seed/${seed}/800/400`;
  localStorage.setItem(IMAGE_KEY, JSON.stringify({ url, date: today }));
  return url;
}
