import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Download, AlertTriangle, Plus, Archive, RotateCcw, X, Pencil, Check, ChevronDown, ChevronRight, BarChart3, LogOut } from 'lucide-react'
import { getAllEntries, purgeAllData, exportAllEntries } from '../utils/storage'
import { APP_EXPORT_PREFIX } from '../utils/constants'
import { useAuth } from '../contexts/AuthContext'
import { getJournalMode, setJournalMode, type JournalMode } from '../utils/preferences'
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  archiveQuestion,
  restoreQuestion,
  deleteQuestion,
  type Question,
  type QuestionType,
} from '../utils/questions'
import './Settings.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [journalMode, setJournalModeState] = useState<JournalMode>(getJournalMode)
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false)
  const [purged, setPurged] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [newFollowUp, setNewFollowUp] = useState('')
  const [newType, setNewType] = useState<QuestionType>('yesno')
  const [newUnit, setNewUnit] = useState('')
  const [newPositiveAnswer, setNewPositiveAnswer] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [editFollowUp, setEditFollowUp] = useState('')
  const [editType, setEditType] = useState<QuestionType>('yesno')
  const [editUnit, setEditUnit] = useState('')
  const [editPositiveAnswer, setEditPositiveAnswer] = useState(true)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [entryCount, setEntryCount] = useState(0)

  const activeQuestions = questions.filter((q) => q.active)
  const archivedQuestions = questions.filter((q) => !q.active)

  // Initial data load
  useEffect(() => {
    async function loadData() {
      const [loadedQuestions, loadedEntries] = await Promise.all([
        getQuestions(),
        getAllEntries(),
      ])
      setQuestions(loadedQuestions)
      setEntryCount(loadedEntries.length)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleExport = async () => {
    const data = await exportAllEntries()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${APP_EXPORT_PREFIX}-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePurge = async () => {
    await purgeAllData()
    setPurged(true)
    setShowPurgeConfirm(false)
    setQuestions([])
    setEntryCount(0)
  }

  const handleAddQuestion = async () => {
    if (!newTitle.trim() || !newPrompt.trim() || !newFollowUp.trim()) {
      alert('Please fill in all fields.')
      return
    }
    try {
      setSaveError(null)
      await addQuestion(newTitle.trim(), newPrompt.trim(), newFollowUp.trim(), newType, newType === 'number' ? newUnit.trim() || undefined : undefined, newPositiveAnswer)
      const updated = await getQuestions()
      setQuestions(updated)
      setNewTitle('')
      setNewPrompt('')
      setNewFollowUp('')
      setNewType('yesno')
      setNewUnit('')
      setNewPositiveAnswer(true)
      setShowAddForm(false)
    } catch (err) {
      setSaveError(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const startEditing = (q: Question) => {
    setEditingId(q.id)
    setEditTitle(q.title)
    setEditPrompt(q.prompt)
    setEditFollowUp(q.followUpLabel)
    setEditType(q.type ?? 'yesno')
    setEditUnit(q.unit ?? '')
    setEditPositiveAnswer(q.positiveAnswer ?? true)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editPrompt.trim() || !editFollowUp.trim()) {
      alert('Please fill in all fields.')
      return
    }
    await updateQuestion(editingId, editTitle.trim(), editPrompt.trim(), editFollowUp.trim(), editType, editType === 'number' ? editUnit.trim() || undefined : undefined, editPositiveAnswer)
    const updated = await getQuestions()
    setQuestions(updated)
    setEditingId(null)
  }

  const handleArchive = async (id: string) => {
    if (confirm('Archive this question? It will be hidden from daily check-ins but old entries will still show it.')) {
      await archiveQuestion(id)
      const updated = await getQuestions()
      setQuestions(updated)
    }
  }

  const handleRestore = async (id: string) => {
    await restoreQuestion(id)
    const updated = await getQuestions()
    setQuestions(updated)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this question? This only works if no entries reference it.')) {
      const success = await deleteQuestion(id)
      if (success) {
        const updated = await getQuestions()
        setQuestions(updated)
      } else {
        alert('Cannot delete — existing entries still reference this question. Archive it instead.')
      }
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-content">
          <h1 className="settings-header">Settings</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="settings-header">Settings</h1>

        {/* Questions Management */}
        <button className="collapsible-header" onClick={() => setQuestionsOpen(!questionsOpen)}>
          {questionsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2 className="settings-section-title">Questions ({activeQuestions.length})</h2>
        </button>

        {questionsOpen && (
          <>
            <div className="question-list">
              {activeQuestions.map((q) => (
                editingId === q.id ? (
                  <div key={q.id} className="question-edit-row">
                    <input
                      className="add-form-input"
                      placeholder="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <input
                      className="add-form-input"
                      placeholder="Question"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                    />
                    <input
                      className="add-form-input"
                      placeholder="Follow-up label"
                      value={editFollowUp}
                      onChange={(e) => setEditFollowUp(e.target.value)}
                    />
                    <div className="type-toggle">
                      <button className={`type-btn ${editType === 'yesno' ? 'active' : ''}`} onClick={() => setEditType('yesno')}>Yes/No</button>
                      <button className={`type-btn ${editType === 'number' ? 'active' : ''}`} onClick={() => setEditType('number')}>Number</button>
                    </div>
                    {editType === 'number' && (
                      <input
                        className="add-form-input"
                        placeholder="Unit (e.g. miles, dollars, minutes)"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                      />
                    )}
                    <p className="positive-answer-label">Positive outcome is:</p>
                    <div className="type-toggle">
                      <button type="button" className={`type-btn positive-yes ${editPositiveAnswer ? 'active' : ''}`} onClick={() => setEditPositiveAnswer(true)}>Yes</button>
                      <button type="button" className={`type-btn positive-no ${!editPositiveAnswer ? 'active' : ''}`} onClick={() => setEditPositiveAnswer(false)}>No</button>
                    </div>
                    <div className="edit-actions">
                      <button className="edit-action-btn cancel" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button type="button" className="edit-action-btn save" onClick={handleSaveEdit}>
                        <Check size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={q.id} className="question-row">
                    <div className="question-row-info">
                      <span className="question-row-title">{q.title}</span>
                      <span className="question-row-prompt">{q.prompt}</span>
                    </div>
                    <div className="question-row-actions">
                      <button
                        className="question-row-action edit"
                        onClick={() => startEditing(q)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="question-row-action archive"
                        onClick={() => handleArchive(q.id)}
                        title="Archive"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>

            {!showAddForm ? (
              <button className="add-question-btn" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Question
              </button>
            ) : (
              <div className="add-form">
                <div className="add-form-header">
                  <span className="add-form-title">New Question</span>
                  <button className="add-form-close" onClick={() => setShowAddForm(false)}>
                    <X size={18} />
                  </button>
                </div>
                <input
                  className="add-form-input"
                  placeholder="Title (e.g. Reading)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <input
                  className="add-form-input"
                  placeholder="Question (e.g. Did I read today?)"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                />
                <input
                  className="add-form-input"
                  placeholder="Follow-up label (e.g. What did you read?)"
                  value={newFollowUp}
                  onChange={(e) => setNewFollowUp(e.target.value)}
                />
                <div className="type-toggle">
                  <button type="button" className={`type-btn ${newType === 'yesno' ? 'active' : ''}`} onClick={() => setNewType('yesno')}>Yes/No</button>
                  <button type="button" className={`type-btn ${newType === 'number' ? 'active' : ''}`} onClick={() => setNewType('number')}>Number</button>
                </div>
                {newType === 'number' && (
                  <input
                    className="add-form-input"
                    placeholder="Unit (e.g. miles, dollars, minutes)"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  />
                )}
                <p className="positive-answer-label">Positive outcome is:</p>
                <div className="type-toggle">
                  <button type="button" className={`type-btn positive-yes ${newPositiveAnswer ? 'active' : ''}`} onClick={() => setNewPositiveAnswer(true)}>Yes</button>
                  <button type="button" className={`type-btn positive-no ${!newPositiveAnswer ? 'active' : ''}`} onClick={() => setNewPositiveAnswer(false)}>No</button>
                </div>
                <button
                  type="button"
                  className="add-form-submit"
                  onClick={handleAddQuestion}
                >
                  Save Question
                </button>
                {saveError && (
                  <div style={{ background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 8, marginTop: 8, fontSize: 14 }}>
                    {saveError}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Archived Questions */}
        {archivedQuestions.length > 0 && (
          <>
            <button className="collapsible-header" onClick={() => setArchivedOpen(!archivedOpen)}>
              {archivedOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <h2 className="settings-section-title archived-title">Archived ({archivedQuestions.length})</h2>
            </button>
            {archivedOpen && (
              <div className="question-list">
              {archivedQuestions.map((q) => (
                <div key={q.id} className="question-row archived">
                  <div className="question-row-info">
                    <span className="question-row-title">{q.title}</span>
                    <span className="question-row-prompt">{q.prompt}</span>
                  </div>
                  <div className="question-row-actions">
                    <button
                      className="question-row-action restore"
                      onClick={() => handleRestore(q.id)}
                      title="Restore"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="question-row-action delete"
                      onClick={() => handleDelete(q.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </>
        )}

        {/* Journal Mode */}
        <h2 className="settings-section-title" style={{ marginTop: 24 }}>Journal Mode</h2>
        <div className="type-toggle">
          <button
            className={`type-btn ${journalMode === 'list' ? 'active' : ''}`}
            onClick={() => { setJournalMode('list'); setJournalModeState('list') }}
          >
            All at once
          </button>
          <button
            className={`type-btn ${journalMode === 'stepper' ? 'active' : ''}`}
            onClick={() => { setJournalMode('stepper'); setJournalModeState('stepper') }}
          >
            One at a time
          </button>
        </div>
        <p className="settings-hint">
          {journalMode === 'list'
            ? 'All questions shown on one page.'
            : 'Questions shown one at a time with navigation.'}
        </p>

        {/* View Stats */}
        <button className="settings-btn export" onClick={() => navigate('/dashboard')} style={{ marginTop: 24 }}>
          <BarChart3 size={20} />
          <div className="settings-btn-text">
            <span className="settings-btn-label">View Stats</span>
            <span className="settings-btn-desc">Charts and analytics for numeric questions</span>
          </div>
        </button>

        {/* Data Section */}
        <h2 className="settings-section-title data-title">Data</h2>

        <div className="settings-card">
          <h3 className="settings-card-title">Your Data</h3>
          <p className="settings-card-text">
            {purged ? 0 : entryCount} journal {entryCount === 1 ? 'entry' : 'entries'} stored on this device
          </p>
        </div>

        <button className="settings-btn export" onClick={handleExport} disabled={purged || entryCount === 0}>
          <Download size={20} />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Export Journal</span>
            <span className="settings-btn-desc">Download all entries and questions as JSON</span>
          </div>
        </button>

        {!showPurgeConfirm && !purged && (
          <button className="settings-btn danger" onClick={() => setShowPurgeConfirm(true)}>
            <Trash2 size={20} />
            <div className="settings-btn-text">
              <span className="settings-btn-label">Purge All Data</span>
              <span className="settings-btn-desc">Delete all entries, questions, and cached data</span>
            </div>
          </button>
        )}

        {showPurgeConfirm && (
          <div className="purge-confirm">
            <div className="purge-warning">
              <AlertTriangle size={24} color="var(--accent)" />
              <div>
                <p className="purge-warning-title">Are you sure?</p>
                <p className="purge-warning-text">
                  This will permanently delete all {entryCount} entries, all questions, and cached data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="purge-actions">
              <button className="purge-btn cancel" onClick={() => setShowPurgeConfirm(false)}>
                Cancel
              </button>
              <button className="purge-btn confirm" onClick={handlePurge}>
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}

        {purged && (
          <div className="purged-message">
            <Trash2 size={20} color="var(--success)" />
            <span>All data has been purged. Restart the app to re-seed default questions.</span>
          </div>
        )}

        {/* Account */}
        <h2 className="settings-section-title" style={{ marginTop: 32 }}>Account</h2>
        <div className="settings-card">
          <p className="settings-card-text">{user?.email}</p>
        </div>
        <button className="settings-btn signout" onClick={signOut}>
          <LogOut size={20} />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Sign Out</span>
            <span className="settings-btn-desc">Log out of your account</span>
          </div>
        </button>
      </div>
    </div>
  )
}
