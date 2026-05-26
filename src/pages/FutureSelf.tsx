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
import { useDialog } from '../contexts/DialogContext'
import './FutureSelf.css'

const MOOD_MESSAGE: Record<WeekMood['mood'], string> = {
  happy: "I'm proud of you this week — keep it going.",
  neutral: "I'm listening. Tell me how today went.",
  sad: "I'm worried about you. Let's turn this week around.",
}

const BODY_MESSAGE: Record<WeekMood['body'], string> = {
  'very-slim': 'Crushing the fitness game — keep it up.',
  slim: 'Fitness is trending in the right direction.',
  normal: 'Fitness is steady.',
  wide: 'Fitness is slipping a bit — time to refocus.',
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

function sentimentChipClass(label: FutureSelfNote['sentimentLabel']) {
  if (label === 'positive') return 'sl-chip positive'
  if (label === 'negative') return 'sl-chip negative'
  return 'sl-chip neutral'
}

function fitnessChipClass(score: number) {
  if (score >= 0.2) return 'sl-chip positive'
  if (score <= -0.2) return 'sl-chip negative'
  return 'sl-chip neutral'
}

export default function FutureSelfPage() {
  const navigate = useNavigate()
  const dialog = useDialog()
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
    let errorMsg: string | null = null
    try {
      await addNote(trimmed)
      setDraft('')
      await refresh()
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
    }
    setSubmitting(false)
    if (errorMsg) {
      await dialog.alert({ title: "Couldn't save note", message: errorMsg })
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
    let errorMsg: string | null = null
    try {
      await updateNote(id, trimmed)
      setEditingId(null)
      setEditDraft('')
      await refresh()
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
    }
    setSubmitting(false)
    if (errorMsg) {
      await dialog.alert({ title: "Couldn't update note", message: errorMsg })
    }
  }

  async function handleDelete(id: string) {
    const ok = await dialog.confirm({
      title: 'Delete note?',
      message: 'Your future self will forget it ever happened.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    try {
      await deleteNote(id)
      await refresh()
    } catch (e) {
      await dialog.alert({
        title: "Couldn't delete note",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
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
      <div className="page-shell future-self-shell">
        <div className="future-self-topnav">
          <button
            type="button"
            className="sl-icon-button"
            onClick={() => navigate('/')}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="sl-eyebrow" style={{ margin: 0 }}>This week</p>
        </div>

        <h1 className="sl-page-title future-self-title">Future Self.</h1>

        {/* Hero mood card */}
        <div className={`future-self-hero mood-${mood.mood}`}>
          <div className="future-self-hero-monkey">
            <MonkeyMascot mood={mood.mood} body={mood.body} size={120} />
          </div>
          <div className="future-self-hero-text">
            <p className="future-self-hero-message">{MOOD_MESSAGE[mood.mood]}</p>
            <p className="future-self-hero-body">{BODY_MESSAGE[mood.body]}</p>
            <p className="future-self-hero-stats">
              {mood.noteCount === 0
                ? 'No notes yet this week'
                : `${mood.noteCount} ${mood.noteCount === 1 ? 'note' : 'notes'} · mood avg ${mood.averageScore.toFixed(2)}${
                    mood.fitnessNoteCount > 0
                      ? ` · fitness ${mood.fitnessSum >= 0 ? '+' : ''}${mood.fitnessSum.toFixed(2)}`
                      : ''
                  }`}
            </p>
          </div>
        </div>

        {/* Compose */}
        <form
          className="future-self-compose"
          onSubmit={(e) => {
            e.preventDefault()
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
            void handleSubmit()
          }}
        >
          <label htmlFor="note-input" className="sl-label">
            Message to your future self
          </label>
          <textarea
            id="note-input"
            className="sl-textarea"
            placeholder="What do you want your future self to know?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={submitting}
          />
          <div className="future-self-compose-footer">
            <span className="future-self-compose-count">{draft.length} / 2000</span>
            <button
              type="submit"
              className="sl-button"
              disabled={!draft.trim() || submitting}
            >
              <Send size={14} />
              {submitting ? 'Scoring…' : 'Send'}
            </button>
          </div>
        </form>

        {error && <div className="sl-notice error future-self-error">{error}</div>}

        <div className="sl-section-header">
          <h2 className="sl-section-title">Notes this week</h2>
        </div>

        {notes.length === 0 ? (
          <p className="future-self-empty">
            Nothing yet. Your first note will set the tone.
          </p>
        ) : (
          <div className="future-self-notes">
            {notes.map((note) => {
              const isEditing = editingId === note.id
              return (
                <div
                  key={note.id}
                  className={`future-self-note sentiment-${note.sentimentLabel}`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                        void saveEdit(note.id)
                      }}
                    >
                      <textarea
                        className="sl-textarea"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={2000}
                        rows={3}
                        disabled={submitting}
                      />
                      <div className="future-self-note-actions">
                        <button
                          type="button"
                          className="sl-button quiet small"
                          onClick={cancelEdit}
                          disabled={submitting}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="sl-button small"
                          disabled={!editDraft.trim() || submitting}
                        >
                          <Check size={14} />
                          {submitting ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="future-self-note-content">{note.content}</p>
                      <div className="future-self-note-meta">
                        <div className="future-self-note-chips">
                          <span className={sentimentChipClass(note.sentimentLabel)}>
                            {note.sentimentLabel} · {note.sentimentScore.toFixed(2)}
                          </span>
                          {note.fitnessScore !== null && (
                            <span className={fitnessChipClass(note.fitnessScore)}>
                              fitness {note.fitnessScore >= 0 ? '+' : ''}
                              {note.fitnessScore.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="future-self-note-time">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>
                      <div className="future-self-note-actions">
                        <button
                          type="button"
                          className="sl-button ghost small"
                          onClick={() => startEdit(note)}
                        >
                          <Edit2 size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sl-button danger small"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
