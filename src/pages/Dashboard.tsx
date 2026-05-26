import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { getQuestions, type Question } from '../utils/questions'
import { getAllEntries, getEntriesInRange } from '../utils/storage'
import SimpleChart from '../components/SimpleChart'
import './Dashboard.css'

type TimeRange = 'all' | 'week' | 'month' | 'custom';

function getDateRange(range: TimeRange, customStart: string, customEnd: string): [string, string] {
  const today = new Date()
  const toStr = (d: Date) => d.toISOString().split('T')[0]

  switch (range) {
    case 'week': {
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      return [toStr(start), toStr(today)]
    }
    case 'month': {
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      return [toStr(start), toStr(today)]
    }
    case 'custom':
      return [customStart || toStr(today), customEnd || toStr(today)]
    case 'all':
    default:
      return ['2000-01-01', '2099-12-31']
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [numberQuestions, setNumberQuestions] = useState<Question[]>([])

  const [selectedId, setSelectedId] = useState<string>('')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [dataPoints, setDataPoints] = useState<{ date: string; value: number }[]>([])
  const [total, setTotal] = useState(0)
  const [average, setAverage] = useState(0)
  const [daysTracked, setDaysTracked] = useState(0)

  useEffect(() => {
    const init = async () => {
      const questions = await getQuestions()
      const numQs = questions.filter((q) => q.type === 'number')
      setAllQuestions(questions)
      setNumberQuestions(numQs)
      setSelectedId(numQs[0]?.id ?? '')
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDataPoints([])
      setTotal(0)
      setAverage(0)
      setDaysTracked(0)
      return
    }

    const loadData = async () => {
      const [start, end] = getDateRange(timeRange, customStart, customEnd)
      const entries = timeRange === 'all'
        ? await getAllEntries()
        : await getEntriesInRange(start, end)

      const points: { date: string; value: number }[] = []
      for (const entry of entries) {
        const answer = entry.answers.find((a) => a.questionId === selectedId)
        if (answer?.numericValue != null) {
          points.push({ date: entry.date, value: answer.numericValue })
        }
      }

      points.sort((a, b) => a.date.localeCompare(b.date))

      const sum = points.reduce((acc, p) => acc + p.value, 0)
      setDataPoints(points)
      setTotal(sum)
      setAverage(points.length > 0 ? sum / points.length : 0)
      setDaysTracked(points.length)
    }

    loadData()
  }, [selectedId, timeRange, customStart, customEnd])

  const selectedQuestion = allQuestions.find((q) => q.id === selectedId)

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  if (numberQuestions.length === 0) {
    return (
      <div className="page">
        <div className="page-shell">
          <p className="sl-eyebrow">Analytics</p>
          <h1 className="sl-page-title">Dashboard.</h1>
          <div className="sl-empty">
            <div className="sl-empty-icon">
              <BarChart3 size={22} />
            </div>
            <p className="sl-empty-title">No numeric questions yet.</p>
            <p className="sl-empty-text">
              Add a question with the "Number" type in Settings to start tracking data here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="page">
      <div className="page-shell">
        <p className="sl-eyebrow">Analytics</p>
        <h1 className="sl-page-title">Dashboard.</h1>

        <div className="dash-controls">
          <select
            className="sl-select dash-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {numberQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}{q.unit ? ` (${q.unit})` : ''}
              </option>
            ))}
          </select>

          <div className="sl-segmented block dash-range">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`sl-segmented-btn ${timeRange === r.key ? 'active' : ''}`}
                onClick={() => setTimeRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {timeRange === 'custom' && (
          <div className="dash-custom">
            <div className="dash-custom-field">
              <label className="sl-label">From</label>
              <input
                type="date"
                className="sl-input dash-date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="dash-custom-field">
              <label className="sl-label">To</label>
              <input
                type="date"
                className="sl-input dash-date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">
              {total % 1 === 0 ? total : total.toFixed(1)}
            </span>
            <span className="dash-stat-label">
              Total{selectedQuestion?.unit ? ` ${selectedQuestion.unit}` : ''}
            </span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">
              {average % 1 === 0 ? average : average.toFixed(1)}
            </span>
            <span className="dash-stat-label">Daily avg</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{daysTracked}</span>
            <span className="dash-stat-label">Days</span>
          </div>
        </div>

        <div className="dash-chart-wrap">
          <SimpleChart data={dataPoints} unit={selectedQuestion?.unit} />
        </div>
      </div>
    </div>
  )
}
