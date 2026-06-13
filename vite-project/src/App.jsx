import { useEffect, useMemo, useState } from 'react'
import './App.css'

const categories = [
  'Food',
  'Groceries',
  'Fuel',
  'Bills',
  'Rent',
  'Shopping',
  'Family',
  'Kids',
  'Health',
  'Loan',
  'Entertainment',
  'Other',
]

const paymentTypes = ['Cash', 'Bank', 'Card', 'E-wallet']

const defaultSettings = {
  pin: '1234',
  monthlyBudget: 2500,
  theme: 'light',
}

const storage = {
  expenses: 'duitlife_expenses',
  settings: 'duitlife_settings',
}

const formatRM = (value) => `RM${Number(value || 0).toFixed(2)}`
const getMonthKey = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function safeParse(value, fallback) {
  if (value == null) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function buildMonthOptions() {
  const options = []
  const today = new Date()
  for (let offset = 0; offset < 12; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })
    options.push({ key, label })
  }
  return options
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [page, setPage] = useState('dashboard')
  const [expenses, setExpenses] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [theme, setTheme] = useState(defaultSettings.theme)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Food',
    amount: '',
    paymentType: 'Cash',
    notes: '',
  })
  const [editId, setEditId] = useState(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [pinChange, setPinChange] = useState({ current: '', pin: '', confirm: '' })
  const [restoreJson, setRestoreJson] = useState('')
  const [reportMonth, setReportMonth] = useState(getMonthKey(new Date()))

  useEffect(() => {
    const savedExpenses = safeParse(localStorage.getItem(storage.expenses), [])
    const savedSettings = safeParse(localStorage.getItem(storage.settings), defaultSettings)
    setExpenses(Array.isArray(savedExpenses) ? savedExpenses : [])
    setSettings({ ...defaultSettings, ...savedSettings })
    setTheme(savedSettings?.theme || defaultSettings.theme)
    setBudgetInput(String(savedSettings?.monthlyBudget ?? defaultSettings.monthlyBudget))
  }, [])

  useEffect(() => {
    localStorage.setItem(storage.expenses, JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem(storage.settings, JSON.stringify({ ...settings, theme }))
    setTheme(settings.theme)
  }, [settings, theme])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const now = new Date()
  const currentMonthKey = getMonthKey(now)
  const currentDateKey = now.toISOString().slice(0, 10)

  const currentMonthExpenses = useMemo(
    () => expenses.filter((expense) => getMonthKey(expense.date) === currentMonthKey),
    [expenses, currentMonthKey],
  )

  const todayExpenses = useMemo(
    () => currentMonthExpenses.filter((expense) => expense.date === currentDateKey),
    [currentDateKey, currentMonthExpenses],
  )

  const monthTotal = useMemo(
    () => currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [currentMonthExpenses],
  )

  const todayTotal = useMemo(
    () => todayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [todayExpenses],
  )

  const remainingBudget = useMemo(
    () => Math.max(settings.monthlyBudget - monthTotal, 0),
    [monthTotal, settings.monthlyBudget],
  )

  const topCategory = useMemo(() => {
    const totals = currentMonthExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Other'
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0)
      return acc
    }, {})
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)[0]
  }, [currentMonthExpenses])

  const lastSevenChart = useMemo(() => {
    const points = []
    for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - daysAgo)
      const key = date.toISOString().slice(0, 10)
      const total = currentMonthExpenses
        .filter((expense) => expense.date === key)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      points.push({ label: date.toLocaleDateString('default', { weekday: 'short' }), value: total })
    }
    return points
  }, [currentMonthExpenses, now])

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [expenses],
  )

  const reportOptions = buildMonthOptions()

  const selectedReportExpenses = useMemo(
    () => expenses.filter((expense) => getMonthKey(expense.date) === reportMonth),
    [expenses, reportMonth],
  )

  const reportTotals = useMemo(() => {
    const category = {}
    const payment = {}
    const daily = {}
    let total = 0

    selectedReportExpenses.forEach((expense) => {
      const amount = Number(expense.amount || 0)
      total += amount
      category[expense.category] = (category[expense.category] || 0) + amount
      payment[expense.paymentType] = (payment[expense.paymentType] || 0) + amount
      daily[expense.date] = (daily[expense.date] || 0) + amount
    })

    const dailySorted = Object.entries(daily).sort((a, b) => new Date(a[0]) - new Date(b[0]))
    return { total, category, payment, daily: dailySorted }
  }, [selectedReportExpenses])

  const handleLogin = (event) => {
    event.preventDefault()
    if (pinInput === settings.pin) {
      setAuthenticated(true)
      setPinInput('')
      setPage('dashboard')
      return
    }
    alert('Incorrect PIN. Try 1234.')
    setPinInput('')
  }

  const handleSaveExpense = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.date || !form.category || !form.paymentType || Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid date, category, payment type, and amount.')
      return
    }
    const newExpense = {
      id: editId || `${Date.now()}`,
      date: form.date,
      category: form.category,
      paymentType: form.paymentType,
      amount,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    }
    setExpenses((prev) => {
      if (editId) {
        return prev.map((expense) => (expense.id === editId ? newExpense : expense))
      }
      return [newExpense, ...prev]
    })
    setEditId(null)
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: 'Food',
      amount: '',
      paymentType: 'Cash',
      notes: '',
    })
    if (page !== 'add') {
      setPage('dashboard')
    }
  }

  const handleQuickAmount = (value) => {
    setForm((prev) => ({ ...prev, amount: String(Number(prev.amount || 0) + value) }))
  }

  const handleEdit = (expense) => {
    setEditId(expense.id)
    setForm({
      date: expense.date,
      category: expense.category,
      amount: String(expense.amount),
      paymentType: expense.paymentType,
      notes: expense.notes || '',
    })
    setPage('add')
  }

  const handleDelete = (expenseId) => {
    if (window.confirm('Delete this expense permanently?')) {
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
    }
  }

  const handleBudgetSave = () => {
    const budget = Number(budgetInput)
    if (Number.isNaN(budget) || budget < 0) {
      alert('Enter a valid monthly budget.')
      return
    }
    setSettings((prev) => ({ ...prev, monthlyBudget: budget }))
    alert('Monthly budget updated.')
  }

  const handleChangePin = () => {
    if (pinChange.current !== settings.pin) {
      alert('Current PIN does not match.')
      return
    }
    if (pinChange.pin.length !== 4 || pinChange.pin !== pinChange.confirm) {
      alert('New PIN must be 4 digits and match the confirmation.')
      return
    }
    setSettings((prev) => ({ ...prev, pin: pinChange.pin }))
    setPinChange({ current: '', pin: '', confirm: '' })
    alert('PIN updated successfully.')
  }

  const handleBackup = () => {
    const payload = JSON.stringify({ settings, expenses }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'duitlife-backup.json'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const handleRestore = () => {
    try {
      const parsed = JSON.parse(restoreJson)
      if (!parsed || typeof parsed !== 'object') throw new Error()
      const nextExpenses = Array.isArray(parsed.expenses) ? parsed.expenses : []
      const nextSettings = { ...defaultSettings, ...(parsed.settings || {}) }
      setExpenses(nextExpenses)
      setSettings(nextSettings)
      setTheme(nextSettings.theme || defaultSettings.theme)
      setBudgetInput(String(nextSettings.monthlyBudget))
      setRestoreJson('')
      alert('Backup restored successfully.')
    } catch {
      alert('Invalid backup JSON.')
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all expense data and settings back to defaults?')) {
      setExpenses([])
      setSettings(defaultSettings)
      setTheme(defaultSettings.theme)
      setBudgetInput(String(defaultSettings.monthlyBudget))
      setPinChange({ current: '', pin: '', confirm: '' })
      setPage('dashboard')
      alert('DuitLife has been reset.')
    }
  }

  const handleExportReport = () => {
    const reportHtml = `
      <html>
      <head>
        <title>DuitLife Monthly Report</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
          h1,h2{margin:0 0 12px;}
          p{margin:4px 0;}
          table{width:100%;border-collapse:collapse;margin-top:16px;}
          th,td{padding:8px 10px;border:1px solid #ddd;text-align:left;}
          thead {background:#f8fafc;}
        </style>
      </head>
      <body>
        <h1>DuitLife Monthly Report</h1>
        <p><strong>Month:</strong> ${reportOptions.find((opt) => opt.key === reportMonth)?.label || reportMonth}</p>
        <p><strong>Total spent:</strong> ${formatRM(reportTotals.total)}</p>
        <h2>Category breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th>Amount</th></tr></thead>
          <tbody>
            ${Object.entries(reportTotals.category)
              .map(([category, amount]) => `<tr><td>${category}</td><td>${formatRM(amount)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
        <h2>Payment method breakdown</h2>
        <table>
          <thead><tr><th>Payment type</th><th>Amount</th></tr></thead>
          <tbody>
            ${Object.entries(reportTotals.payment)
              .map(([paymentType, amount]) => `<tr><td>${paymentType}</td><td>${formatRM(amount)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
        <h2>Daily spending</h2>
        <table>
          <thead><tr><th>Date</th><th>Amount</th></tr></thead>
          <tbody>
            ${reportTotals.daily
              .map(([date, amount]) => `<tr><td>${new Date(date).toLocaleDateString()}</td><td>${formatRM(amount)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(reportHtml)
      win.document.close()
      win.focus()
      win.print()
    }
  }

  const navButtons = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'add', label: editId ? 'Edit' : 'Add' },
    { id: 'report', label: 'Report' },
    { id: 'settings', label: 'Settings' },
  ]

  if (!authenticated) {
    return (
      <div className="app-shell login-screen">
        <div className="auth-card">
          <div className="brand-mark">D</div>
          <h1>DuitLife</h1>
          <p>Track monthly spending with a clean, mobile-first wallet.</p>
          <form onSubmit={handleLogin} className="auth-form">
            <label className="field-label">Enter 4-digit PIN</label>
            <input
              inputMode="numeric"
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/[^0-9]/g, ''))}
              className="text-input"
              placeholder="1234"
            />
            <button type="submit" className="button button-primary">
              Unlock
            </button>
          </form>
          <p className="hint">Default PIN is 1234. Change it in Settings after login.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DuitLife</p>
          <h1>Monthly Expense Tracker</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="button button-secondary" onClick={() => setAuthenticated(false)}>
            Logout
          </button>
        </div>
      </header>

      <nav className="section-tabs">
        {navButtons.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-button ${page === item.id ? 'active' : ''}`}
            onClick={() => {
              setPage(item.id)
              if (item.id === 'report') setReportMonth(currentMonthKey)
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="screen">
        {page === 'dashboard' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h2>Quick view</h2>
              </div>
              <div className="pill">Budget RM{settings.monthlyBudget}</div>
            </div>

            <div className="grid-2">
              <article className="card stat-card">
                <p className="stat-label">Today</p>
                <p className="stat-value">{formatRM(todayTotal)}</p>
                <p className="stat-note">Spent so far</p>
              </article>
              <article className="card stat-card">
                <p className="stat-label">This month</p>
                <p className="stat-value">{formatRM(monthTotal)}</p>
                <p className="stat-note">Total spending</p>
              </article>
              <article className="card stat-card">
                <p className="stat-label">Remaining</p>
                <p className="stat-value">{formatRM(remainingBudget)}</p>
                <p className="stat-note">From monthly budget</p>
              </article>
              <article className="card stat-card">
                <p className="stat-label">Top category</p>
                <p className="stat-value">{topCategory || '—'}</p>
                <p className="stat-note">Most spent area</p>
              </article>
            </div>

            <article className="card chart-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Daily spending</p>
                  <h2>Last 7 days</h2>
                </div>
                <span className="tag">Live</span>
              </div>
              <div className="chart-row">
                {lastSevenChart.map((point) => {
                  const maxValue = Math.max(...lastSevenChart.map((item) => item.value), 1)
                  const height = Math.round((point.value / maxValue) * 100)
                  return (
                    <div key={point.label} className="chart-bar">
                      <div className="bar" style={{ height: `${Math.max(height, 8)}%` }} />
                      <span className="bar-label">{point.label}</span>
                      <span className="bar-value">{formatRM(point.value)}</span>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h2>Latest expenses</h2>
                </div>
                <button type="button" className="button button-ghost" onClick={() => setPage('add')}>
                  Add expense
                </button>
              </div>
              <div className="list-card">
                {recentExpenses.length === 0 ? (
                  <p className="empty-state">No expenses yet. Add one to get started.</p>
                ) : (
                  recentExpenses.map((expense) => (
                    <div key={expense.id} className="expense-row">
                      <div>
                        <p className="expense-name">{expense.category}</p>
                        <p className="expense-meta">{new Date(expense.date).toLocaleDateString()} · {expense.paymentType}</p>
                      </div>
                      <div className="expense-actions">
                        <p className="expense-value">{formatRM(expense.amount)}</p>
                        <button type="button" className="mini-button" onClick={() => handleEdit(expense)}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        )}

        {page === 'add' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Expenses</p>
                <h2>{editId ? 'Edit expense' : 'Add expense'}</h2>
              </div>
              <span className="tag">RM</span>
            </div>

            <form className="card form-card" onSubmit={handleSaveExpense}>
              <label className="field-label">Date</label>
              <input
                type="date"
                className="text-input"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />

              <label className="field-label">Category</label>
              <select
                className="text-input"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <label className="field-label">Amount</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="text-input"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="0.00"
              />
              <div className="quick-buttons">
                {[5, 10, 20, 50, 100].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className="button button-tertiary"
                    onClick={() => handleQuickAmount(value)}
                  >
                    RM{value}
                  </button>
                ))}
              </div>

              <label className="field-label">Payment type</label>
              <select
                className="text-input"
                value={form.paymentType}
                onChange={(event) => setForm((prev) => ({ ...prev, paymentType: event.target.value }))}
              >
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <label className="field-label">Notes</label>
              <textarea
                rows={3}
                className="text-input"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional note"
              />

              <div className="form-actions">
                {editId && (
                  <button type="button" className="button button-ghost" onClick={() => {
                    setEditId(null)
                    setForm({
                      date: new Date().toISOString().slice(0, 10),
                      category: 'Food',
                      amount: '',
                      paymentType: 'Cash',
                      notes: '',
                    })
                  }}>
                    Clear
                  </button>
                )}
                <button type="submit" className="button button-primary">
                  {editId ? 'Save changes' : 'Save expense'}
                </button>
              </div>
            </form>

            <article className="card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">All expenses</p>
                  <h2>Manage entries</h2>
                </div>
              </div>
              {expenses.length === 0 ? (
                <p className="empty-state">No expense entries yet. Add one to build your report.</p>
              ) : (
                <div className="list-card">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="expense-row">
                      <div>
                        <p className="expense-name">{expense.category}</p>
                        <p className="expense-meta">{new Date(expense.date).toLocaleDateString()} · {expense.paymentType}</p>
                      </div>
                      <div className="expense-actions">
                        <p className="expense-value">{formatRM(expense.amount)}</p>
                        <button type="button" className="mini-button" onClick={() => handleEdit(expense)}>
                          Edit
                        </button>
                        <button type="button" className="mini-button delete" onClick={() => handleDelete(expense.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}

        {page === 'report' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Monthly Report</p>
                <h2>Review your spending</h2>
              </div>
              <button type="button" className="button button-primary" onClick={handleExportReport}>
                Export report
              </button>
            </div>

            <article className="card report-card">
              <div className="report-toolbar">
                <label className="field-label">Month</label>
                <select
                  className="text-input"
                  value={reportMonth}
                  onChange={(event) => setReportMonth(event.target.value)}
                >
                  {reportOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="summary-card">
                  <p className="stat-label">Total spent</p>
                  <p className="stat-value">{formatRM(reportTotals.total)}</p>
                </div>
                <div className="summary-card">
                  <p className="stat-label">Entries</p>
                  <p className="stat-value">{selectedReportExpenses.length}</p>
                </div>
              </div>

              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <h3>Category</h3>
                  {Object.entries(reportTotals.category).length === 0 ? (
                    <p className="empty-state">No spending yet.</p>
                  ) : (
                    <ul className="breakdown-list">
                      {Object.entries(reportTotals.category)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => (
                          <li key={category}>
                            <span>{category}</span>
                            <strong>{formatRM(amount)}</strong>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                <div className="breakdown-card">
                  <h3>Payment</h3>
                  {Object.entries(reportTotals.payment).length === 0 ? (
                    <p className="empty-state">No spending yet.</p>
                  ) : (
                    <ul className="breakdown-list">
                      {Object.entries(reportTotals.payment)
                        .sort(([, a], [, b]) => b - a)
                        .map(([method, amount]) => (
                          <li key={method}>
                            <span>{method}</span>
                            <strong>{formatRM(amount)}</strong>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Daily breakdown</h3>
                {reportTotals.daily.length === 0 ? (
                  <p className="empty-state">No daily data.</p>
                ) : (
                  <ul className="daily-list">
                    {reportTotals.daily.map(([date, amount]) => (
                      <li key={date}>
                        <span>{new Date(date).toLocaleDateString()}</span>
                        <strong>{formatRM(amount)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </section>
        )}

        {page === 'settings' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Settings</p>
                <h2>Personalize DuitLife</h2>
              </div>
            </div>

            <article className="card settings-card">
              <div className="setting-row">
                <div>
                  <p className="setting-label">Monthly budget</p>
                  <p className="setting-hint">Set the target amount for this month.</p>
                </div>
                <div className="setting-actions">
                  <input
                    type="number"
                    min="0"
                    className="text-input small"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                  />
                  <button type="button" className="button button-primary" onClick={handleBudgetSave}>
                    Save
                  </button>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <p className="setting-label">Theme</p>
                  <p className="setting-hint">Switch between light and dark mode.</p>
                </div>
                <div>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  >
                    {theme === 'light' ? 'Dark mode' : 'Light mode'}
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>Change PIN</h3>
                <div className="setting-row">
                  <label className="field-label">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="text-input"
                    value={pinChange.current}
                    onChange={(event) => setPinChange((prev) => ({ ...prev, current: event.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>
                <div className="setting-row">
                  <label className="field-label">New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="text-input"
                    value={pinChange.pin}
                    onChange={(event) => setPinChange((prev) => ({ ...prev, pin: event.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>
                <div className="setting-row">
                  <label className="field-label">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="text-input"
                    value={pinChange.confirm}
                    onChange={(event) => setPinChange((prev) => ({ ...prev, confirm: event.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>
                <button type="button" className="button button-primary" onClick={handleChangePin}>
                  Update PIN
                </button>
              </div>

              <div className="setting-group">
                <h3>Backup & restore</h3>
                <div className="setting-row">
                  <button type="button" className="button button-secondary" onClick={handleBackup}>
                    Download backup
                  </button>
                </div>
                <label className="field-label">Restore from JSON</label>
                <textarea
                  rows={5}
                  className="text-input"
                  value={restoreJson}
                  onChange={(event) => setRestoreJson(event.target.value)}
                  placeholder="Paste backup JSON here"
                />
                <button type="button" className="button button-primary" onClick={handleRestore}>
                  Restore backup
                </button>
              </div>

              <div className="setting-group">
                <h3>Reset</h3>
                <p className="setting-hint">Clear all expense data and restore default settings.</p>
                <button type="button" className="button button-destructive" onClick={handleReset}>
                  Reset DuitLife
                </button>
              </div>
            </article>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {navButtons.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-button ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
