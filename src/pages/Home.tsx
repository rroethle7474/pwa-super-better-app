import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Bell, ChevronRight, PenLine } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
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
import './Home.css'

function getGreetingPrefix(now: Date) {
  const hour = now.getHours()
  if (hour < 5) return 'Hello'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDisplayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return null
  const meta = user.user_metadata as { full_name?: string; name?: string } | null
  const full = meta?.full_name ?? meta?.name
  if (full) return full.split(' ')[0]
  if (user.email) return user.email.split('@')[0]
  return null
}

function formatLongDate(now: Date) {
  return now
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .replace(/,/g, ' ·')
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
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

  const now = new Date()
  const displayName = getDisplayName(user)
  const greeting = displayName
    ? `${getGreetingPrefix(now)}, ${displayName}.`
    : `${getGreetingPrefix(now)}.`

  return (
    <div className="page">
      <div className="page-shell home">
        {/* Date + greeting */}
        <div className="home-eyebrow">{formatLongDate(now)}</div>
        <h1 className="home-greeting">{greeting}</h1>

        {/* Daily Image + Quote */}
        <div className="quote-card">
          {imageUrl && <img src={imageUrl} alt="" className="daily-image" />}
          <div className="quote-content">
            <blockquote className="quote-text">"{quote.text}"</blockquote>
            <div className="quote-author">— {quote.author}</div>
          </div>
        </div>

        {/* Today's Status */}
        {!todayDone && (
          <button className="reminder-card" onClick={() => navigate('/journal')}>
            <Bell size={18} className="reminder-icon" />
            <div className="reminder-body">
              <div className="reminder-title">Time to reflect</div>
              <div className="reminder-text">
                You haven't logged today yet. Tap here to check in with yourself.
              </div>
            </div>
            <ChevronRight size={16} className="reminder-chevron" />
          </button>
        )}

        {todayDone && (
          <div className="done-card">
            <CheckCircle size={20} className="done-icon" />
            <span className="done-text">Today's reflection complete.</span>
          </div>
        )}

        {/* Future Self card */}
        {weekMood && (
          <button
            className={`future-self-card mood-${weekMood.mood}`}
            onClick={() => navigate('/future-self')}
          >
            <div className="future-self-card-monkey">
              <MonkeyMascot mood={weekMood.mood} body={weekMood.body} size={44} />
            </div>
            <div className="future-self-card-body">
              <div className="future-self-card-label">Future Self</div>
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
            <ChevronRight size={16} className="future-self-card-chevron" />
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
          <div className="home-empty">
            <div className="home-empty-icon">
              <PenLine size={22} />
            </div>
            <div className="home-empty-title">Your journal is quiet.</div>
            <div className="home-empty-subtext">
              When you're ready, write one line in{' '}
              <button
                type="button"
                className="home-empty-link"
                onClick={() => navigate('/journal')}
              >
                Reflect
              </button>
              .
            </div>
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
