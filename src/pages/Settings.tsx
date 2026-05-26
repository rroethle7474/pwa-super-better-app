import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2, Download, AlertTriangle, Plus, Archive, RotateCcw, X,
  Pencil, Check, ChevronDown, ChevronRight, BarChart3, LogOut,
} from 'lucide-react'
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
import { useDialog } from '../contexts/DialogContext'
import './Settings.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const dialog = useDialog()
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
  const [entryCount, setEntryCount] = useState(0)

  const isAddQuestionValid =
    newTitle.trim() !== '' && newPrompt.trim() !== '' && newFollowUp.trim() !== ''
  const isEditQuestionValid =
    editTitle.trim() !== '' && editPrompt.trim() !== '' && editFollowUp.trim() !== ''

  const activeQuestions = questions.filter((q) => q.active)
  const archivedQuestions = questions.filter((q) => !q.active)

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
    try {
      const data = await exportAllEntries()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${APP_EXPORT_PREFIX}-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't export",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handlePurge = async () => {
    try {
      await purgeAllData()
      setPurged(true)
      setShowPurgeConfirm(false)
      setQuestions([])
      setEntryCount(0)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't purge data",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handleAddQuestion = async () => {
    if (!isAddQuestionValid) return
    try {
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
    } catch (e) {
      await dialog.alert({
        title: "Couldn't save question",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
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
    if (!editingId || !isEditQuestionValid) return
    try {
      await updateQuestion(editingId, editTitle.trim(), editPrompt.trim(), editFollowUp.trim(), editType, editType === 'number' ? editUnit.trim() || undefined : undefined, editPositiveAnswer)
      const updated = await getQuestions()
      setQuestions(updated)
      setEditingId(null)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't save changes",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handleArchive = async (id: string) => {
    const ok = await dialog.confirm({
      title: 'Archive question?',
      message: 'It will be hidden from daily check-ins, but old entries will still show it.',
      confirmLabel: 'Archive',
    })
    if (!ok) return
    try {
      await archiveQuestion(id)
      const updated = await getQuestions()
      setQuestions(updated)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't archive question",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreQuestion(id)
      const updated = await getQuestions()
      setQuestions(updated)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't restore question",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await dialog.confirm({
      title: 'Delete question?',
      message: 'This permanently deletes the question and only works if no entries reference it.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    try {
      const success = await deleteQuestion(id)
      if (success) {
        const updated = await getQuestions()
        setQuestions(updated)
      } else {
        await dialog.alert({
          title: "Can't delete",
          message: 'Existing entries still reference this question. Archive it instead.',
        })
      }
    } catch (e) {
      await dialog.alert({
        title: "Couldn't delete question",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  function renderQuestionForm(
    mode: 'add' | 'edit',
    title: string,
    promptText: string,
    followUp: string,
    type: QuestionType,
    unit: string,
    positive: boolean,
    setters: {
      setTitle: (v: string) => void
      setPrompt: (v: string) => void
      setFollowUp: (v: string) => void
      setType: (v: QuestionType) => void
      setUnit: (v: string) => void
      setPositive: (v: boolean) => void
    },
    onSubmit: () => void,
    onCancel: () => void,
  ) {
    const isValid = mode === 'add' ? isAddQuestionValid : isEditQuestionValid
    return (
      <form
        className="settings-question-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          onSubmit()
        }}
      >
        <div className="settings-question-form-head">
          <p className="sl-eyebrow" style={{ margin: 0 }}>
            {mode === 'add' ? 'New question' : 'Edit question'}
          </p>
          <button
            type="button"
            className="sl-icon-button"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>

        <div className="sl-field">
          <label className="sl-label">Short name</label>
          <p className="sl-help">
            A one- or two-word label shown in summaries and charts (e.g. "Reading").
          </p>
          <input
            className="sl-input"
            placeholder="e.g. Reading"
            value={title}
            onChange={(e) => setters.setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="sl-field">
          <label className="sl-label">Question</label>
          <p className="sl-help">
            The yes/no question shown at your daily check-in (e.g. "Did I read today?").
          </p>
          <input
            className="sl-input"
            placeholder="e.g. Did I read today?"
            value={promptText}
            onChange={(e) => setters.setPrompt(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="sl-field">
          <label className="sl-label">Notes prompt</label>
          <p className="sl-help">
            Shown above the optional notes box after you answer (e.g. "What did you read?").
          </p>
          <input
            className="sl-input"
            placeholder="e.g. What did you read?"
            value={followUp}
            onChange={(e) => setters.setFollowUp(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="sl-field">
          <label className="sl-label">Type</label>
          <div className="sl-segmented block">
            <button
              type="button"
              className={`sl-segmented-btn ${type === 'yesno' ? 'active' : ''}`}
              onClick={() => setters.setType('yesno')}
            >
              Yes / No
            </button>
            <button
              type="button"
              className={`sl-segmented-btn ${type === 'number' ? 'active' : ''}`}
              onClick={() => setters.setType('number')}
            >
              Number
            </button>
          </div>
        </div>

        {type === 'number' && (
          <div className="sl-field">
            <label className="sl-label">Unit</label>
            <input
              className="sl-input"
              placeholder="e.g. miles, dollars, minutes"
              value={unit}
              onChange={(e) => setters.setUnit(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div className="sl-field">
          <label className="sl-label">Positive outcome is</label>
          <p className="sl-help">
            Which answer means "I did well" — used to color stats and progress charts.
          </p>
          <div className="sl-segmented block">
            <button
              type="button"
              className={`sl-segmented-btn yes ${positive ? 'active' : ''}`}
              onClick={() => setters.setPositive(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`sl-segmented-btn no ${!positive ? 'active' : ''}`}
              onClick={() => setters.setPositive(false)}
            >
              No
            </button>
          </div>
        </div>

        <div className="settings-form-actions">
          <button type="button" className="sl-button quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="sl-button" disabled={!isValid}>
            <Check size={14} />
            {mode === 'add' ? 'Save question' : 'Save changes'}
          </button>
        </div>

        {!isValid && (
          <p className="sl-form-hint">Fill all fields to save</p>
        )}
      </form>
    )
  }

  return (
    <div className="page">
      <div className="page-shell">
        <p className="sl-eyebrow">Preferences</p>
        <h1 className="sl-page-title">Settings.</h1>

        {/* === Questions === */}
        <div className="sl-section-header">
          <button
            type="button"
            className="sl-collapsible"
            onClick={() => setQuestionsOpen(!questionsOpen)}
          >
            {questionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Questions <span className="count">({activeQuestions.length})</span>
          </button>
        </div>

        {questionsOpen && (
          <>
            <div className="settings-question-list">
              {activeQuestions.map((q) => (
                editingId === q.id ? (
                  <div key={q.id}>
                    {renderQuestionForm(
                      'edit',
                      editTitle, editPrompt, editFollowUp, editType, editUnit, editPositiveAnswer,
                      {
                        setTitle: setEditTitle,
                        setPrompt: setEditPrompt,
                        setFollowUp: setEditFollowUp,
                        setType: setEditType,
                        setUnit: setEditUnit,
                        setPositive: setEditPositiveAnswer,
                      },
                      handleSaveEdit,
                      () => setEditingId(null),
                    )}
                  </div>
                ) : (
                  <div key={q.id} className="sl-row">
                    <div className="sl-row-body">
                      <span className="settings-question-title">{q.title}</span>
                      <span className="sl-row-sub">{q.prompt}</span>
                    </div>
                    <div className="sl-row-actions">
                      <button
                        type="button"
                        className="sl-icon-button primary"
                        onClick={() => startEditing(q)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="sl-icon-button"
                        onClick={() => handleArchive(q.id)}
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>

            {!showAddForm ? (
              <button
                type="button"
                className="sl-button dashed block"
                style={{ marginTop: 10 }}
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={16} />
                Add question
              </button>
            ) : (
              renderQuestionForm(
                'add',
                newTitle, newPrompt, newFollowUp, newType, newUnit, newPositiveAnswer,
                {
                  setTitle: setNewTitle,
                  setPrompt: setNewPrompt,
                  setFollowUp: setNewFollowUp,
                  setType: setNewType,
                  setUnit: setNewUnit,
                  setPositive: setNewPositiveAnswer,
                },
                handleAddQuestion,
                () => setShowAddForm(false),
              )
            )}
          </>
        )}

        {archivedQuestions.length > 0 && (
          <>
            <div className="sl-section-header">
              <button
                type="button"
                className="sl-collapsible"
                onClick={() => setArchivedOpen(!archivedOpen)}
              >
                {archivedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Archived <span className="count">({archivedQuestions.length})</span>
              </button>
            </div>
            {archivedOpen && (
              <div className="settings-question-list">
                {archivedQuestions.map((q) => (
                  <div key={q.id} className="sl-row settings-row-archived">
                    <div className="sl-row-body">
                      <span className="settings-question-title">{q.title}</span>
                      <span className="sl-row-sub">{q.prompt}</span>
                    </div>
                    <div className="sl-row-actions">
                      <button
                        type="button"
                        className="sl-icon-button primary"
                        onClick={() => handleRestore(q.id)}
                        title="Restore"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        type="button"
                        className="sl-icon-button danger"
                        onClick={() => handleDelete(q.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === Journal Mode === */}
        <div className="sl-section-header">
          <h2 className="sl-section-title">Journal mode</h2>
        </div>
        <div className="settings-segmented-wrap">
          <div className="sl-segmented">
            <button
              type="button"
              className={`sl-segmented-btn ${journalMode === 'list' ? 'active' : ''}`}
              onClick={() => { setJournalMode('list'); setJournalModeState('list') }}
            >
              All at once
            </button>
            <button
              type="button"
              className={`sl-segmented-btn ${journalMode === 'stepper' ? 'active' : ''}`}
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
        </div>

        {/* === Insights === */}
        <div className="sl-section-header">
          <h2 className="sl-section-title">Insights</h2>
        </div>
        <button
          type="button"
          className="sl-row button"
          onClick={() => navigate('/dashboard')}
        >
          <div className="settings-row-icon indigo">
            <BarChart3 size={16} />
          </div>
          <div className="sl-row-body">
            <span className="sl-row-title">View stats</span>
            <span className="sl-row-sub">Charts and analytics for numeric questions</span>
          </div>
          <ChevronRight size={14} className="sl-row-chevron" />
        </button>

        {/* === Data === */}
        <div className="sl-section-header">
          <h2 className="sl-section-title">Data</h2>
        </div>

        <div className="sl-card settings-data-card">
          <p className="settings-data-count">
            <span className="settings-data-count-value">{purged ? 0 : entryCount}</span>
            <span className="settings-data-count-label">
              {entryCount === 1 ? 'journal entry' : 'journal entries'} stored
            </span>
          </p>
        </div>

        <button
          type="button"
          className="sl-row button"
          onClick={handleExport}
          disabled={purged || entryCount === 0}
          style={{ opacity: purged || entryCount === 0 ? 0.5 : 1 }}
        >
          <div className="settings-row-icon indigo">
            <Download size={16} />
          </div>
          <div className="sl-row-body">
            <span className="sl-row-title">Export journal</span>
            <span className="sl-row-sub">Download all entries and questions as JSON</span>
          </div>
          <ChevronRight size={14} className="sl-row-chevron" />
        </button>

        {!showPurgeConfirm && !purged && (
          <button
            type="button"
            className="sl-row button settings-row-danger"
            onClick={() => setShowPurgeConfirm(true)}
          >
            <div className="settings-row-icon danger">
              <Trash2 size={16} />
            </div>
            <div className="sl-row-body">
              <span className="sl-row-title">Purge all data</span>
              <span className="sl-row-sub">Delete all entries, questions, and cached data</span>
            </div>
            <ChevronRight size={14} className="sl-row-chevron" />
          </button>
        )}

        {showPurgeConfirm && (
          <div className="settings-purge-confirm">
            <div className="settings-purge-head">
              <AlertTriangle size={20} className="settings-purge-icon" />
              <div>
                <p className="settings-purge-title">Are you sure?</p>
                <p className="settings-purge-text">
                  This will permanently delete all {entryCount} entries, all questions,
                  and cached data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="settings-purge-actions">
              <button
                type="button"
                className="sl-button quiet"
                onClick={() => setShowPurgeConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sl-button danger-solid"
                onClick={handlePurge}
              >
                Yes, delete everything
              </button>
            </div>
          </div>
        )}

        {purged && (
          <div className="sl-notice success">
            <Trash2 size={16} />
            <span>All data has been purged. Restart the app to re-seed default questions.</span>
          </div>
        )}

        {/* === Account === */}
        <div className="sl-section-header">
          <h2 className="sl-section-title">Account</h2>
        </div>

        <div className="sl-card settings-account-card">
          <span className="sl-label" style={{ marginBottom: 6 }}>Signed in as</span>
          <p className="settings-account-email">{user?.email}</p>
        </div>

        <button
          type="button"
          className="sl-row button"
          onClick={signOut}
        >
          <div className="settings-row-icon quiet">
            <LogOut size={16} />
          </div>
          <div className="sl-row-body">
            <span className="sl-row-title">Sign out</span>
            <span className="sl-row-sub">Log out of your account</span>
          </div>
          <ChevronRight size={14} className="sl-row-chevron" />
        </button>
      </div>
    </div>
  )
}
