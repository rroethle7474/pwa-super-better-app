import { Check, X } from 'lucide-react'
import type { Question } from '../utils/questions'
import './QuestionCard.css'

interface Props {
  question: Question;
  answer: boolean | null;
  details: string;
  numericValue: number | null;
  onAnswer: (yes: boolean) => void;
  onDetailsChange: (text: string) => void;
  onNumericChange: (value: number | null) => void;
}

export default function QuestionCard({
  question,
  answer,
  details,
  numericValue,
  onAnswer,
  onDetailsChange,
  onNumericChange,
}: Props) {
  const isNumber = question.type === 'number'

  return (
    <div className="question-card">
      <div className="question-card-eyebrow">
        <span className="question-card-category">{question.title}</span>
        {isNumber && <span className="question-card-type">numeric</span>}
      </div>
      <h3 className="question-card-prompt">{question.prompt}</h3>

      <div className="question-card-answers">
        <button
          type="button"
          className={`question-card-answer yes ${answer === true ? 'active' : ''}`}
          onClick={() => onAnswer(true)}
        >
          <Check size={16} />
          Yes
        </button>
        <button
          type="button"
          className={`question-card-answer no ${answer === false ? 'active' : ''}`}
          onClick={() => onAnswer(false)}
        >
          <X size={16} />
          No
        </button>
      </div>

      {answer !== null && (
        <div className="question-card-followup">
          {isNumber && (
            <div className="question-card-numeric">
              <input
                className="sl-input numeric"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={numericValue ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onNumericChange(val === '' ? null : parseFloat(val))
                }}
              />
              {question.unit && (
                <span className="question-card-unit">{question.unit}</span>
              )}
            </div>
          )}
          <label className="sl-label">{question.followUpLabel}</label>
          <textarea
            className="sl-textarea"
            placeholder="A line or two…"
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}
