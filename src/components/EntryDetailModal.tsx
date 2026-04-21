import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Trash2 } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
            <h2 className="modal-date">{formatDateLong(entry.date)}</h2>
            <div style={{ width: 24 }} />
          </div>
          <div className="modal-content">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
          <h2 className="modal-date">{formatDateLong(entry.date)}</h2>
          <div style={{ width: 24 }} />
        </div>

        <div className="modal-content">
          {entry.answers.map((a) => {
            const question = questions.get(a.questionId);
            return (
              <div key={a.questionId} className="detail-card">
                <span className="detail-category">
                  {question?.title ?? 'Unknown'}
                </span>
                <div className="detail-answer">
                  {a.answer ? (
                    <CheckCircle size={20} color="var(--success)" />
                  ) : (
                    <XCircle size={20} color="var(--error)" />
                  )}
                  <span className="detail-question">
                    {question?.prompt ?? a.questionId}
                  </span>
                </div>
                {a.numericValue != null && question?.type === 'number' && (
                  <p className="detail-numeric">{a.numericValue} {question.unit ?? ''}</p>
                )}
                {a.details && (
                  <p className="detail-text">{a.details}</p>
                )}
              </div>
            );
          })}

          {onDelete && !confirmDelete && (
            <button className="delete-entry-btn" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} />
              Delete this entry
            </button>
          )}

          {onDelete && confirmDelete && (
            <div className="delete-confirm">
              <p className="delete-confirm-text">Delete this entry? This cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button className="delete-confirm-btn cancel" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button className="delete-confirm-btn confirm" onClick={() => onDelete(entry.date)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
