import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Archive, RotateCcw, X, Pencil, Check,
  ChevronDown, ChevronRight, Trophy, TrendingUp,
  Clock, CalendarDays, Target as TargetIcon,
} from 'lucide-react'
import { getQuestions, type Question } from '../utils/questions'
import { getAllEntries, type DailyEntry } from '../utils/storage'
import { useDialog } from '../contexts/DialogContext'
import {
  getGoals,
  addGoal,
  updateGoal,
  archiveGoal,
  restoreGoal,
  markGoalCompleted,
  getGoalProgress,
  type Goal,
} from '../utils/goals'
import './Goals.css'

export default function GoalsPage() {
  const dialog = useDialog()
  const [goals, setGoals] = useState<Goal[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const numberQuestions = allQuestions.filter((q) => q.type === 'number')

  const activeGoals = goals.filter((g) => g.active)
  const archivedGoals = goals.filter((g) => !g.active)

  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const selectedGoal = activeGoals.find((g) => g.id === selectedGoalId)

  const [manageOpen, setManageOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newDesc, setNewDesc] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newQuestionId, setNewQuestionId] = useState('')

  const [editDesc, setEditDesc] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editQuestionId, setEditQuestionId] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  const newTargetVal = parseFloat(newTarget)
  const isAddValid =
    newDesc.trim() !== '' &&
    newTarget !== '' &&
    !isNaN(newTargetVal) &&
    newTargetVal > 0 &&
    newDate !== '' &&
    newQuestionId !== ''

  const editTargetVal = parseFloat(editTarget)
  const isEditValid =
    editDesc.trim() !== '' &&
    editTarget !== '' &&
    !isNaN(editTargetVal) &&
    editTargetVal > 0 &&
    editDate !== '' &&
    editQuestionId !== ''

  const assignedQuestionIds = activeGoals
    .filter((g) => g.id !== editingId)
    .map((g) => g.questionId)

  const availableQuestionsForAdd = numberQuestions.filter(
    (q) => !assignedQuestionIds.includes(q.id)
  )
  const availableQuestionsForEdit = numberQuestions.filter(
    (q) => !assignedQuestionIds.includes(q.id)
  )

  const refreshGoals = useCallback(async () => {
    const [updated, freshEntries] = await Promise.all([getGoals(), getAllEntries()])
    setGoals(updated)
    setEntries(freshEntries)
    const newActive = updated.filter((g) => g.active)
    if (!newActive.find((g) => g.id === selectedGoalId) && newActive.length > 0) {
      setSelectedGoalId(newActive[0].id)
    }
  }, [selectedGoalId])

  useEffect(() => {
    async function loadData() {
      const [loadedGoals, loadedQuestions, loadedEntries] = await Promise.all([
        getGoals(),
        getQuestions(),
        getAllEntries(),
      ])
      setGoals(loadedGoals)
      setAllQuestions(loadedQuestions)
      setEntries(loadedEntries)
      const active = loadedGoals.filter((g) => g.active)
      if (active.length > 0) {
        setSelectedGoalId(active[0].id)
      }
      const numQ = loadedQuestions.filter((q) => q.type === 'number')
      if (numQ.length > 0) {
        setNewQuestionId(numQ[0]?.id ?? '')
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleAddGoal = async () => {
    if (!isAddValid) return
    try {
      await addGoal(newDesc.trim(), newTargetVal, newDate, newQuestionId)
      await refreshGoals()
      setNewDesc('')
      setNewTarget('')
      setNewDate('')
      setNewQuestionId(availableQuestionsForAdd[0]?.id ?? '')
      setShowAddForm(false)
    } catch (e) {
      await dialog.alert({
        title: "Couldn't save goal",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const startEditing = (g: Goal) => {
    setEditingId(g.id)
    setEditDesc(g.description)
    setEditTarget(String(g.targetValue))
    setEditDate(g.targetDate)
    setEditQuestionId(g.questionId)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !isEditValid) return
    try {
      await updateGoal(editingId, editDesc.trim(), editTargetVal, editDate, editQuestionId)
      await refreshGoals()
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
      title: 'Archive goal?',
      message: 'It will be moved to the archived section.',
      confirmLabel: 'Archive',
    })
    if (!ok) return
    try {
      await archiveGoal(id)
      await refreshGoals()
    } catch (e) {
      await dialog.alert({
        title: "Couldn't archive goal",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreGoal(id)
      await refreshGoals()
    } catch (e) {
      await dialog.alert({
        title: "Couldn't restore goal",
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const getQuestionLabel = (questionId: string): string => {
    const q = allQuestions.find((q) => q.id === questionId)
    return q ? `${q.title}${q.unit ? ` (${q.unit})` : ''}` : 'Unknown'
  }

  const progress = selectedGoal ? getGoalProgress(selectedGoal, entries) : null
  const isCompleted = progress && progress.current >= progress.target
  const isOverdue = selectedGoal && !isCompleted && progress && progress.daysRemaining === 0

  useEffect(() => {
    if (selectedGoal && isCompleted && !selectedGoal.completedAt) {
      markGoalCompleted(selectedGoal.id).then(() => refreshGoals())
    }
  }, [selectedGoal, isCompleted, refreshGoals])

  const selectedQuestion = selectedGoal
    ? allQuestions.find((q) => q.id === selectedGoal.questionId)
    : null

  if (loading) {
    return (
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  if (numberQuestions.length === 0) {
    return (
      <div className="page">
        <div className="page-shell">
          <p className="sl-eyebrow">Tracking</p>
          <h1 className="sl-page-title">Goals.</h1>
          <div className="sl-empty">
            <div className="sl-empty-icon">
              <TargetIcon size={22} />
            </div>
            <p className="sl-empty-title">No numeric questions yet.</p>
            <p className="sl-empty-text">
              Add a question with the "Number" type in Settings before creating goals.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const progressPct = progress?.percentage ?? 0
  const progressStatus = isCompleted ? 'completed' : isOverdue ? 'overdue' : 'active'

  return (
    <div className="page">
      <div className="page-shell">
        <p className="sl-eyebrow">Tracking</p>
        <h1 className="sl-page-title">Goals.</h1>

        {activeGoals.length > 0 && selectedGoal && progress ? (
          <>
            {activeGoals.length > 1 && (
              <select
                className="sl-select goals-picker"
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.description}
                  </option>
                ))}
              </select>
            )}

            {isCompleted && (
              <div className="goals-met">
                <Trophy size={18} />
                <span>Goal met. Beautiful work.</span>
              </div>
            )}

            <div className="goals-hero">
              <div className="goals-hero-head">
                <div className="goals-hero-title-block">
                  <p className="goals-hero-eyebrow">
                    {getQuestionLabel(selectedGoal.questionId)}
                  </p>
                  <h2 className="goals-hero-title">{selectedGoal.description}</h2>
                </div>
                <span className={`sl-chip ${progressStatus === 'completed' ? 'positive' : progressStatus === 'overdue' ? 'negative' : 'indigo'}`}>
                  {progressStatus === 'completed' ? 'Completed' : progressStatus === 'overdue' ? 'Overdue' : 'In progress'}
                </span>
              </div>

              <div className="goals-bar">
                <div
                  className={`goals-bar-fill status-${progressStatus}`}
                  style={{ width: `${Math.max(progressPct, 2)}%` }}
                />
              </div>

              <div className="goals-bar-numbers">
                <span className="goals-bar-current">
                  {progress.current % 1 === 0 ? progress.current : progress.current.toFixed(1)}
                  {selectedQuestion?.unit ? <span className="goals-bar-unit"> {selectedQuestion.unit}</span> : null}
                </span>
                <span className="goals-bar-target">
                  of {progress.target % 1 === 0 ? progress.target : progress.target.toFixed(1)}
                  {selectedQuestion?.unit ? ` ${selectedQuestion.unit}` : ''}
                </span>
              </div>

              <div className="goals-stats">
                <div className="goals-stat">
                  <span className="goals-stat-icon">
                    <TrendingUp size={14} />
                  </span>
                  <span className={`goals-stat-value ${isCompleted ? 'completed' : ''}`}>
                    {progressPct}<span className="goals-stat-pct">%</span>
                  </span>
                  <span className="goals-stat-label">Progress</span>
                </div>
                <div className="goals-stat">
                  <span className="goals-stat-icon">
                    <Clock size={14} />
                  </span>
                  <span className="goals-stat-value">{progress.daysRemaining}</span>
                  <span className="goals-stat-label">Days left</span>
                </div>
                <div className="goals-stat">
                  <span className="goals-stat-icon">
                    <CalendarDays size={14} />
                  </span>
                  <span className="goals-stat-value goals-stat-date">{selectedGoal.targetDate}</span>
                  <span className="goals-stat-label">Target date</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          activeGoals.length === 0 && (
            <div className="sl-empty">
              <div className="sl-empty-icon">
                <TargetIcon size={22} />
              </div>
              <p className="sl-empty-title">No active goals.</p>
              <p className="sl-empty-text">
                Open "Manage goals" below to create your first one.
              </p>
            </div>
          )
        )}

        {/* Manage Goals */}
        <div className="sl-section-header" style={{ marginTop: 40 }}>
          <button
            type="button"
            className="sl-collapsible"
            onClick={() => setManageOpen(!manageOpen)}
          >
            {manageOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Manage goals <span className="count">({activeGoals.length})</span>
          </button>
        </div>

        {manageOpen && (
          <>
            <div className="goals-list">
              {activeGoals.map((g) =>
                editingId === g.id ? (
                  <form
                    key={g.id}
                    className="goals-edit-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                      void handleSaveEdit()
                    }}
                  >
                    <div className="sl-field">
                      <label className="sl-label">Goal</label>
                      <p className="sl-help">
                        A short description of what you're working toward.
                      </p>
                      <input
                        className="sl-input"
                        placeholder="Goal description"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <div className="sl-field sl-field-row">
                      <div>
                        <label className="sl-label">Target value</label>
                        <p className="sl-help">
                          The total to reach across all daily entries.
                        </p>
                        <input
                          className="sl-input"
                          type="number"
                          placeholder="200"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          inputMode="decimal"
                        />
                      </div>
                      <div>
                        <label className="sl-label">Target date</label>
                        <p className="sl-help">
                          When you want to hit your target.
                        </p>
                        <input
                          className="sl-input"
                          type="date"
                          min={todayStr}
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="sl-field">
                      <label className="sl-label">Linked question</label>
                      <p className="sl-help">
                        The numeric question whose daily values count toward this goal.
                      </p>
                      <select
                        className="sl-select"
                        value={editQuestionId}
                        onChange={(e) => setEditQuestionId(e.target.value)}
                      >
                        {availableQuestionsForEdit.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title}{q.unit ? ` (${q.unit})` : ''}
                          </option>
                        ))}
                        {!availableQuestionsForEdit.find((q) => q.id === editQuestionId) && (
                          <option value={editQuestionId}>
                            {getQuestionLabel(editQuestionId)}
                          </option>
                        )}
                      </select>
                    </div>
                    <div className="goals-form-actions">
                      <button
                        type="button"
                        className="sl-button quiet"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="sl-button" disabled={!isEditValid}>
                        <Check size={14} />
                        Save
                      </button>
                    </div>
                    {!isEditValid && (
                      <p className="sl-form-hint">Fill all fields to save</p>
                    )}
                  </form>
                ) : (
                  <div key={g.id} className="sl-row">
                    <div className="sl-row-body">
                      <span className="sl-row-title">{g.description}</span>
                      <span className="sl-row-sub">
                        {getQuestionLabel(g.questionId)} · target {g.targetValue} by {g.targetDate}
                      </span>
                    </div>
                    <div className="sl-row-actions">
                      <button
                        type="button"
                        className="sl-icon-button primary"
                        onClick={() => startEditing(g)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="sl-icon-button"
                        onClick={() => handleArchive(g.id)}
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {!showAddForm ? (
              <button
                type="button"
                className="sl-button dashed block goals-add-btn"
                onClick={() => {
                  setNewQuestionId(availableQuestionsForAdd[0]?.id ?? '')
                  setShowAddForm(true)
                }}
                disabled={availableQuestionsForAdd.length === 0}
              >
                <Plus size={16} />
                {availableQuestionsForAdd.length === 0 ? 'All numeric questions have goals' : 'Add a goal'}
              </button>
            ) : (
              <form
                className="goals-add-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
                  void handleAddGoal()
                }}
              >
                <div className="goals-add-form-head">
                  <p className="sl-eyebrow" style={{ margin: 0 }}>New goal</p>
                  <button
                    type="button"
                    className="sl-icon-button"
                    onClick={() => setShowAddForm(false)}
                    aria-label="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="sl-field">
                  <label className="sl-label">Goal</label>
                  <p className="sl-help">
                    A short description of what you're working toward.
                  </p>
                  <input
                    className="sl-input"
                    placeholder="e.g. Run a half marathon"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="sl-field sl-field-row">
                  <div>
                    <label className="sl-label">Target value</label>
                    <p className="sl-help">
                      The total to reach across all daily entries.
                    </p>
                    <input
                      className="sl-input"
                      type="number"
                      placeholder="200"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <label className="sl-label">Target date</label>
                    <p className="sl-help">
                      When you want to hit your target.
                    </p>
                    <input
                      className="sl-input"
                      type="date"
                      min={todayStr}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sl-field">
                  <label className="sl-label">Linked question</label>
                  <p className="sl-help">
                    The numeric question whose daily values count toward this goal.
                  </p>
                  <select
                    className="sl-select"
                    value={newQuestionId}
                    onChange={(e) => setNewQuestionId(e.target.value)}
                  >
                    {availableQuestionsForAdd.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}{q.unit ? ` (${q.unit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="sl-button block" disabled={!isAddValid}>
                  Save goal
                </button>
                {!isAddValid && (
                  <p className="sl-form-hint">Fill all fields to save</p>
                )}
              </form>
            )}
          </>
        )}

        {/* Archived Goals */}
        {archivedGoals.length > 0 && (
          <>
            <div className="sl-section-header">
              <button
                type="button"
                className="sl-collapsible"
                onClick={() => setArchivedOpen(!archivedOpen)}
              >
                {archivedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Archived <span className="count">({archivedGoals.length})</span>
              </button>
            </div>
            {archivedOpen && (
              <div className="goals-list">
                {archivedGoals.map((g) => (
                  <div key={g.id} className="sl-row goals-row-archived">
                    <div className="sl-row-body">
                      <span className="sl-row-title">{g.description}</span>
                      <span className="sl-row-sub">
                        {getQuestionLabel(g.questionId)} · target {g.targetValue} by {g.targetDate}
                        {g.completedAt ? ' · completed' : ''}
                      </span>
                    </div>
                    <div className="sl-row-actions">
                      <button
                        type="button"
                        className="sl-icon-button primary"
                        onClick={() => handleRestore(g.id)}
                        title="Restore"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
