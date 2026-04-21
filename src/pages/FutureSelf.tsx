import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import MonkeyMascot from '../components/MonkeyMascot'
import {
  addNote,
  updateNote,
  deleteNote,
  getNotesThisWeek,
  computeWeekMood,
  type FutureSelfNote,
  type WeekMood,
} from '../utils/futureSelfNotes'
import './FutureSelf.css'

const MOOD_MESSAGE: Record<WeekMood['mood'], string> = {
  happy: "I'm proud of you this week — keep it going!",
  neutral: "I'm listening. Tell me how today went.",
  sad: "I'm worried about you. Let's turn this week around.",
}

const BODY_MESSAGE: Record<WeekMood['body'], string> = {
  'very-slim': "Crushing the fitness game — keep it up!",
  slim: "Fitness is trending in the right direction.",
  normal: "Fitness is steady.",
  wide: "Fitness is slipping a bit — time to refocus.",
  'very-wide': "Getting rough on the fitness side. Let's turn it around.",
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function FutureSelfPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<FutureSelfNote[]>([])
  const [mood, setMood] = useState<WeekMood>({
    mood: 'neutral',
    body: 'normal',
    averageScore: 0,
    fitnessSum: 0,
    noteCount: 0,
    fitnessNoteCount: 0,
    weekStart: '',
  })
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const fresh = await getNotesThisWeek()
    setNotes(fresh)
    setMood(computeWeekMood(fresh))
  }

  useEffect(() => {
    async function load() {
      try {
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load notes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubmit() {
    const trimmed = draft.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await addNote(trimmed)
      setDraft('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save note')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(note: FutureSelfNote) {
    setEditingId(note.id)
    setEditDraft(note.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  async function saveEdit(id: string) {
    const trimmed = editDraft.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await updateNote(id, trimmed)
      setEditingId(null)
      setEditDraft('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update note')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note? Your future self will forget it ever happened.')) return
    setError(null)
    try {
      await deleteNote(id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete note')
    }
  }

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content future-self-page">
        {/* Header with back button */}
        <div className="future-self-header">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="future-self-title">Future Self</h1>
        </div>

        {/* Mood + body avatar */}
        <div className={`mood-card mood-${mood.mood}`}>
          <MonkeyMascot mood={mood.mood} body={mood.body} size={120} />
          <p className="mood-message">{MOOD_MESSAGE[mood.mood]}</p>
          <p className="body-message">{BODY_MESSAGE[mood.body]}</p>
          <p className="mood-stats">
            {mood.noteCount === 0
              ? 'No notes yet this week'
              : `${mood.noteCount} ${mood.noteCount === 1 ? 'note' : 'notes'} · mood avg ${mood.averageScore.toFixed(2)}${
                  mood.fitnessNoteCount > 0
                    ? ` · fitness ${mood.fitnessSum >= 0 ? '+' : ''}${mood.fitnessSum.toFixed(2)}`
                    : ''
                }`}
          </p>
        </div>

        {/* Compose */}
        <form
          className="compose-card"
          onSubmit={(e) => {
            e.preventDefault()
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
            void handleSubmit()
          }}
        >
          <label htmlFor="note-input" className="compose-label">
            Message to your future self
          </label>
          <textarea
            id="note-input"
            className="compose-input"
            placeholder="What do you want your future self to know?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={submitting}
          />
          <div className="compose-footer">
            <span className="compose-count">{draft.length} / 2000</span>
            <button
              type="submit"
              className="compose-submit"
              disabled={!draft.trim() || submitting}
            >
              <Send size={16} />
              {submitting ? 'Scoring…' : 'Send'}
            </button>
          </div>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {/* Notes list */}
        <div className="section">
          <h2 className="section-title">This Week</h2>
          {notes.length === 0 ? (
            <p className="empty-note">Nothing yet. Your first note will set the tone.</p>
          ) : (
            notes.map((note) => {
              const isEditing = editingId === note.id
              return (
                <div key={note.id} className={`note-card sentiment-${note.sentimentLabel}`}>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                        void saveEdit(note.id)
                      }}
                    >
                      <textarea
                        className="compose-input"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={2000}
                        rows={3}
                        disabled={submitting}
                      />
                      <div className="note-actions">
                        <button
                          type="submit"
                          className="note-action"
                          disabled={!editDraft.trim() || submitting}
                        >
                          <Check size={16} />
                          {submitting ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="note-action" onClick={cancelEdit} disabled={submitting}>
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="note-content">{note.content}</p>
                      <div className="note-meta">
                        <div className="note-pills">
                          <span className={`sentiment-pill sentiment-${note.sentimentLabel}`}>
                            {note.sentimentLabel} · {note.sentimentScore.toFixed(2)}
                          </span>
                          {note.fitnessScore !== null && (
                            <span
                              className={`fitness-pill ${
                                note.fitnessScore >= 0.2
                                  ? 'fitness-positive'
                                  : note.fitnessScore <= -0.2
                                    ? 'fitness-negative'
                                    : 'fitness-neutral'
                              }`}
                            >
                              fitness {note.fitnessScore >= 0 ? '+' : ''}
                              {note.fitnessScore.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="note-time">{formatTime(note.createdAt)}</span>
                      </div>
                      <div className="note-actions">
                        <button className="note-action" onClick={() => startEdit(note)}>
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button className="note-action danger" onClick={() => handleDelete(note.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
