import { useEffect, useState } from 'react'
import './MonkeyMascot.css'

type MascotState = 'idle' | 'celebrating' | 'shrug'

interface Props {
  answer: boolean | null
  questionIndex: number
  positiveAnswer?: boolean // true = "Yes" is good, false = "No" is good
}

const encouragements = [
  "Tomorrow's another day!",
  "You'll get it next time!",
  "Being honest is what counts!",
  "Every day is a fresh start!",
  "It's okay, keep going!",
]

export default function MonkeyMascot({ answer, questionIndex, positiveAnswer = true }: Props) {
  const [state, setState] = useState<MascotState>('idle')
  const [shrugText, setShrugText] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [prevAnswer, setPrevAnswer] = useState<boolean | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)

  useEffect(() => {
    // Reset to idle on question change
    setState('idle')
    setShowBubble(false)
    setPrevAnswer(null)
  }, [questionIndex])

  useEffect(() => {
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
  }, [answer, prevAnswer, questionIndex, positiveAnswer])

  return (
    <div className="mascot-container">
      {/* Speech bubble */}
      <div className={`mascot-bubble ${showBubble ? 'visible' : ''}`}>
        <span>{shrugText}</span>
      </div>

      {/* Confetti on celebrate */}
      {state === 'celebrating' && (
        <div className="mascot-confetti" key={celebrateKey}>
          {[...Array(8)].map((_, i) => (
            <span key={i} className={`confetti-piece confetti-${i}`} />
          ))}
        </div>
      )}

      {/* The monkey */}
      <svg
        className={`mascot-monkey mascot-${state}`}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="50" cy="72" rx="20" ry="16" fill="#8B5E3C" />
        {/* Belly */}
        <ellipse cx="50" cy="74" rx="13" ry="11" fill="#D4A76A" />

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
          {state === 'celebrating' ? (
            <>
              {/* Happy squint eyes */}
              <path d="M39 36 Q42 33 45 36" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M55 36 Q58 33 61 36" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Normal eyes */}
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
          {state === 'celebrating' ? (
            /* Big smile */
            <path d="M40 44 Q50 54 60 44" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : state === 'shrug' ? (
            /* Slight frown / neutral */
            <path d="M43 46 Q50 44 57 46" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            /* Gentle smile */
            <path d="M42 44 Q50 50 58 44" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Nose */}
        <ellipse cx="50" cy="41" rx="3" ry="2" fill="#C4956A" />

        {/* Left arm */}
        <g className="mascot-left-arm">
          {state === 'celebrating' ? (
            <path d="M32 68 Q20 50 24 38" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : state === 'shrug' ? (
            <path d="M32 68 Q22 58 20 52" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M32 68 Q26 72 22 78" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Right arm */}
        <g className="mascot-right-arm">
          {state === 'celebrating' ? (
            <path d="M68 68 Q80 50 76 38" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : state === 'shrug' ? (
            <path d="M68 68 Q78 58 80 52" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
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
