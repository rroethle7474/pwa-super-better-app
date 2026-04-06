import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME } from '../utils/constants'
import './Login.css'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-logo">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="var(--glass-bg)" stroke="var(--primary)" strokeWidth="2" />
            <circle cx="50" cy="38" r="18" fill="#8B5E3C" />
            <circle cx="50" cy="40" r="13" fill="#D4A76A" />
            <circle cx="32" cy="32" r="7" fill="#8B5E3C" />
            <circle cx="32" cy="32" r="4" fill="#D4A76A" />
            <circle cx="68" cy="32" r="7" fill="#8B5E3C" />
            <circle cx="68" cy="32" r="4" fill="#D4A76A" />
            <path d="M41 38 Q44 35 47 38" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M53 38 Q56 35 59 38" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M42 44 Q50 52 58 44" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="50" cy="41" rx="2.5" ry="1.5" fill="#C4956A" />
            <ellipse cx="50" cy="65" rx="16" ry="13" fill="#8B5E3C" />
            <ellipse cx="50" cy="67" rx="10" ry="9" fill="#D4A76A" />
          </svg>
        </div>

        <h1 className="login-title">{APP_NAME}</h1>
        <p className="login-subtitle">Your daily self-reflection journal</p>

        <button className="login-google-btn" onClick={signInWithGoogle}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="login-footer">Your reflections are private and secure</p>
      </div>
    </div>
  )
}
