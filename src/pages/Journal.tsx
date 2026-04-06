import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
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
import './Journal.css'

type AnswerState = Record<string, { answer: boolean | null; details: string; numericValue: number | null }>;

export default function JournalPage() {
  const navigate = useNavigate()
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
        // Resolve question lookups for the summary view
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
    if (!allAnswered) {
      alert('Please answer all questions before submitting.')
      return
    }

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

    await saveEntry(entry)
    alert('Great job reflecting today!')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  // No questions yet — guide user to add some
  if (!existingEntry && questions.length === 0) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <Plus size={48} color="var(--primary)" />
            <p className="empty-text">No questions yet</p>
            <p className="empty-subtext">Add some reflection questions to start your daily check-in</p>
            <button
              className="stepper-btn next"
              style={{ marginTop: 20, maxWidth: 220, padding: '12px 24px' }}
              onClick={() => navigate('/settings')}
            >
              <Settings size={18} />
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
        <div className="page-content">
          <div className="done-container">
            <CheckCircle size={64} color="var(--success)" />
            <h2 className="done-title">Already reflected today!</h2>
            <p className="done-subtext">Come back tomorrow to check in again.</p>
          </div>

          <h3 className="summary-title">Today's Reflection</h3>
          {existingEntry.answers.map((a) => {
            const question = resolvedQuestions.get(a.questionId)
            return (
              <div key={a.questionId} className="summary-card">
                <div className="summary-header">
                  {a.answer ? (
                    <CheckCircle size={18} color="var(--success)" />
                  ) : (
                    <XCircle size={18} color="var(--error)" />
                  )}
                  <span className="summary-question">
                    {question?.prompt ?? a.questionId}
                  </span>
                </div>
                {a.numericValue != null && question?.type === 'number' && (
                  <p className="summary-numeric">{a.numericValue} {question.unit ?? ''}</p>
                )}
                {a.details && (
                  <p className="summary-details">{a.details}</p>
                )}
              </div>
            )
          })}
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

    return (
      <div className="page">
        <div className="page-content">
          {/* Progress bar */}
          <div className="stepper-progress">
            <div
              className="stepper-progress-fill"
              style={{ width: `${((stepIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="stepper-counter">
            {stepIndex + 1} of {questions.length}
          </p>

          <MonkeyMascot
            answer={currentAnswer?.answer ?? null}
            questionIndex={stepIndex}
            positiveAnswer={currentQ.positiveAnswer ?? true}
          />

          <QuestionCard
            question={currentQ}
            answer={currentAnswer?.answer ?? null}
            details={currentAnswer?.details ?? ''}
            numericValue={currentAnswer?.numericValue ?? null}
            onAnswer={(yes) => setAnswer(currentQ.id, yes)}
            onDetailsChange={(text) => setDetails(currentQ.id, text)}
            onNumericChange={(val) => setNumeric(currentQ.id, val)}
          />

          <div className="stepper-nav">
            <button
              className="stepper-btn back"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isFirst}
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {isLast ? (
              <button
                className={`stepper-btn save ${!allAnswered ? 'disabled' : ''}`}
                onClick={handleSubmit}
              >
                <Save size={18} />
                Save Reflection
              </button>
            ) : (
              <button
                className={`stepper-btn next ${!currentAnswered ? 'disabled' : ''}`}
                onClick={() => setStepIndex((i) => i + 1)}
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Dot indicators */}
          <div className="stepper-dots">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`stepper-dot ${i === stepIndex ? 'current' : ''} ${answers[q.id]?.answer !== null ? 'answered' : ''}`}
                onClick={() => setStepIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // List mode (default)
  return (
    <div className="page">
      <div className="page-content">
        <h1 className="journal-header">Daily Check-In</h1>
        <p className="journal-subtitle">Take a moment to reflect on your day</p>

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
          className={`submit-btn ${!allAnswered ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Save size={20} />
          Save Reflection
        </button>
      </div>
    </div>
  )
}
