import { useState, useEffect, useCallback } from 'react'
import { Plus, Archive, RotateCcw, X, Pencil, Check, ChevronDown, ChevronRight, Trophy, TrendingUp, Clock, CalendarDays } from 'lucide-react'
import { GoalsEmptyState } from '../components/EmptyStates'
import { getQuestions, type Question } from '../utils/questions'
import { getAllEntries, type DailyEntry } from '../utils/storage'
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const numberQuestions = allQuestions.filter((q) => q.type === 'number')

  const activeGoals = goals.filter((g) => g.active)
  const archivedGoals = goals.filter((g) => !g.active)

  // Progress view state
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const selectedGoal = activeGoals.find((g) => g.id === selectedGoalId)

  // Management state
  const [manageOpen, setManageOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form state
  const [newDesc, setNewDesc] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newQuestionId, setNewQuestionId] = useState('')

  // Edit form state
  const [editDesc, setEditDesc] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editQuestionId, setEditQuestionId] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  // Get questions already assigned to an active goal (for validation)
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

  // Initial data load
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
    const targetVal = parseFloat(newTarget)
    if (!newDesc.trim() || !newTarget || isNaN(targetVal) || targetVal <= 0 || !newDate || !newQuestionId) {
      alert('Please fill in all fields with valid values.')
      return
    }
    await addGoal(newDesc.trim(), targetVal, newDate, newQuestionId)
    await refreshGoals()
    setNewDesc('')
    setNewTarget('')
    setNewDate('')
    setNewQuestionId(availableQuestionsForAdd[0]?.id ?? '')
    setShowAddForm(false)
  }

  const startEditing = (g: Goal) => {
    setEditingId(g.id)
    setEditDesc(g.description)
    setEditTarget(String(g.targetValue))
    setEditDate(g.targetDate)
    setEditQuestionId(g.questionId)
  }

  const handleSaveEdit = async () => {
    const targetVal = parseFloat(editTarget)
    if (!editingId || !editDesc.trim() || isNaN(targetVal) || targetVal <= 0 || !editDate || !editQuestionId) {
      alert('Please fill in all fields with valid values.')
      return
    }
    await updateGoal(editingId, editDesc.trim(), targetVal, editDate, editQuestionId)
    await refreshGoals()
    setEditingId(null)
  }

  const handleArchive = async (id: string) => {
    if (confirm('Archive this goal? It will be moved to the archived section.')) {
      await archiveGoal(id)
      await refreshGoals()
    }
  }

  const handleRestore = async (id: string) => {
    await restoreGoal(id)
    await refreshGoals()
  }

  const getQuestionLabel = (questionId: string): string => {
    const q = allQuestions.find((q) => q.id === questionId)
    return q ? `${q.title}${q.unit ? ` (${q.unit})` : ''}` : 'Unknown'
  }

  // Progress for selected goal
  const progress = selectedGoal ? getGoalProgress(selectedGoal, entries) : null
  const isCompleted = progress && progress.current >= progress.target
  const isOverdue = selectedGoal && !isCompleted && progress && progress.daysRemaining === 0

  // Auto-mark completed
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
      <div className="page">
        <div className="page-content">
          <h1 className="goals-header">Goals</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // No goals and no numeric questions
  if (numberQuestions.length === 0) {
    return (
      <div className="page">
        <div className="page-content">
          <h1 className="goals-header">Goals</h1>
          <div className="goals-empty">
            <GoalsEmptyState />
            <p className="goals-empty-title">No numeric questions yet</p>
            <p className="goals-empty-text">
              Add a question with the "Number" type in Settings before creating goals.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="goals-header">Goals</h1>

        {/* Progress View */}
        {activeGoals.length > 0 && selectedGoal && progress ? (
          <>
            <div className="goals-select-wrapper">
              <select
                className="goals-select"
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.description}
                  </option>
                ))}
              </select>
            </div>

            {isCompleted && (
              <div className="goals-met-banner">
                <Trophy size={24} />
                Goal Met!
              </div>
            )}

            <div className="goals-progress-card">
              <div className="goals-progress-header">
                <span className="goals-progress-description">
                  {getQuestionLabel(selectedGoal.questionId)}
                </span>
                <span className={`goals-progress-badge ${isCompleted ? 'completed' : isOverdue ? 'overdue' : 'active'}`}>
                  {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'In Progress'}
                </span>
              </div>

              <div className="goals-bar-container">
                <div
                  className={`goals-bar-fill ${isCompleted ? 'completed' : isOverdue ? 'overdue' : ''}`}
                  style={{ width: `${Math.max(progress.percentage, 2)}%` }}
                />
                {progress.percentage >= 15 && (
                  <span className="goals-bar-percentage">{progress.percentage}%</span>
                )}
              </div>

              <div className="goals-bar-label">
                <span>
                  {progress.current % 1 === 0 ? progress.current : progress.current.toFixed(1)}
                  {selectedQuestion?.unit ? ` ${selectedQuestion.unit}` : ''}
                </span>
                <span>
                  {progress.target % 1 === 0 ? progress.target : progress.target.toFixed(1)}
                  {selectedQuestion?.unit ? ` ${selectedQuestion.unit}` : ''}
                </span>
              </div>

              <div className="goals-stats">
                <div className="goals-stat-card">
                  <span className="goals-stat-icon">
                    <TrendingUp size={14} color="var(--primary)" />
                  </span>
                  <span className={`goals-stat-value ${isCompleted ? 'completed' : ''}`}>
                    {progress.percentage}%
                  </span>
                  <span className="goals-stat-label">Progress</span>
                </div>
                <div className="goals-stat-card">
                  <span className="goals-stat-icon">
                    <Clock size={14} color="var(--primary)" />
                  </span>
                  <span className="goals-stat-value">
                    {progress.daysRemaining}
                  </span>
                  <span className="goals-stat-label">Days Left</span>
                </div>
                <div className="goals-stat-card">
                  <span className="goals-stat-icon">
                    <CalendarDays size={14} color="var(--primary)" />
                  </span>
                  <span className="goals-stat-value">
                    {selectedGoal.targetDate}
                  </span>
                  <span className="goals-stat-label">Target Date</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          activeGoals.length === 0 && (
            <div className="goals-empty">
              <GoalsEmptyState />
              <p className="goals-empty-title">No active goals</p>
              <p className="goals-empty-text">
                Create a goal below to start tracking your progress.
              </p>
            </div>
          )
        )}

        {/* Manage Goals Section */}
        <div className="goals-manage-section">
          <button className="goals-collapsible-header" onClick={() => setManageOpen(!manageOpen)}>
            {manageOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <span className="goals-section-title">Manage Goals ({activeGoals.length})</span>
          </button>

          {manageOpen && (
            <>
              <div className="goals-list">
                {activeGoals.map((g) =>
                  editingId === g.id ? (
                    <div key={g.id} className="goals-edit-row">
                      <input
                        className="goals-form-input"
                        placeholder="Goal description"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <label className="goals-form-label">Target Value</label>
                      <input
                        className="goals-form-input"
                        type="number"
                        placeholder="Target value"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                      />
                      <label className="goals-form-label">Target Date</label>
                      <input
                        className="goals-form-input"
                        type="date"
                        min={todayStr}
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <label className="goals-form-label">Linked Question</label>
                      <select
                        className="goals-form-select"
                        value={editQuestionId}
                        onChange={(e) => setEditQuestionId(e.target.value)}
                      >
                        {availableQuestionsForEdit.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title}{q.unit ? ` (${q.unit})` : ''}
                          </option>
                        ))}
                        {/* Always show current question even if assigned */}
                        {!availableQuestionsForEdit.find((q) => q.id === editQuestionId) && (
                          <option value={editQuestionId}>
                            {getQuestionLabel(editQuestionId)}
                          </option>
                        )}
                      </select>
                      <div className="goals-edit-actions">
                        <button className="goals-edit-action-btn cancel" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                        <button className="goals-edit-action-btn save" onClick={handleSaveEdit}>
                          <Check size={16} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={g.id} className="goals-row">
                      <div className="goals-row-info">
                        <span className="goals-row-title">{g.description}</span>
                        <span className="goals-row-meta">
                          {getQuestionLabel(g.questionId)} &middot; Target: {g.targetValue} by {g.targetDate}
                        </span>
                      </div>
                      <div className="goals-row-actions">
                        <button
                          className="goals-row-action edit"
                          onClick={() => startEditing(g)}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="goals-row-action archive"
                          onClick={() => handleArchive(g.id)}
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {!showAddForm ? (
                <button
                  className="goals-add-btn"
                  onClick={() => {
                    setNewQuestionId(availableQuestionsForAdd[0]?.id ?? '')
                    setShowAddForm(true)
                  }}
                  disabled={availableQuestionsForAdd.length === 0}
                >
                  <Plus size={18} />
                  {availableQuestionsForAdd.length === 0 ? 'All numeric questions have goals' : 'Add Goal'}
                </button>
              ) : (
                <div className="goals-add-form">
                  <div className="goals-add-form-header">
                    <span className="goals-add-form-title">New Goal</span>
                    <button className="goals-add-form-close" onClick={() => setShowAddForm(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <input
                    className="goals-form-input"
                    placeholder="Goal description (e.g. Run a half marathon)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                  <label className="goals-form-label">Target Value</label>
                  <input
                    className="goals-form-input"
                    type="number"
                    placeholder="Target value (e.g. 200)"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                  <label className="goals-form-label">Target Date</label>
                  <input
                    className="goals-form-input"
                    type="date"
                    min={todayStr}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <label className="goals-form-label">Linked Question</label>
                  <select
                    className="goals-form-select"
                    value={newQuestionId}
                    onChange={(e) => setNewQuestionId(e.target.value)}
                  >
                    {availableQuestionsForAdd.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}{q.unit ? ` (${q.unit})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="goals-form-submit"
                    onClick={handleAddGoal}
                  >
                    Save Goal
                  </button>
                </div>
              )}
            </>
          )}

          {/* Archived Goals */}
          {archivedGoals.length > 0 && (
            <>
              <button className="goals-collapsible-header" onClick={() => setArchivedOpen(!archivedOpen)}>
                {archivedOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span className="goals-section-title archived-title">Archived ({archivedGoals.length})</span>
              </button>
              {archivedOpen && (
                <div className="goals-list">
                  {archivedGoals.map((g) => (
                    <div key={g.id} className="goals-row archived">
                      <div className="goals-row-info">
                        <span className="goals-row-title">{g.description}</span>
                        <span className="goals-row-meta">
                          {getQuestionLabel(g.questionId)} &middot; Target: {g.targetValue} by {g.targetDate}
                          {g.completedAt ? ' (Completed)' : ''}
                        </span>
                      </div>
                      <div className="goals-row-actions">
                        <button
                          className="goals-row-action restore"
                          onClick={() => handleRestore(g.id)}
                          title="Restore"
                        >
                          <RotateCcw size={16} />
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
    </div>
  )
}
