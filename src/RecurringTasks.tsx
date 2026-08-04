import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react'
import { supabase } from './lib/supabase'
import { CATEGORY_COLORS } from './lib/colors'
import { todayLocalISO, addDaysLocalISO, daysFromToday, formatDateLong } from './lib/dates'
import type { RecurringTask, TaskCategory } from './types'

// Native date inputs only open their calendar popup when the tiny icon is tapped —
// this makes the whole field open it, which matters a lot on mobile.
function openDatePicker(e: MouseEvent<HTMLInputElement>) {
  e.currentTarget.showPicker?.()
}

function dueLabel(days: number): { text: string; className: string } {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'due overdue' }
  if (days === 0) return { text: 'Due today', className: 'due today' }
  if (days === 1) return { text: 'Due tomorrow', className: 'due soon' }
  return { text: `Due in ${days}d`, className: 'due upcoming' }
}

// Fraction of the current interval elapsed, anchored on next_due_at rather than
// last_completed_at — works even for tasks that have never been completed yet.
function burndownFraction(nextDueAt: string, intervalDays: number): number {
  const cycleStart = addDaysLocalISO(nextDueAt, -intervalDays)
  const [sy, sm, sd] = cycleStart.split('-').map(Number)
  const [ey, em, ed] = nextDueAt.split('-').map(Number)
  const startMs = new Date(sy, sm - 1, sd).getTime()
  const endMs = new Date(ey, em - 1, ed).getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (endMs === startMs) return 1
  return Math.min(1, Math.max(0, (today.getTime() - startMs) / (endMs - startMs)))
}

// green = not due for a while, yellow = nearing due (or due today), red = overdue.
// Yellow's threshold is fraction-based (not a fixed day count) so it scales sensibly
// across both short (3-day) and long (365-day) intervals.
function burndownTone(days: number, fraction: number): 'green' | 'yellow' | 'red' {
  if (days < 0) return 'red'
  if (days === 0 || fraction >= 0.8) return 'yellow'
  return 'green'
}

function BurndownBar({ task, days }: { task: RecurringTask; days: number }) {
  const fraction = burndownFraction(task.next_due_at, task.interval_days)
  const tone = burndownTone(days, fraction)
  return (
    <span className="burndown" title={`${Math.round(fraction * 100)}% of the way to due`}>
      <span className={`burndown-fill burndown-${tone}`} style={{ width: `${fraction * 100}%` }} />
    </span>
  )
}

function CategoryPill({ category }: { category: TaskCategory }) {
  return (
    <span className="category-pill" style={{ '--cat-color': category.color } as CSSProperties}>
      {category.name}
    </span>
  )
}

function CategoryPicker({
  categories,
  value,
  onChange,
  onCreated,
}: {
  categories: TaskCategory[]
  value: string | null
  onChange: (id: string) => void
  onCreated: (category: TaskCategory) => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function createCategory() {
    if (!newName.trim()) return
    setSaving(true)
    setErr(null)
    const { data, error } = await supabase
      .from('task_categories')
      .insert({ name: newName.trim(), color: newColor })
      .select()
      .single()
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    const created = data as TaskCategory
    onCreated(created)
    onChange(created.id)
    setCreating(false)
    setNewName('')
    setNewColor(CATEGORY_COLORS[0])
  }

  if (creating) {
    return (
      <div className="category-picker-new">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
        />
        <div className="color-swatches">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch${c === newColor ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setNewColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        {err && <span className="field-error">{err}</span>}
        <div className="category-picker-actions">
          <button
            type="button"
            className="secondary-button small"
            onClick={createCategory}
            disabled={saving || !newName.trim()}
          >
            {saving ? 'Adding…' : 'Add category'}
          </button>
          <button type="button" className="secondary-button small" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <select
      className="category-select"
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === '__new__') setCreating(true)
        else onChange(e.target.value)
      }}
      required
    >
      <option value="" disabled>
        Select a category…
      </option>
      {categories.map((c) => (
        <option key={c.id} value={c.id} style={{ color: c.color }}>
          {c.name}
        </option>
      ))}
      <option value="__new__">+ New category…</option>
    </select>
  )
}

