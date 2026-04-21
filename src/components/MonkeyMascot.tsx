import { useEffect, useState } from 'react'
import './MonkeyMascot.css'

type MascotState = 'idle' | 'celebrating' | 'shrug'
export type MascotMood = 'happy' | 'neutral' | 'sad'
export type MascotBody = 'very-slim' | 'slim' | 'normal' | 'wide' | 'very-wide'

interface Props {
  // Reflect-mode props (answer-driven transient animations)
  answer?: boolean | null
  questionIndex?: number
  positiveAnswer?: boolean // true = "Yes" is good, false = "No" is good
  // Future Self mode — a persistent mood that drives the facial expression
  mood?: MascotMood
  // Future Self fitness axis — drives body width
  body?: MascotBody
  // Optional size override (default 100)
  size?: number
}

const encouragements = [
  "Tomorrow's another day!",
  "You'll get it next time!",
  "Being honest is what counts!",
  "Every day is a fresh start!",
  "It's okay, keep going!",
]

type FacialExpression = 'happy' | 'neutral' | 'sad'

function expressionForState(state: MascotState): FacialExpression {
  if (state === 'celebrating') return 'happy'
  if (state === 'shrug') return 'sad'
  return 'neutral'
}

export default function MonkeyMascot({
  answer = null,
  questionIndex = 0,
  positiveAnswer = true,
  mood,
  body = 'normal',
  size = 100,
}: Props) {
  const [state, setState] = useState<MascotState>('idle')
  const [shrugText, setShrugText] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [prevAnswer, setPrevAnswer] = useState<boolean | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)

  const isMoodMode = mood !== undefined

  useEffect(() => {
    if (isMoodMode) return
    // Reset to idle on question change
    setState('idle')
    setShowBubble(false)
    setPrevAnswer(null)
  }, [questionIndex, isMoodMode])

  useEffect(() => {
    if (isMoodMode) return
    if (answer === prevAnswer) return
    setPrevAnswer(answer)

    if (answer === null) return

    // Celebrate when the answer matches the positive outcome
    const isPositiveResult = answer === positiveAnswer

    if (isPositiveResult) {
      setState('celebrating')
      setCelebrateKey((k) => k + 1)
      setShowBubble(false)
      const timeout = setTimeout(() => setState('idle'), 1800)
      return () => clearTimeout(timeout)
    } else {
      setState('shrug')
      setShrugText(encouragements[questionIndex % encouragements.length])
      setShowBubble(true)
      const timeout = setTimeout(() => {
        setShowBubble(false)
        setTimeout(() => setState('idle'), 300)
      }, 2500)
      return () => clearTimeout(timeout)
    }
  }, [answer, prevAnswer, questionIndex, positiveAnswer, isMoodMode])

  // Decide what to render:
  // - mood mode → facial expression from mood, no transient animations
  // - reflect mode → facial expression from state, transient animations
  const expression: FacialExpression = isMoodMode
    ? (mood as FacialExpression)
    : expressionForState(state)

  const rootClass = isMoodMode ? `mascot-mood-${mood}` : `mascot-${state}`
  const bodyClass = `mascot-body-${body}`

  return (
    <div className="mascot-container">
      {/* Speech bubble (reflect mode only) */}
      {!isMoodMode && (
        <div className={`mascot-bubble ${showBubble ? 'visible' : ''}`}>
          <span>{shrugText}</span>
        </div>
      )}

      {/* Confetti on celebrate (reflect mode only) */}
      {!isMoodMode && state === 'celebrating' && (
        <div className="mascot-confetti" key={celebrateKey}>
          {[...Array(8)].map((_, i) => (
            <span key={i} className={`confetti-piece confetti-${i}`} />
          ))}
        </div>
      )}

      {/* The monkey */}
      <svg
        className={`mascot-monkey ${rootClass}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body + belly (wrapped in a group so CSS can scale its width) */}
        <g className={`mascot-body ${bodyClass}`}>
          <ellipse cx="50" cy="72" rx="20" ry="16" fill="#8B5E3C" />
          <ellipse cx="50" cy="74" rx="13" ry="11" fill="#D4A76A" />
        </g>

        {/* Head */}
        <circle cx="50" cy="38" r="22" fill="#8B5E3C" />
        {/* Face */}
        <circle cx="50" cy="40" r="16" fill="#D4A76A" />

        {/* Left ear */}
        <circle cx="28" cy="32" r="8" fill="#8B5E3C" />
        <circle cx="28" cy="32" r="5" fill="#D4A76A" />
        {/* Right ear */}
        <circle cx="72" cy="32" r="8" fill="#8B5E3C" />
        <circle cx="72" cy="32" r="5" fill="#D4A76A" />

        {/* Eyes */}
        <g className="mascot-eyes">
          {expression === 'happy' ? (
            <>
              {/* Happy squint eyes */}
              <path d="M39 36 Q42 33 45 36" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M55 36 Q58 33 61 36" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : expression === 'sad' ? (
            <>
              {/* Sad droopy eyes */}
              <circle cx="42" cy="37" r="3" fill="#3D2B1F" />
              <circle cx="58" cy="37" r="3" fill="#3D2B1F" />
              {/* Droopy eyelids */}
              <path d="M38 34 Q42 36 46 34" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M54 34 Q58 36 62 34" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Neutral eyes */}
              <circle cx="42" cy="36" r="3.5" fill="#3D2B1F" />
              <circle cx="58" cy="36" r="3.5" fill="#3D2B1F" />
              {/* Eye shine */}
              <circle cx="43.5" cy="34.5" r="1.2" fill="white" />
              <circle cx="59.5" cy="34.5" r="1.2" fill="white" />
            </>
          )}
        </g>

        {/* Mouth */}
        <g className="mascot-mouth">
          {expression === 'happy' ? (
            /* Big smile */
            <path d="M40 44 Q50 54 60 44" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : expression === 'sad' ? (
            /* Frown */
            <path d="M40 50 Q50 42 60 50" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            /* Gentle smile */
            <path d="M42 44 Q50 50 58 44" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Nose */}
        <ellipse cx="50" cy="41" rx="3" ry="2" fill="#C4956A" />

        {/* Left arm */}
        <g className="mascot-left-arm">
          {expression === 'happy' ? (
            <path d="M32 68 Q20 50 24 38" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : expression === 'sad' ? (
            <path d="M32 68 Q28 80 30 90" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M32 68 Q26 72 22 78" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Right arm */}
        <g className="mascot-right-arm">
          {expression === 'happy' ? (
            <path d="M68 68 Q80 50 76 38" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : expression === 'sad' ? (
            <path d="M68 68 Q72 80 70 90" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M68 68 Q74 72 78 78" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Tail */}
        <path d="M50 86 Q55 92 65 90 Q72 88 68 82" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" fill="none" className="mascot-tail" />
      </svg>
    </div>
  )
}
