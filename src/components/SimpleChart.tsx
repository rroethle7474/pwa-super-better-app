import './SimpleChart.css'

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  unit?: string;
}

function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

export default function SimpleChart({ data, unit }: Props) {
  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data for this period</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const chartHeight = 200
  const barWidth = 36
  const barGap = 8
  const chartWidth = data.length * (barWidth + barGap) + barGap
  const yPadding = 24 // space for value labels on top

  return (
    <div className="chart-container">
      <div className="chart-scroll">
        <svg
          width={Math.max(chartWidth, 300)}
          height={chartHeight + yPadding + 28}
          className="chart-svg"
        >
          <defs>
            <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c6ff5" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#5a52c4" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1={0}
              x2={chartWidth}
              y1={yPadding + chartHeight * (1 - pct)}
              y2={yPadding + chartHeight * (1 - pct)}
              className="chart-grid-line"
            />
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight
            const x = barGap + i * (barWidth + barGap)
            const y = yPadding + chartHeight - barHeight

            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  className="chart-bar"
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  className="chart-value-label"
                >
                  {d.value % 1 === 0 ? d.value : d.value.toFixed(1)}
                </text>
                {/* Date label */}
                <text
                  x={x + barWidth / 2}
                  y={yPadding + chartHeight + 18}
                  className="chart-date-label"
                >
                  {formatDateLabel(d.date)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {unit && <p className="chart-unit">Values in {unit}</p>}
    </div>
  )
}
