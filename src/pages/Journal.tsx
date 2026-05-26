import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, CheckCircle2, ChevronLeft, ChevronRight, PenLine, Check, CircleDashed } from 'lucide-react'
import { getActiveQuestions, getQuestionById, type Question } from '../utils/questions'
import { getJournalMode } from '../utils/preferences'
import {
  getTodayEntry,
  getTodayKey,
  saveEntry,
  type DailyEntry,
} from '../utils/storage'
import QuestionCard from '../components/QuestionCard'
import MonkeyMascot from '../components/MonkeyMascot'
import { useDialog } from '../contexts/DialogContext'
import './Journal.css'

type AnswerState = Record<string, { answer: boolean | null; details: string; numericValue: number | null }>;

function formatLongDate(now: Date) {
  return now
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .replace(/,/g, ' ·')
}

export default function JournalPage() {
  const navigate = useNavigate()
  const dialog = useDialog()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<AnswerState>({})
  const [existingEntry, setExistingEntry] = useState<DailyEntry | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resolvedQuestions, setResolvedQuestions] = useState<Map<string, Question | undefined>>(new Map())
  const mode = getJournalMode()

  useEffect(() => {
    async function load() {
      const entry = await getTodayEntry()
      if (entry) {
        setExistingEntry(entry)
        const resolved = new Map<string, Question | undefined>()
        await Promise.all(
          entry.answers.map(async (a) => {
            const q = await getQuestionById(a.questionId)
            resolved.set(a.questionId, q)
          })
        )
        setResolvedQuestions(resolved)
      } else {
        const active = await getActiveQuestions()
        setQuestions(active)
        const initial: AnswerState = {}
        for (const q of active) {
          initial[q.id] = { answer: null, details: '', numericValue: null }
        }
        setAnswers(initial)
      }
      setLoading(false)
    }
    load()
  }, [])

  const setAnswer = (questionId: string, yes: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer: yes },
    }))
  }

  const setDetails = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], details: text },
    }))
  }

  const setNumeric = (questionId: string, value: number | null) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], numericValue: value },
    }))
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]?.answer !== null)

  const handleSubmit = async () => {
    if (!allAnswered) return

    const entry: DailyEntry = {
      date: getTodayKey(),
      answers: questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id].answer as boolean,
        details: answers[q.id].details,
        ...(q.type === 'number' ? { numericValue: answers[q.id].numericValue } : {}),
      })),
      completedAt: new Date().toISOString(),
    }

    try {
      await saveEntry(entry)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't save reflection",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
      return
    }
    await dialog.alert({
      title: 'Saved',
      message: 'Great job reflecting today!',
      okLabel: 'Thanks',
    })
    navigate('/')
  }

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  const today = new Date()

  // No questions yet — guide user to add some
  if (!existingEntry && questions.length === 0) {
    return (
      <div className="page">
        <div className="page-shell">
          <div className="sl-empty">
            <div className="sl-empty-icon">
              <PenLine size={22} />
            </div>
            <p className="sl-empty-title">No questions yet.</p>
            <p className="sl-empty-text">
              Add a few prompts in Settings and your daily check-in is ready.
            </p>
            <button className="sl-button" onClick={() => navigate('/settings')}>
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Already completed today
  if (existingEntry) {
    return (
      <div className="page">
        <div className="page-shell">
          <p className="sl-eyebrow">{formatLongDate(today)}</p>
          <h1 className="sl-page-title">Today's reflection.</h1>

          <div className="journal-done-banner">
            <CheckCircle2 size={20} />
            <span>You've already reflected today. Come back tomorrow.</span>
          </div>

          <div className="sl-section-header">
            <h2 className="sl-section-title">Summary</h2>
          </div>

          <div className="journal-summary-list">
            {existingEntry.answers.map((a) => {
              const question = resolvedQuestions.get(a.questionId)
              return (
                <div key={a.questionId} className="journal-summary-item">
                  <span
                    className={`journal-summary-marker ${a.answer ? 'yes' : 'no'}`}
                    aria-hidden
                  >
                    {a.answer ? <Check size={13} /> : <CircleDashed size={13} />}
                  </span>
                  <div className="journal-summary-body">
                    <p className="journal-summary-question">
                      {question?.prompt ?? a.questionId}
                    </p>
                    {a.numericValue != null && question?.type === 'number' && (
                      <p className="journal-summary-numeric">
                        {a.numericValue}
                        {question.unit ? <span> {question.unit}</span> : null}
                      </p>
                    )}
                    {a.details && (
                      <p className="journal-summary-details">{a.details}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Stepper mode
  if (mode === 'stepper' && questions.length > 0) {
    const currentQ = questions[stepIndex]
    const currentAnswer = answers[currentQ.id]
    const isFirst = stepIndex === 0
    const isLast = stepIndex === questions.length - 1
    const currentAnswered = currentAnswer?.answer !== null
    const progressPct = ((stepIndex + 1) / questions.length) * 100

    return (
      <div className="page journal-stepper-page">
        <div className="page-shell journal-stepper-shell">
          <p className="sl-eyebrow">{formatLongDate(today)}</p>
          <h1 className="sl-page-title">Reflect.</h1>

          <div className="journal-stepper-bar">
            <div className="journal-stepper-bar-track">
              <div
                className="journal-stepper-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="journal-stepper-counter">
              {stepIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="journal-stepper-mascot">
            <MonkeyMascot
              answer={currentAnswer?.answer ?? null}
              questionIndex={stepIndex}
              positiveAnswer={currentQ.positiveAnswer ?? true}
            />
          </div>

          <QuestionCard
            question={currentQ}
            answer={currentAnswer?.answer ?? null}
            details={currentAnswer?.details ?? ''}
            numericValue={currentAnswer?.numericValue ?? null}
            onAnswer={(yes) => setAnswer(currentQ.id, yes)}
            onDetailsChange={(text) => setDetails(currentQ.id, text)}
            onNumericChange={(val) => setNumeric(currentQ.id, val)}
          />

          {/* Dot indicators (inline, between card and nav) */}
          <div className="journal-stepper-dots">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`journal-stepper-dot ${i === stepIndex ? 'current' : ''} ${answers[q.id]?.answer !== null ? 'answered' : ''}`}
                onClick={() => setStepIndex(i)}
                aria-label={`Go to question ${i + 1}`}
              />
            ))}
          </div>

          {/* Nav: sticky on mobile, inline on desktop */}
          <div className="journal-stepper-nav">
            <button
              type="button"
              className="sl-button ghost"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isFirst}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {isLast ? (
              <button
                type="button"
                className="sl-button"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                <Save size={16} />
                Save reflection
              </button>
            ) : (
              <button
                type="button"
                className="sl-button"
                onClick={() => setStepIndex((i) => i + 1)}
                disabled={!currentAnswered}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // List mode (default)
  return (
    <div className="page">
      <div className="page-shell">
        <p className="sl-eyebrow">{formatLongDate(today)}</p>
        <h1 className="sl-page-title">Reflect.</h1>
        <p className="sl-page-subtitle">
          A few quiet questions for the end of the day.
        </p>

        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            answer={answers[q.id]?.answer ?? null}
            details={answers[q.id]?.details ?? ''}
            numericValue={answers[q.id]?.numericValue ?? null}
            onAnswer={(yes) => setAnswer(q.id, yes)}
            onDetailsChange={(text) => setDetails(q.id, text)}
            onNumericChange={(val) => setNumeric(q.id, val)}
          />
        ))}

        <button
          type="button"
          className="sl-button block large journal-list-submit"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          <Save size={18} />
          Save reflection
        </button>
      </div>
    </div>
  )
}
