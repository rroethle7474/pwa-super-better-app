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
      <span className="question-category">
        {question.title}
        {isNumber && <span className="question-type-badge">numeric</span>}
      </span>
      <h3 className="question-prompt">{question.prompt}</h3>

      <div className="question-buttons">
        <button
          className={`answer-btn yes ${answer === true ? 'active' : ''}`}
          onClick={() => onAnswer(true)}
        >
          <Check size={20} />
          Yes
        </button>
        <button
          className={`answer-btn no ${answer === false ? 'active' : ''}`}
          onClick={() => onAnswer(false)}
        >
          <X size={20} />
          No
        </button>
      </div>

      {answer !== null && (
        <div className="follow-up">
          {isNumber && (
            <div className="numeric-row">
              <input
                className="numeric-input"
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
                <span className="numeric-unit">{question.unit}</span>
              )}
            </div>
          )}
          <label className="follow-up-label">{question.followUpLabel}</label>
          <textarea
            className="follow-up-input"
            placeholder="Type here..."
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}
