import { ChevronRight } from 'lucide-react'
import type { DailyEntry } from '../utils/storage'
import './EntryCard.css'

interface Props {
  entry: DailyEntry;
  onPress: () => void;
}

function formatDate(dateStr: string): string {
  // Parse YYYY-MM-DD via numeric constructor — avoids iOS Safari's strict
  // ISO-8601 parsing quirks and any timezone ambiguity around string parsing.
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EntryCard({ entry, onPress }: Props) {
  const yesCount = entry.answers.filter((a) => a.answer).length;
  const lastAnswer = entry.answers[entry.answers.length - 1];

  return (
    <button className="entry-card" onClick={onPress}>
      <div className="entry-header">
        <span className="entry-date">{formatDate(entry.date)}</span>
        <span className="entry-score">{yesCount}/{entry.answers.length}</span>
      </div>

      <div className="entry-dots">
        {entry.answers.map((a, i) => (
          <span
            key={i}
            className={`dot ${a.answer ? 'yes' : 'no'}`}
          />
        ))}
      </div>

      {lastAnswer?.details && (
        <p className="entry-preview">{lastAnswer.details}</p>
      )}

      <div className="entry-footer">
        <ChevronRight size={16} color="var(--text-muted)" />
      </div>
    </button>
  )
}
