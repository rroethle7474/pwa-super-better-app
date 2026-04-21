import { Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Home, BookOpen, Clock, Target, Settings } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'
import LoginPage from './pages/Login'
import HomePage from './pages/Home'
import JournalPage from './pages/Journal'
import HistoryPage from './pages/History'
import DashboardPage from './pages/Dashboard'
import GoalsPage from './pages/Goals'
import SettingsPage from './pages/Settings'
import FutureSelfPage from './pages/FutureSelf'
import './App.css'

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/journal', icon: BookOpen, label: 'Reflect' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="app">
      <main className="app-content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <nav className="tab-bar">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              className={`tab-item ${active ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span className="tab-icon-wrapper">
                <Icon size={22} />
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/future-self" element={<FutureSelfPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
