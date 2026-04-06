import './EmptyStates.css'

export function JournalEmptyState() {
  return (
    <div className="empty-illustration">
      <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow background */}
        <circle cx="80" cy="65" r="50" fill="url(#journalGlow)" opacity="0.3" />
        {/* Book */}
        <rect x="42" y="35" width="76" height="65" rx="6" fill="#16213e" stroke="#6C63FF" strokeWidth="1.5" />
        <line x1="80" y1="35" x2="80" y2="100" stroke="#6C63FF" strokeWidth="1.5" opacity="0.5" />
        {/* Lines on pages */}
        <line x1="52" y1="52" x2="72" y2="52" stroke="#2a2a4a" strokeWidth="2" strokeLinecap="round" className="empty-line-1" />
        <line x1="52" y1="60" x2="68" y2="60" stroke="#2a2a4a" strokeWidth="2" strokeLinecap="round" className="empty-line-2" />
        <line x1="52" y1="68" x2="74" y2="68" stroke="#2a2a4a" strokeWidth="2" strokeLinecap="round" className="empty-line-3" />
        <line x1="88" y1="52" x2="108" y2="52" stroke="#2a2a4a" strokeWidth="2" strokeLinecap="round" className="empty-line-1" />
        <line x1="88" y1="60" x2="104" y2="60" stroke="#2a2a4a" strokeWidth="2" strokeLinecap="round" className="empty-line-2" />
        {/* Pencil */}
        <g className="empty-pencil">
          <rect x="98" y="18" width="6" height="32" rx="1" fill="#6C63FF" transform="rotate(25, 101, 34)" />
          <polygon points="96,48 101,55 106,48" fill="#e94560" transform="rotate(25, 101, 51)" />
        </g>
        {/* Stars */}
        <circle cx="35" cy="30" r="2" fill="#6C63FF" className="empty-star-1" />
        <circle cx="130" cy="40" r="1.5" fill="#e94560" className="empty-star-2" />
        <circle cx="125" cy="25" r="2" fill="#6C63FF" className="empty-star-3" />
        <defs>
          <radialGradient id="journalGlow">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

export function HistoryEmptyState() {
  return (
    <div className="empty-illustration">
      <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow background */}
        <circle cx="80" cy="65" r="50" fill="url(#historyGlow)" opacity="0.3" />
        {/* Clock face */}
        <circle cx="80" cy="65" r="38" fill="#16213e" stroke="#6C63FF" strokeWidth="1.5" />
        <circle cx="80" cy="65" r="34" fill="none" stroke="#2a2a4a" strokeWidth="1" />
        {/* Clock hands */}
        <line x1="80" y1="65" x2="80" y2="42" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" className="empty-clock-min" />
        <line x1="80" y1="65" x2="95" y2="58" stroke="#e94560" strokeWidth="2" strokeLinecap="round" className="empty-clock-hour" />
        {/* Center dot */}
        <circle cx="80" cy="65" r="3" fill="#6C63FF" />
        {/* Hour markers */}
        <circle cx="80" cy="35" r="2" fill="#2a2a4a" />
        <circle cx="110" cy="65" r="2" fill="#2a2a4a" />
        <circle cx="80" cy="95" r="2" fill="#2a2a4a" />
        <circle cx="50" cy="65" r="2" fill="#2a2a4a" />
        {/* Floating dots */}
        <circle cx="30" cy="35" r="2" fill="#6C63FF" className="empty-star-1" />
        <circle cx="135" cy="45" r="1.5" fill="#e94560" className="empty-star-2" />
        <circle cx="40" cy="100" r="2" fill="#6C63FF" className="empty-star-3" />
        <defs>
          <radialGradient id="historyGlow">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

export function GoalsEmptyState() {
  return (
    <div className="empty-illustration">
      <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow background */}
        <circle cx="80" cy="65" r="50" fill="url(#goalsGlow)" opacity="0.3" />
        {/* Mountain */}
        <polygon points="40,105 80,35 120,105" fill="#16213e" stroke="#6C63FF" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="60,105 80,65 100,105" fill="#1a1a2e" stroke="none" />
        {/* Flag at peak */}
        <line x1="80" y1="35" x2="80" y2="18" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" />
        <polygon points="80,18 100,24 80,30" fill="#e94560" className="empty-flag" />
        {/* Path dots going up the mountain */}
        <circle cx="58" cy="90" r="2.5" fill="#2a2a4a" className="empty-dot-1" />
        <circle cx="65" cy="78" r="2.5" fill="#2a2a4a" className="empty-dot-2" />
        <circle cx="72" cy="65" r="2.5" fill="#6C63FF" className="empty-dot-3" />
        <circle cx="77" cy="52" r="2.5" fill="#6C63FF" opacity="0.5" className="empty-dot-4" />
        {/* Stars */}
        <circle cx="30" cy="28" r="2" fill="#6C63FF" className="empty-star-1" />
        <circle cx="135" cy="35" r="1.5" fill="#e94560" className="empty-star-2" />
        <circle cx="125" cy="90" r="2" fill="#6C63FF" className="empty-star-3" />
        <defs>
          <radialGradient id="goalsGlow">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
