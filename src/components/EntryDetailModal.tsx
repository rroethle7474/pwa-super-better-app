import { useState, useEffect } from 'react'
import { X, Check, CircleDashed, Trash2 } from 'lucide-react'
import { getQuestionById, type Question } from '../utils/questions'
import type { DailyEntry } from '../utils/storage'
import './EntryDetailModal.css'

interface Props {
  entry: DailyEntry;
  onClose: () => void;
  onDelete?: (date: string) => void;
}

function formatDateLong(dateStr: string): string {
  // Parse YYYY-MM-DD via numeric constructor — avoids iOS Safari's strict
  // ISO-8601 parsing quirks and any timezone ambiguity around string parsing.
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EntryDetailModal({ entry, onClose, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [questions, setQuestions] = useState<Map<string, Question | undefined>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuestions() {
      const resolved = new Map<string, Question | undefined>()
      await Promise.all(
        entry.answers.map(async (a) => {
          const q = await getQuestionById(a.questionId)
          resolved.set(a.questionId, q)
        })
      )
      setQuestions(resolved)
      setLoading(false)
    }
    loadQuestions()
  }, [entry])

  return (
    <div className="sl-modal-overlay" onClick={onClose}>
      <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sl-modal-header">
          <h2 className="sl-modal-title">{formatDateLong(entry.date)}</h2>
          <button className="sl-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sl-modal-body">
          {loading ? (
            <p className="entry-detail-loading">Loading…</p>
          ) : (
            <>
              <div className="entry-detail-list">
                {entry.answers.map((a) => {
                  const question = questions.get(a.questionId)
                  return (
                    <div key={a.questionId} className="entry-detail-item">
                      <div className="entry-detail-item-head">
                        <span
                          className={`entry-detail-marker ${a.answer ? 'yes' : 'no'}`}
                          aria-hidden
                        >
                          {a.answer ? <Check size={13} /> : <CircleDashed size={13} />}
                        </span>
                        <div className="entry-detail-item-body">
                          <span className="entry-detail-category">
                            {question?.title ?? 'Unknown'}
                          </span>
                          <p className="entry-detail-question">
                            {question?.prompt ?? a.questionId}
                          </p>
                          {a.numericValue != null && question?.type === 'number' && (
                            <p className="entry-detail-numeric">
                              {a.numericValue}
                              {question.unit ? <span> {question.unit}</span> : null}
                            </p>
                          )}
                          {a.details && (
                            <p className="entry-detail-text">{a.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {onDelete && !confirmDelete && (
                <button
                  className="sl-button danger block entry-detail-delete"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={16} />
                  Delete this entry
                </button>
              )}

              {onDelete && confirmDelete && (
                <div className="entry-detail-confirm">
                  <p className="entry-detail-confirm-text">
                    Delete this entry? This cannot be undone.
                  </p>
                  <div className="entry-detail-confirm-actions">
                    <button
                      className="sl-button quiet"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="sl-button danger-solid"
                      onClick={() => onDelete(entry.date)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