function CategoryRow({
  category,
  isFallback,
  onSaved,
  onDeleted,
}: {
  category: TaskCategory
  isFallback: boolean
  onSaved: () => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setErr(null)
    const { error } = await supabase
      .from('task_categories')
      .update({ name: name.trim(), color })
      .eq('id', category.id)
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    setEditing(false)
    onSaved()
  }

  async function del() {
    setSaving(true)
    setErr(null)
    const { data: fallback, error: fallbackError } = await supabase
      .from('task_categories')
      .select('id')
      .eq('name', 'Uncategorized')
      .single()
    if (fallbackError || !fallback) {
      setSaving(false)
      setErr(fallbackError?.message ?? 'Missing "Uncategorized" fallback category')
      return
    }
    const { error: reassignError } = await supabase
      .from('recurring_tasks')
      .update({ category_id: fallback.id })
      .eq('category_id', category.id)
    if (reassignError) {
      setSaving(false)
      setErr(reassignError.message)
      return
    }
    const { error: deleteError } = await supabase.from('task_categories').delete().eq('id', category.id)
    setSaving(false)
    if (deleteError) {
      setErr(deleteError.message)
      return
    }
    onDeleted()
  }

  if (!editing) {
    return (
      <button type="button" className="category-row" onClick={() => setEditing(true)}>
        <span className="category-row-swatch" style={{ background: category.color }} />
        <span className="category-row-name">{category.name}</span>
      </button>
    )
  }

  return (
    <div className="category-row-editing">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="color-swatches">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch${c === color ? ' selected' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      {err && <span className="field-error">{err}</span>}
      <div className="category-picker-actions">
        <button type="button" className="secondary-button small" onClick={save} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="secondary-button small" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
      {!isFallback &&
        (confirmingDelete ? (
          <div className="confirm-delete">
            <span>Delete? Tasks using it move to "Uncategorized".</span>
            <button type="button" className="danger-button" onClick={del} disabled={saving}>
              Confirm delete
            </button>
            <button type="button" className="secondary-button small" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="danger-link" onClick={() => setConfirmingDelete(true)}>
            Delete category
          </button>
        ))}
    </div>
  )
}

function ManageCategoriesModal({
  categories,
  onClose,
  onChanged,
}: {
  categories: TaskCategory[]
  onClose: () => void
  onChanged: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Manage categories</h2>
        <div className="category-list">
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              isFallback={c.name === 'Uncategorized'}
              onSaved={onChanged}
              onDeleted={onChanged}
            />
          ))}
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function DoneDatePopup({
  task,
  onCancel,
  onConfirm,
}: {
  task: RecurringTask
  onCancel: () => void
  onConfirm: (date: string) => void
}) {
  const [date, setDate] = useState(todayLocalISO())
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Mark done</h2>
        <p className="modal-task-name">{task.name}</p>
        <label className="due-date-label">
          Completed on
          <input
            type="date"
            value={date}
            max={todayLocalISO()}
            onClick={openDatePicker}
            onChange={(e) => setDate(e.target.value)}
            autoFocus
          />
        </label>
        <div className="form-actions">
          <button type="button" className="primary-button" onClick={() => onConfirm(date)}>
            Confirm
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskDetailModal({
  task,
  categories,
  onClose,
  onSaved,
  onDeleted,
  onCategoryCreated,
}: {
  task: RecurringTask
  categories: TaskCategory[]
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
  onCategoryCreated: (category: TaskCategory) => void
}) {
  const [name, setName] = useState(task.name)
  const [categoryId, setCategoryId] = useState(task.category_id)
  const [interval, setInterval_] = useState(task.interval_days)
  const [dueDate, setDueDate] = useState(task.next_due_at)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const history = [...task.completions].sort((a, b) => b.completed_at.localeCompare(a.completed_at))

  async function save() {
    if (!name.trim() || interval <= 0) return
    setSaving(true)
    setErr(null)
    const { error } = await supabase
      .from('recurring_tasks')
      .update({
        name: name.trim(),
        category_id: categoryId,
        interval_days: interval,
        next_due_at: dueDate,
        notes: notes.trim() || null,
      })
      .eq('id', task.id)
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    onSaved()
  }

  async function confirmDelete() {
    setSaving(true)
    setErr(null)
    const { error } = await supabase.from('recurring_tasks').update({ is_archived: true }).eq('id', task.id)
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    onDeleted()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Edit task</h2>
        {err && <div className="error-banner">{err}</div>}

        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
        />
        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          onCreated={onCategoryCreated}
        />
        <label className="interval-label">
          Every
          <input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
          />
          days
        </label>
        <label className="due-date-label">
          Next due
          <input type="date" value={dueDate} onClick={openDatePicker} onChange={(e) => setDueDate(e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="button" className="primary-button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="history-section">
          <h3>History</h3>
          {history.length === 0 ? (
            <p className="empty-state small">No completions logged yet.</p>
          ) : (
            <ul className="history-list">
              {history.map((h, i) => (
                <li key={`${h.completed_at}-${i}`}>{formatDateLong(h.completed_at)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="danger-zone">
          {confirmingDelete ? (
            <div className="confirm-delete">
              <span>Delete this task?</span>
              <button type="button" className="danger-button" onClick={confirmDelete} disabled={saving}>
                Confirm delete
              </button>
              <button type="button" className="secondary-button small" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="danger-link" onClick={() => setConfirmingDelete(true)}>
              Delete task
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type SortOption = 'due' | 'name' | 'category'

export default function RecurringTasks() {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null)
  const [newInterval, setNewInterval] = useState(30)
  const [newDueDate, setNewDueDate] = useState('') // optional override; blank = today + interval
  const [newNotes, setNewNotes] = useState('')

  const [doneTask, setDoneTask] = useState<RecurringTask | null>(null)
  const [detailTask, setDetailTask] = useState<RecurringTask | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)

  const [sortBy, setSortBy] = useState<SortOption>('due')
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null) // null = All

  async function loadTasks() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select(
        '*, category:task_categories(id, name, color, created_at), completions:recurring_task_completions(completed_at)'
      )
      .eq('is_archived', false)
      .order('next_due_at', { ascending: true })
      .order('completed_at', { ascending: true, referencedTable: 'recurring_task_completions' })

    if (error) {
      setError(error.message)
    } else {
      setTasks((data ?? []) as RecurringTask[])
    }
    setLoading(false)
  }

  async function loadCategories() {
    const { data, error } = await supabase.from('task_categories').select('*').order('name')
    if (!error) setCategories((data ?? []) as TaskCategory[])
  }

  useEffect(() => {
    loadTasks()
    loadCategories()
  }, [])

  function handleCategoryCreated(category: TaskCategory) {
    setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleCategoriesChanged() {
    await Promise.all([loadCategories(), loadTasks()])
    setSelectedFilter(null) // a category id may have been deleted/reassigned — reset to All
  }

  const displayedTasks = useMemo(() => {
    const result = selectedFilter === null ? tasks : tasks.filter((t) => t.category_id === selectedFilter)
    const sorted = [...result]
    if (sortBy === 'due') {
      sorted.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => a.category.name.localeCompare(b.category.name))
    }
    return sorted
  }, [tasks, selectedFilter, sortBy])

  async function markDone(task: RecurringTask, completedDate: string) {
    const nextDueStr = addDaysLocalISO(completedDate, task.interval_days)

    // Optimistic update so the tap feels instant
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, last_completed_at: completedDate, next_due_at: nextDueStr } : t
      )
    )

    const [updateResult, insertResult] = await Promise.all([
      supabase
        .from('recurring_tasks')
        .update({ last_completed_at: completedDate, next_due_at: nextDueStr })
        .eq('id', task.id),
      supabase
        .from('recurring_task_completions')
        .insert({ task_id: task.id, completed_at: completedDate }),
    ])

    if (updateResult.error || insertResult.error) {
      setError(updateResult.error?.message ?? insertResult.error?.message ?? 'Failed to mark done')
      loadTasks() // revert optimistic update by re-fetching real state
    } else {
      loadTasks() // re-sort by the new next_due_at
    }
  }

  async function addTask(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim() || newInterval <= 0) return
    if (!newCategoryId) {
      setError('Please choose a category.')
      return
    }

    // Default: "starting now, first due in N days" — not "due today" regardless of
    // interval, which made no sense for a freshly created task. An explicit initial
    // due date, if given, always wins.
    const initialDueDate = newDueDate || addDaysLocalISO(todayLocalISO(), newInterval)

    const { error } = await supabase.from('recurring_tasks').insert({
      name: newName.trim(),
      category_id: newCategoryId,
      interval_days: newInterval,
      next_due_at: initialDueDate,
      notes: newNotes.trim() || null,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNewName('')
    setNewCategoryId(null)
    setNewInterval(30)
    setNewDueDate('')
    setNewNotes('')
    setShowAddForm(false)
    loadTasks()
  }

  return (
    <div className="recurring-tasks">
      <header className="page-header">
        <h1>Recurring Tasks</h1>
        <p className="subtitle">Interval-based tasks with no fixed date — the "Regularly" replacement.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {tasks.length > 0 && (
        <div className="toolbar">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="due">Sort: Soonest due</option>
            <option value="name">Sort: Name</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>
      )}

      {categories.length > 0 && (
        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip${selectedFilter === null ? ' active' : ''}`}
            onClick={() => setSelectedFilter(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`filter-chip${selectedFilter === c.id ? ' active' : ''}`}
              style={{ '--cat-color': c.color } as CSSProperties}
              onClick={() => setSelectedFilter(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <button
          type="button"
          className="manage-categories-link"
          onClick={() => setManagingCategories(true)}
        >
          Manage categories
        </button>
      )}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : displayedTasks.length === 0 ? (
        <p className="empty-state">
          {tasks.length === 0 ? 'Nothing here yet — add your first recurring task below.' : 'No tasks match this filter.'}
        </p>
      ) : (
        <ul className="task-list compact">
          {displayedTasks.map((task) => {
            const days = daysFromToday(task.next_due_at)
            const label = dueLabel(days)
            return (
              <li key={task.id} className="task-card compact" onClick={() => setDetailTask(task)}>
                <div className="task-info">
                  <span className="task-name">{task.name}</span>
                  <div className="task-meta">
                    <CategoryPill category={task.category} />
                    <span className={label.className}>{label.text}</span>
                    <BurndownBar task={task} days={days} />
                  </div>
                </div>
                <button
                  type="button"
                  className="done-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDoneTask(task)
                  }}
                >
                  ✓ Done
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showAddForm ? (
        <form className="add-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Task name (e.g. Change air filter)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            rows={2}
          />
          <CategoryPicker
            categories={categories}
            value={newCategoryId}
            onChange={setNewCategoryId}
            onCreated={handleCategoryCreated}
          />
          <label className="interval-label">
            Every
            <input
              type="number"
              min={1}
              value={newInterval}
              onChange={(e) => setNewInterval(Number(e.target.value))}
              required
            />
            days
          </label>
          <label className="due-date-label">
            First due
            <input
              type="date"
              value={newDueDate}
              min={todayLocalISO()}
              onClick={openDatePicker}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <span className="due-date-hint">
              {newDueDate ? '' : `optional — defaults to ${newInterval}d from today`}
            </span>
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button">Add</button>
            <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="add-button" onClick={() => setShowAddForm(true)}>
          + Add recurring task
        </button>
      )}

      {doneTask && (
        <DoneDatePopup
          task={doneTask}
          onCancel={() => setDoneTask(null)}
          onConfirm={(date) => {
            setDoneTask(null)
            markDone(doneTask, date)
          }}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          categories={categories}
          onClose={() => setDetailTask(null)}
          onSaved={() => {
            setDetailTask(null)
            loadTasks()
          }}
          onDeleted={() => {
            setDetailTask(null)
            loadTasks()
          }}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {managingCategories && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setManagingCategories(false)}
          onChanged={handleCategoriesChanged}
        />
      )}
    </div>
  )
}
