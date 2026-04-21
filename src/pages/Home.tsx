import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Bell, ChevronRight } from 'lucide-react'
import { getTodayEntry, getAllEntries, deleteEntry, type DailyEntry } from '../utils/storage'
import { getDailyQuote, getDailyImage } from '../utils/quotes'
import {
  getNotesThisWeek,
  computeWeekMood,
  type FutureSelfNote,
  type WeekMood,
} from '../utils/futureSelfNotes'
import MonkeyMascot from '../components/MonkeyMascot'
import EntryCard from '../components/EntryCard'
import EntryDetailModal from '../components/EntryDetailModal'
import { JournalEmptyState } from '../components/EmptyStates'
import './Home.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [todayDone, setTodayDone] = useState(false)
  const [quote, setQuote] = useState({ text: '', author: '' })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null)
  const [weekMood, setWeekMood] = useState<WeekMood | null>(null)
  const [latestNote, setLatestNote] = useState<FutureSelfNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [dailyQuote, dailyImage, todayEntry, allEntries, weekNotes] = await Promise.all([
        getDailyQuote(),
        getDailyImage(),
        getTodayEntry(),
        getAllEntries(),
        getNotesThisWeek().catch(() => [] as FutureSelfNote[]),
      ])
      setTodayDone(!!todayEntry)
      setRecentEntries(allEntries.slice(0, 5))
      setQuote(dailyQuote)
      setImageUrl(dailyImage)
      setWeekMood(computeWeekMood(weekNotes))
      setLatestNote(weekNotes[0] ?? null)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* Daily Image + Quote */}
        <div className="quote-card">
          {imageUrl && (
            <img src={imageUrl} alt="" className="daily-image" />
          )}
          <div className="quote-content">
            <p className="quote-text">"{quote.text}"</p>
            <p className="quote-author">- {quote.author}</p>
          </div>
        </div>

        {/* Today's Status */}
        {!todayDone && (
          <button className="reminder-card" onClick={() => navigate('/journal')}>
            <div className="reminder-header">
              <Bell size={20} color="var(--accent)" />
              <span className="reminder-title">Time to reflect!</span>
            </div>
            <p className="reminder-text">
              You haven't logged today yet. Tap here to check in with yourself.
            </p>
          </button>
        )}

        {todayDone && (
          <div className="done-card">
            <CheckCircle size={24} color="var(--success)" />
            <span className="done-text">Today's reflection complete!</span>
          </div>
        )}

        {/* Future Self card */}
        {weekMood && (
          <button
            className={`future-self-card mood-${weekMood.mood}`}
            onClick={() => navigate('/future-self')}
          >
            <div className="future-self-card-monkey">
              <MonkeyMascot mood={weekMood.mood} body={weekMood.body} size={80} />
            </div>
            <div className="future-self-card-body">
              <div className="future-self-card-header">
                <span className="future-self-card-label">Future Self</span>
                <ChevronRight size={18} color="var(--text-secondary)" />
              </div>
              {latestNote ? (
                <p className="future-self-card-note">"{latestNote.content}"</p>
              ) : (
                <p className="future-self-card-note muted">
                  Nothing yet this week. Tap to write your first note.
                </p>
              )}
              <p className="future-self-card-meta">
                {weekMood.noteCount === 0
                  ? 'Mood: neutral'
                  : `${weekMood.noteCount} ${weekMood.noteCount === 1 ? 'note' : 'notes'} · mood: ${weekMood.mood}`}
              </p>
            </div>
          </button>
        )}

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <div className="section">
            <h2 className="section-title">Recent Entries</h2>
            {recentEntries.map((entry) => (
              <EntryCard
                key={entry.date}
                entry={entry}
                onPress={() => setSelectedEntry(entry)}
              />
            ))}
          </div>
        )}

        {recentEntries.length === 0 && (
          <div className="empty-state">
            <JournalEmptyState />
            <p className="empty-text">No entries yet</p>
            <p className="empty-subtext">Start your journey by tapping the Reflect tab</p>
          </div>
        )}
      </div>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={async (date) => {
            await deleteEntry(date)
            setSelectedEntry(null)
            const [todayEntry, allEntries] = await Promise.all([
              getTodayEntry(),
              getAllEntries(),
            ])
            setTodayDone(!!todayEntry)
            setRecentEntries(allEntries.slice(0, 5))
          }}
        />
      )}
    </div>
  )
}
