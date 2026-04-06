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

  // Load questions on mount
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

  // Load chart data when dependencies change (replaces useMemo)
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

      // Sort chronologically for the chart
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
      <div className="page">
        <div className="page-content">
          <h1 className="dash-header">Dashboard</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // No number questions at all
  if (numberQuestions.length === 0) {
    return (
      <div className="page">
        <div className="page-content">
          <h1 className="dash-header">Dashboard</h1>
          <div className="dash-empty">
            <BarChart3 size={48} color="var(--text-muted)" />
            <p className="dash-empty-title">No numeric questions yet</p>
            <p className="dash-empty-text">
              Add a question with the "Number" type in Settings to start tracking data here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="dash-header">Dashboard</h1>

        {/* Question Selector */}
        <div className="dash-select-wrapper">
          <select
            className="dash-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {numberQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}{q.unit ? ` (${q.unit})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Toggle */}
        <div className="dash-range-toggle">
          {(['all', 'week', 'month', 'custom'] as TimeRange[]).map((r) => (
            <button
              key={r}
              className={`dash-range-btn ${timeRange === r ? 'active' : ''}`}
              onClick={() => setTimeRange(r)}
            >
              {r === 'all' ? 'All Time' : r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Custom'}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {timeRange === 'custom' && (
          <div className="dash-custom-dates">
            <div className="dash-date-field">
              <label>From</label>
              <input
                type="date"
                className="dash-date-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="dash-date-field">
              <label>To</label>
              <input
                type="date"
                className="dash-date-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <span className="dash-stat-value">
              {total % 1 === 0 ? total : total.toFixed(1)}
            </span>
            <span className="dash-stat-label">
              Total{selectedQuestion?.unit ? ` ${selectedQuestion.unit}` : ''}
            </span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-value">
              {average % 1 === 0 ? average : average.toFixed(1)}
            </span>
            <span className="dash-stat-label">Daily Avg</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-value">{daysTracked}</span>
            <span className="dash-stat-label">Days</span>
          </div>
        </div>

        {/* Chart */}
        <SimpleChart data={dataPoints} unit={selectedQuestion?.unit} />
      </div>
    </div>
  )
}
