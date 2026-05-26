import './Logo.css'

interface LogoProps {
  size?: number
  withName?: boolean
  name?: string
}

export default function Logo({ size = 28, withName = true, name = 'Super Loser' }: LogoProps) {
  return (
    <div className="logo">
      <div
        className="logo-mark"
        style={{ width: size, height: size, borderRadius: size * 0.32 }}
      >
        <span
          className="logo-mark-letters"
          style={{ fontSize: size * 0.5 }}
        >
          sl
        </span>
      </div>
      {withName && <span className="logo-name">{name}</span>}
    </div>
  )
}
