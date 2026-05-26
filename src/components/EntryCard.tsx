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
  });
}

function formatYear(dateStr: string): string {
  const [, , ] = dateStr.split('-')
  return dateStr.split('-')[0]
}

export default function EntryCard({ entry, onPress }: Props) {
  const yesCount = entry.answers.filter((a) => a.answer).length;
  const total = entry.answers.length;
  const lastAnswer = entry.answers[entry.answers.length - 1];

  return (
    <button className="entry-card" onClick={onPress}>
      <div className="entry-card-head">
        <div className="entry-card-date-block">
          <span className="entry-card-eyebrow">{formatYear(entry.date)}</span>
          <span className="entry-card-date">{formatDate(entry.date)}</span>
        </div>
        <span className="entry-card-score">
          <span className="entry-card-score-value">{yesCount}</span>
          <span className="entry-card-score-divider">/</span>
          <span className="entry-card-score-total">{total}</span>
        </span>
      </div>

      {lastAnswer?.details && (
        <p className="entry-card-preview">{lastAnswer.details}</p>
      )}

      <ChevronRight size={16} className="entry-card-chevron" />
    </button>
  )
}
