import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  Briefcase,
  Calendar,
  Car,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Fuel,
  Heart,
  Home,
  House,
  Pencil,
  LockKeyhole,
  LogOut,
  MoreHorizontal,
  PieChart,
  Plus,
  Receipt,
  Repeat2,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Smartphone,
  Star,
  Trash,
  Tv,
  Unlock,
  Upload,
  Utensils,
  Wallet,
  X,
  Building2,
} from 'lucide-react'
import './App.css'

const DEFAULT_ACCOUNTS = [
  { id: 'hlb_ft',  name: 'Hong Leong',  owner: 'Fatihah', type: 'Bank',    balance: 0 },
  { id: 'pbb_ft',  name: 'Public Bank', owner: 'Fatihah', type: 'Bank',    balance: 0 },
  { id: 'aff_ft',  name: 'Affin',       owner: 'Fatihah', type: 'Bank',    balance: 0 },
  { id: 'tng_ft',  name: 'TnG',         owner: 'Fatihah', type: 'eWallet', balance: 0 },
  { id: 'tng_ad',  name: 'TnG',         owner: 'Adam',    type: 'eWallet', balance: 0 },
  { id: 'mbb_ml',  name: 'Maybank',     owner: 'Business',type: 'Bank',    balance: 0 },
  { id: 'cash',    name: 'Cash',        owner: 'Shared',  type: 'Cash',    balance: 0 },
]

const CATEGORIES = [
  'Food & Drink','Groceries','Fuel','Transport',
  'Bills & Utilities','Rent','Shopping','Family',
  'Kids','Health','Loan','Entertainment','Business','Other',
]

const CATEGORY_META = {
  'Food & Drink':     { Icon: Utensils, bg: '#FFF0E0', color: '#FF8C42' },
  'Groceries':        { Icon: ShoppingCart, bg: '#E3F5EC', color: '#6BBF8A' },
  'Fuel':             { Icon: Fuel, bg: '#E3EEF8', color: '#6BA8D4' },
  'Transport':        { Icon: Car, bg: '#E3EEF8', color: '#6BA8D4' },
  'Bills & Utilities':{ Icon: Receipt, bg: '#EDE8F5', color: '#9B7EC8' },
  'Rent':             { Icon: House, bg: '#EDE8F5', color: '#9B7EC8' },
  'Shopping':         { Icon: ShoppingBag, bg: '#FFF0E0', color: '#FF8C42' },
  'Family':           { Icon: Heart, bg: '#FDE8EE', color: '#E8607A' },
  'Kids':             { Icon: Star, bg: '#FDE8EE', color: '#E8607A' },
  'Health':           { Icon: Activity, bg:'#E3F5EC', color: '#6BBF8A' },
  'Loan':             { Icon: CreditCard, bg: '#EDE8F5', color: '#9B7EC8' },
  'Entertainment':    { Icon: Tv, bg: '#E3F5F3', color: '#5BBFB5' },
  'Business':         { Icon: Briefcase, bg: '#E3EEF8', color: '#6BA8D4' },
  'Other':            { Icon: MoreHorizontal, bg: '#F0EDE8', color: '#B0A090' },
}

const PERSONS = ['Adam', 'Fatihah']

const DEFAULT_SETTINGS = { pin: '1234', monthlyBudget: 2500 }

const DEFAULT_COMMITMENTS = [
  { id: 'car_payment', name: 'Car Payment', amount: 0, dueDay: 1, category: 'Loan', accountId: 'cash', reminder: true, active: true },
  { id: 'house_loan', name: 'House Loan', amount: 0, dueDay: 1, category: 'Loan', accountId: 'cash', reminder: true, active: true },
  { id: 'netflix', name: 'Netflix', amount: 0, dueDay: 15, category: 'Entertainment', accountId: 'cash', reminder: true, active: true },
  { id: 'telecom', name: 'Telecom', amount: 0, dueDay: 10, category: 'Bills & Utilities', accountId: 'cash', reminder: true, active: true },
  { id: 'insurance', name: 'Insurance', amount: 0, dueDay: 20, category: 'Bills & Utilities', accountId: 'cash', reminder: true, active: true },
  { id: 'internet', name: 'Internet', amount: 0, dueDay: 7, category: 'Bills & Utilities', accountId: 'cash', reminder: true, active: true },
]

const STORAGE = {
  expenses: 'duitlife_expenses',
  accounts: 'duitlife_accounts',
  settings: 'duitlife_settings',
  commitments: 'duitlife_commitments',
  commitmentPaidPrefix: 'duitlife_commitmentPaid_',
}

const safeParse = (value, fallback) => {
  if (value === null || value === undefined) return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

const formatRM = (v) => `RM${Number(v || 0).toFixed(2)}`
const formatRMShort = (v) => {
  const n = Number(v || 0)
  return n >= 1000 ? `RM${(n/1000).toFixed(1)}k` : `RM${n.toFixed(2)}`
}

const getMonthKey = (v) => {
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const getMonthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const buildMonthOptions = () => {
  const opts = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ key, label: getMonthLabel(key) })
  }
  return opts
}

const daysLeftInMonth = () => {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.getDate() - now.getDate()
}

const getDateKey = (date) => date.toISOString().slice(0, 10)

const getLastDateKeys = (count, fromDate = new Date()) => {
  const keys = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(fromDate)
    date.setDate(fromDate.getDate() - i)
    keys.push(getDateKey(date))
  }
  return keys
}

const sumByDate = (items) => {
  const totals = {}
  items.forEach((expense) => {
    totals[expense.date] = (totals[expense.date] || 0) + Number(expense.amount || 0)
  })
  return totals
}

const CatBadge = ({ category }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META['Other']
  const Icon = meta.Icon
  return (
    <div className="cat-badge" style={{ background: meta.bg }}>
      <Icon size={17} color={meta.color} aria-hidden="true" />
    </div>
  )
}

const AccountBadge = ({ type }) => {
  const cls = type === 'eWallet' ? 'ewallet' : type === 'Cash' ? 'cash' : 'bank'
  const Icon = type === 'eWallet' ? Smartphone : type === 'Cash' ? Banknote : Building2
  return (
    <div className={`account-badge ${cls}`}>
      <Icon size={20} aria-hidden="true" />
    </div>
  )
}

// SVG sparklines
const SparkLine = ({ color, type, values = [], progress = 0 }) => {
  const safeValues = values.length ? values.map((value) => Number(value) || 0) : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...safeValues, 0)

  if (type === 'bar') return (
    <svg className="sparkline" viewBox="0 0 120 24" aria-hidden="true">
      {safeValues.map((value, i) => {
        const x = safeValues.length === 1 ? 56 : 6 + (i * (108 / Math.max(safeValues.length - 1, 1)))
        const h = max > 0 ? Math.max(3, (value / max) * 18) : 3
        return <rect key={x} x={x} y={24-h} width="8" height={h} rx="2" fill={color} opacity={i===5?0.9:0.6}/>
      })}
    </svg>
  )
  if (type === 'progress') return (
    <div style={{marginTop:8,height:6,background:'rgba(155,126,200,0.15)',borderRadius:999,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${Math.min(Math.max(progress, 0), 1) * 100}%`,background:'#9B7EC8',borderRadius:999}}/>
    </div>
  )
  const pts = max > 0
    ? safeValues.map((value, i) => {
      const x = safeValues.length === 1 ? 60 : (i * (120 / Math.max(safeValues.length - 1, 1)))
      const y = 21 - ((value / max) * 16)
      return `${x},${y}`
    }).join(' ')
    : '0,18 20,18 40,18 60,18 80,18 100,18 120,18'
  return (
    <svg className="sparkline" viewBox="0 0 120 24" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  )
}

// Budget ring
const BudgetRing = ({ pct }) => {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(pct, 100)) / 100
  return (
    <div className="budget-ring-wrap">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="ring-bg" cx="32" cy="32" r={r}/>
        <circle
          className="ring-fill" cx="32" cy="32" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-pct">{Math.round(pct)}%</div>
    </div>
  )
}

const NAV_ITEMS_LEFT  = [
  { key: 'dashboard', label: 'Home',    Icon: Home },
  { key: 'reports',   label: 'Reports', Icon: PieChart },
]
const NAV_ITEMS_RIGHT = [
  { key: 'accounts',  label: 'Accounts',Icon: Wallet },
  { key: 'settings',  label: 'Settings',Icon: Settings },
]

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput]   = useState('')
  const [page, setPage]           = useState('dashboard')
  const [expenses, setExpenses]   = useState([])
  const [accounts, setAccounts]   = useState(DEFAULT_ACCOUNTS)
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [commitments, setCommitments] = useState(DEFAULT_COMMITMENTS)
  const [paidCommitments, setPaidCommitments] = useState({})
  const [showCommitments, setShowCommitments] = useState(false)
  const [commitmentEditId, setCommitmentEditId] = useState(null)
  const [editId, setEditId]       = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    person: 'Adam', accountId: 'cash',
    category: 'Food & Drink', amount: '', notes: '',
  })
  const [budgetInput, setBudgetInput]   = useState(String(DEFAULT_SETTINGS.monthlyBudget))
  const [pinInputs, setPinInputs]       = useState({ current: '', next: '', confirm: '' })
  const [restoreText, setRestoreText]   = useState('')
  const [reportMonth, setReportMonth]   = useState(getMonthKey(new Date()))
  const [reportPerson, setReportPerson] = useState('All')
  const [reportAccount, setReportAccount] = useState('All')
  const [balanceEdits, setBalanceEdits] = useState({})
  const [commitmentForm, setCommitmentForm] = useState({
    name: '',
    amount: '',
    dueDay: '1',
    category: 'Bills & Utilities',
    accountId: 'cash',
    reminder: true,
  })

  useEffect(() => {
    const ex = safeParse(localStorage.getItem(STORAGE.expenses), [])
    const ac = safeParse(localStorage.getItem(STORAGE.accounts), DEFAULT_ACCOUNTS)
    const se = safeParse(localStorage.getItem(STORAGE.settings), DEFAULT_SETTINGS)
    const cm = safeParse(localStorage.getItem(STORAGE.commitments), DEFAULT_COMMITMENTS)
    setExpenses(Array.isArray(ex) ? ex : [])
    setAccounts(Array.isArray(ac) && ac.length ? ac : DEFAULT_ACCOUNTS)
    setCommitments(Array.isArray(cm) && cm.length ? cm : DEFAULT_COMMITMENTS)
    setSettings({ ...DEFAULT_SETTINGS, ...se })
    setBudgetInput(String(se.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget))
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE.expenses, JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem(STORAGE.accounts, JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem(STORAGE.settings, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(STORAGE.commitments, JSON.stringify(commitments)) }, [commitments])

  const today          = new Date()
  const todayKey       = today.toISOString().slice(0, 10)
  const currentMonthKey = getMonthKey(today)

  useEffect(() => {
    setPaidCommitments(safeParse(localStorage.getItem(`${STORAGE.commitmentPaidPrefix}${currentMonthKey}`), {}))
  }, [currentMonthKey])

  useEffect(() => {
    localStorage.setItem(`${STORAGE.commitmentPaidPrefix}${currentMonthKey}`, JSON.stringify(paidCommitments))
  }, [currentMonthKey, paidCommitments])

  const currentMonthExpenses = useMemo(
    () => expenses.filter(e => getMonthKey(e.date) === currentMonthKey),
    [expenses, currentMonthKey]
  )
  const todayTotal = useMemo(
    () => currentMonthExpenses.filter(e => e.date === todayKey).reduce((s, e) => s + Number(e.amount), 0),
    [currentMonthExpenses, todayKey]
  )
  const monthTotal = useMemo(
    () => currentMonthExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [currentMonthExpenses]
  )
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance), 0), [accounts])
  const activeCommitments = useMemo(
    () => commitments.filter(c => c.active !== false),
    [commitments]
  )
  const commitmentsTotal = useMemo(
    () => activeCommitments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [activeCommitments]
  )
  const effectiveMonthlyBudget = commitmentsTotal
  const remainingBudget = Math.max(effectiveMonthlyBudget - monthTotal, 0)
  const budgetUsage = effectiveMonthlyBudget > 0 ? Math.min(100, (monthTotal / effectiveMonthlyBudget) * 100) : 0
  const commitmentProgress = commitmentsTotal > 0 ? Math.min(100, (monthTotal / commitmentsTotal) * 100) : 0
  const unpaidCommitments = activeCommitments.filter(item => !paidCommitments[item.id])
  const todayDay = today.getDate()
  const hasOverdueCommitment = unpaidCommitments.some(item => todayDay > Number(item.dueDay || 1))
  const hasDueSoonCommitment = unpaidCommitments.some(item => {
    const dueDay = Number(item.dueDay || 1)
    return dueDay >= todayDay && dueDay - todayDay <= 3
  })
  const commitmentSummaryStatus = activeCommitments.length > 0 && unpaidCommitments.length === 0
    ? 'All clear'
    : hasOverdueCommitment
      ? 'Overdue'
      : hasDueSoonCommitment
        ? 'Due soon'
        : 'Safe zone'
  const isCommitmentRisk = commitmentSummaryStatus === 'Overdue' || commitmentSummaryStatus === 'Due soon'
  const dailyTotals = useMemo(() => sumByDate(expenses), [expenses])
  const todaySparkline = useMemo(() => {
    const values = currentMonthExpenses
      .filter(e => e.date === todayKey)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .map(e => Number(e.amount || 0))
    return values.length ? values : [0, 0, 0, 0, 0, 0, 0]
  }, [currentMonthExpenses, todayKey])
  const monthBarValues = useMemo(() => {
    const activeDays = Object.entries(sumByDate(currentMonthExpenses))
      .filter(([, total]) => total > 0)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-10)
      .map(([, total]) => total)
    return activeDays.length ? activeDays : [0, 0, 0, 0, 0, 0, 0]
  }, [currentMonthExpenses])
  const recentDayKeys = useMemo(() => getLastDateKeys(7, today), [todayKey])
  const transactionSparkline = useMemo(
    () => recentDayKeys.map((key) => expenses.filter(e => e.date === key).length || dailyTotals[key] || 0),
    [dailyTotals, expenses, recentDayKeys]
  )
  const dashboardAccounts = useMemo(() => {
    const featured = accounts.filter(a => a.id === 'hlb_ft' || a.id === 'mbb_ml')
    return featured.length ? featured : accounts.slice(0, 2)
  }, [accounts])

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    [expenses]
  )
  const reportOptions = useMemo(buildMonthOptions, [])

  const reportExpenses = useMemo(() =>
    expenses.filter(e => {
      const mok = getMonthKey(e.date) === reportMonth
      const pok = reportPerson  === 'All' || e.person    === reportPerson
      const aok = reportAccount === 'All' || e.accountId === reportAccount
      return mok && pok && aok
    }),
    [expenses, reportMonth, reportPerson, reportAccount]
  )
  const reportTotal       = useMemo(() => reportExpenses.reduce((s, e) => s + Number(e.amount), 0), [reportExpenses])
  const reportByCategory  = useMemo(() => {
    const t = {}
    reportExpenses.forEach(e => { t[e.category] = (t[e.category] || 0) + Number(e.amount) })
    return Object.entries(t).sort((a, b) => b[1] - a[1])
  }, [reportExpenses])
  const reportByPerson    = useMemo(() => {
    const t = {}
    reportExpenses.forEach(e => { t[e.person] = (t[e.person] || 0) + Number(e.amount) })
    return Object.entries(t).sort((a, b) => b[1] - a[1])
  }, [reportExpenses])
  const reportByAccount   = useMemo(() => {
    const t = {}
    reportExpenses.forEach(e => {
      const acc = accounts.find(a => a.id === e.accountId)
      const lbl = acc ? `${acc.name} (${acc.owner})` : e.accountId
      t[lbl] = (t[lbl] || 0) + Number(e.amount)
    })
    return Object.entries(t).sort((a, b) => b[1] - a[1])
  }, [reportExpenses, accounts])

  const getAccountLabel = (id) => {
    const acc = accounts.find(a => a.id === id)
    return acc ? `${acc.name} (${acc.owner})` : id
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (pinInput === settings.pin) { setAuthenticated(true); setPinInput(''); setPage('dashboard') }
    else { alert('Incorrect PIN.'); setPinInput('') }
  }

  const resetForm = () => {
    setEditId(null)
    setForm({ date: new Date().toISOString().slice(0, 10), person: 'Adam', accountId: 'cash', category: 'Food & Drink', amount: '', notes: '' })
  }

  const handleSaveExpense = (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.date || !form.accountId || !form.category || isNaN(amount) || amount <= 0) { alert('Please fill all fields with a valid amount.'); return }
    const record = { id: editId || `${Date.now()}`, date: form.date, person: form.person, accountId: form.accountId, category: form.category, amount, notes: form.notes.trim() }
    if (editId) {
      const old = expenses.find(ex => ex.id === editId)
      if (old) setAccounts(prev => prev.map(a => a.id === old.accountId ? { ...a, balance: a.balance + Number(old.amount) } : a))
      setExpenses(prev => prev.map(ex => ex.id === editId ? record : ex))
    } else { setExpenses(prev => [record, ...prev]) }
    setAccounts(prev => prev.map(a => a.id === form.accountId ? { ...a, balance: Math.max(0, a.balance - amount) } : a))
    resetForm(); setPage('dashboard')
  }

  const handleQuickAmount = (v) => setForm(f => ({ ...f, amount: String(Number(f.amount || 0) + v) }))

  const handleEditExpense = (expense) => {
    setEditId(expense.id)
    setForm({ date: expense.date, person: expense.person, accountId: expense.accountId, category: expense.category, amount: String(expense.amount), notes: expense.notes || '' })
    setPage('add')
  }

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Delete this expense?')) return
    const ex = expenses.find(e => e.id === id)
    if (ex) setAccounts(prev => prev.map(a => a.id === ex.accountId ? { ...a, balance: a.balance + Number(ex.amount) } : a))
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const handleSaveBalance = (id) => {
    const val = Number(balanceEdits[id])
    if (isNaN(val) || val < 0) { alert('Enter a valid balance.'); return }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: val } : a))
    setBalanceEdits(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const handleSaveBudget = () => {
    const b = Number(budgetInput)
    if (isNaN(b) || b < 0) { alert('Enter a valid budget.'); return }
    setSettings(s => ({ ...s, monthlyBudget: b, manualBudgetOverride: true })); alert('Budget updated.')
  }

  const handleChangePin = () => {
    if (pinInputs.current !== settings.pin) { alert('Current PIN is incorrect.'); return }
    if (pinInputs.next.length !== 4 || pinInputs.next !== pinInputs.confirm) { alert('New PIN must be 4 digits and match.'); return }
    setSettings(s => ({ ...s, pin: pinInputs.next }))
    setPinInputs({ current: '', next: '', confirm: '' }); alert('PIN updated.')
  }

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ settings, expenses, accounts, commitments }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob); link.download = 'duitlife-backup.json'; link.click(); URL.revokeObjectURL(link.href)
  }

  const handleRestoreBackup = () => {
    try {
      const parsed = JSON.parse(restoreText)
      if (!parsed || typeof parsed !== 'object') throw new Error()
      setExpenses(Array.isArray(parsed.expenses) ? parsed.expenses : [])
      setAccounts(Array.isArray(parsed.accounts) ? parsed.accounts : DEFAULT_ACCOUNTS)
      setCommitments(Array.isArray(parsed.commitments) ? parsed.commitments : DEFAULT_COMMITMENTS)
      setSettings({ ...DEFAULT_SETTINGS, ...(parsed.settings || {}) })
      setBudgetInput(String(parsed.settings?.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget))
      setRestoreText(''); alert('Backup restored.')
    } catch { alert('Invalid backup file.') }
  }

  const handleResetAll = () => {
    if (!window.confirm('Reset all data?')) return
    setExpenses([]); setAccounts(DEFAULT_ACCOUNTS); setCommitments(DEFAULT_COMMITMENTS); setPaidCommitments({}); setSettings(DEFAULT_SETTINGS)
    setBudgetInput(String(DEFAULT_SETTINGS.monthlyBudget)); setPage('dashboard'); alert('App reset.')
  }

  const resetCommitmentForm = () => {
    setCommitmentEditId(null)
    setCommitmentForm({
      name: '',
      amount: '',
      dueDay: '1',
      category: 'Bills & Utilities',
      accountId: accounts[0]?.id || 'cash',
      reminder: true,
    })
  }

  const getCommitmentStatus = (commitment) => {
    if (paidCommitments[commitment.id]) return 'Paid'
    const dueDay = Number(commitment.dueDay || 1)
    const todayDay = today.getDate()
    if (todayDay > dueDay) return 'Overdue'
    if (dueDay - todayDay <= 3) return 'Due soon'
    return 'Unpaid'
  }

  const handleEditCommitment = (commitment) => {
    setCommitmentEditId(commitment.id)
    setCommitmentForm({
      name: commitment.name,
      amount: String(commitment.amount || ''),
      dueDay: String(commitment.dueDay || 1),
      category: commitment.category || 'Bills & Utilities',
      accountId: commitment.accountId || accounts[0]?.id || 'cash',
      reminder: commitment.reminder !== false,
    })
  }

  const handleSaveCommitment = (event) => {
    event.preventDefault()
    const amount = Number(commitmentForm.amount || 0)
    const dueDay = Number(commitmentForm.dueDay)
    if (!commitmentForm.name.trim() || Number.isNaN(amount) || amount < 0 || Number.isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      alert('Enter a valid name, amount, and due day.')
      return
    }
    const record = {
      id: commitmentEditId || `commitment_${Date.now()}`,
      name: commitmentForm.name.trim(),
      amount,
      dueDay,
      category: commitmentForm.category,
      accountId: commitmentForm.accountId,
      reminder: commitmentForm.reminder,
      active: true,
    }
    setCommitments(current => (
      commitmentEditId
        ? current.map(item => item.id === commitmentEditId ? record : item)
        : [record, ...current]
    ))
    resetCommitmentForm()
  }

  const handleDeleteCommitment = (id) => {
    if (!window.confirm('Delete this commitment?')) return
    setCommitments(current => current.filter(item => item.id !== id))
    setPaidCommitments(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const handleMarkCommitmentPaid = (commitment) => {
    if (paidCommitments[commitment.id]) return
    const amount = Number(commitment.amount || 0)
    if (amount <= 0) {
      alert('Set an amount before marking this paid.')
      return
    }
    const record = {
      id: `${Date.now()}`,
      date: todayKey,
      person: 'Adam',
      accountId: commitment.accountId || 'cash',
      category: commitment.category || 'Bills & Utilities',
      amount,
      notes: commitment.name,
    }
    setExpenses(current => [record, ...current])
    setAccounts(current => current.map(account =>
      account.id === record.accountId ? { ...account, balance: Math.max(0, account.balance - amount) } : account
    ))
    setPaidCommitments(current => ({ ...current, [commitment.id]: true }))
  }

  if (!authenticated) {
    return (
      <div className="app-shell auth-shell">
        <div className="auth-card">
          <div className="brand-mark">
            <Wallet size={32} aria-hidden="true"/>
          </div>
          <h1>DuitLife</h1>
          <p className="auth-note">Track your family expenses across all accounts.</p>
          <form onSubmit={handleLogin} className="auth-form">
            <label className="field-label" htmlFor="pin-input">Enter 4-digit PIN</label>
            <input id="pin-input" type="password" inputMode="numeric" maxLength={4}
              value={pinInput} onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-input" placeholder="••••" />
            <button type="submit" className="button button-primary auth-button">
              <Unlock size={16} aria-hidden="true"/> Unlock
            </button>
          </form>
          <p className="hint">Default PIN is 1234</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">

      {/* ── FAMILY HEADER ── */}
      <header className="top-bar">
        <div className="family-header">
          <img src="/kids.png" alt="Tasneem and Aylan" className="family-img" />
          <div className="family-overlay" />
          <div className="family-content">
            <p className="family-greeting">Assalamualaikum 👋</p>
            <h1 className="family-title">Adam &<br/>Fatihah</h1>
            <p className="family-sub">Family Expense Tracker</p>
            <div className="family-spent-badge">
              <div className="badge-icon">
                <BarChart3 size={22} aria-hidden="true"/>
              </div>
              <div>
                <p className="badge-amount">{formatRM(monthTotal)} spent</p>
                <p className="badge-label">This month</p>
              </div>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="button button-secondary logout-button" onClick={() => setAuthenticated(false)}>
            <LogOut size={18} aria-hidden="true"/> Logout
          </button>
        </div>
      </header>

      {/* ── QUICK ACTIONS ── */}
      <div className="quick-actions">
        <button className="qa-btn" onClick={() => setPage('add')}>
          <div className="qa-icon qa-orange"><Plus size={19} aria-hidden="true"/></div>
          <span className="qa-label">Expense</span>
        </button>
        <button className="qa-btn" onClick={() => setPage('accounts')}>
          <div className="qa-icon qa-blue"><Repeat2 size={19} aria-hidden="true"/></div>
          <span className="qa-label">Transfer</span>
        </button>
        <button className="qa-btn" onClick={() => setPage('settings')}>
          <div className="qa-icon qa-purple"><Wallet size={19} aria-hidden="true"/></div>
          <span className="qa-label">Budget</span>
        </button>
        <button className="qa-btn" onClick={handleExportBackup}>
          <div className="qa-icon qa-green"><Download size={19} aria-hidden="true"/></div>
          <span className="qa-label">Export</span>
        </button>
      </div>

      <main className="main-screen">

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <section className="section-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h2>Monthly summary</h2>
              </div>
              <div className="pill">Budget {formatRM(effectiveMonthlyBudget)}</div>
            </div>

            {/* Stats 2x2 with sparklines */}
            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><Calendar size={20} aria-hidden="true"/></div>
                  <span className="stat-label">TODAY</span>
                </div>
                <p className="stat-value">{formatRM(todayTotal)}</p>
                <p className="stat-note">Spent today</p>
                <SparkLine color="#FFB347" type="wave1" values={todaySparkline}/>
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><BarChart3 size={20} aria-hidden="true"/></div>
                  <span className="stat-label">THIS MONTH</span>
                </div>
                <p className="stat-value">{formatRM(monthTotal)}</p>
                <p className="stat-note">{getMonthLabel(currentMonthKey)}</p>
                <SparkLine color="#6BBF8A" type="bar" values={monthBarValues}/>
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><Wallet size={20} aria-hidden="true"/></div>
                  <span className="stat-label">REMAINING</span>
                </div>
                <p className="stat-value">{formatRM(remainingBudget)}</p>
                <p className="stat-note">Left in budget</p>
                <SparkLine
                  color="#9B7EC8"
                  type="progress"
                  progress={effectiveMonthlyBudget > 0 ? monthTotal / effectiveMonthlyBudget : 0}
                />
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><FileText size={20} aria-hidden="true"/></div>
                  <span className="stat-label">TRANSACTIONS</span>
                </div>
                <p className="stat-value">{currentMonthExpenses.length}</p>
                <p className="stat-note">This month</p>
                <SparkLine color="#6BA8D4" type="wave2" values={transactionSparkline}/>
              </article>
            </div>

            {/* Budget ring card */}
            <article
              className="card progress-card"
              role="button"
              tabIndex={0}
              onClick={() => setShowCommitments(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setShowCommitments(true)
              }}
              aria-label="Open monthly commitments"
            >
              <div className="progress-head">
                <div>
                  <p className="eyebrow">Monthly Commitments</p>
                  <h3>{getMonthLabel(currentMonthKey)}</h3>
                </div>
                <BudgetRing pct={commitmentProgress}/>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${commitmentProgress}%`,
                  background: commitmentProgress >= 90 ? 'linear-gradient(90deg,#E86B5A,#FF8C42)' : undefined
                }}/>
              </div>
              <div className="progress-bottom">
                <div className="safe-zone">
                  <div className={`safe-icon${isCommitmentRisk ? ' warning' : ''}`}>
                    {isCommitmentRisk ? <AlertTriangle size={22} aria-hidden="true"/> : <ShieldCheck size={22} aria-hidden="true"/>}
                  </div>
                  <div>
                    <p className="safe-label">{commitmentSummaryStatus}</p>
                    <p className="safe-sub">{daysLeftInMonth()} days left this month</p>
                  </div>
                </div>
                <div className="progress-right">
                  <p className="progress-spent">{formatRM(monthTotal)} spent</p>
                  <p className="progress-target">{formatRM(commitmentsTotal)} commitments</p>
                </div>
              </div>
            </article>

            {/* Accounts */}
            <div className="section-head">
              <div>
                <p className="eyebrow">Accounts</p>
                <h2>Balances</h2>
              </div>
              <button className="manage-link" onClick={() => setPage('accounts')}>Manage</button>
            </div>

            <div className="account-list">
              {dashboardAccounts.map(acc => (
                <div key={acc.id} className="account-row" onClick={() => setPage('accounts')} style={{cursor:'pointer'}}>
                  <div className="account-left">
                    <AccountBadge type={acc.type}/>
                    <div>
                      <p className="account-name">{acc.name}</p>
                      <p className="account-owner">{acc.owner} · {acc.type}</p>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <div className="account-right">
                      <p className={`account-balance${acc.balance === 0 ? ' zero' : ''}`}>{formatRM(acc.balance)}</p>
                      <p className="account-updated">Updated just now</p>
                    </div>
                    <ChevronRight className="account-chevron" size={18} aria-hidden="true"/>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent expenses */}
            <article className="card">
              <div className="section-head" style={{marginBottom:12}}>
                <div>
                  <p className="eyebrow">Recent</p>
                  <h2>Last expenses</h2>
                </div>
                <button type="button" className="button button-primary" style={{fontSize:11,padding:'7px 14px'}} onClick={() => setPage('add')}>
                  <Plus size={15} aria-hidden="true"/> Add
                </button>
              </div>
              <div className="expense-list">
                {recentExpenses.length === 0 ? (
                  <p className="empty-state">
                    <Smile className="empty-icon" size={32} aria-hidden="true"/>
                    No expenses yet. Tap Add to start!
                  </p>
                ) : recentExpenses.map(ex => (
                  <div key={ex.id} className="expense-item">
                    <div className="expense-left">
                      <CatBadge category={ex.category}/>
                      <div>
                        <p className="expense-title">{ex.category}</p>
                        <p className="expense-meta">
                          <span className="person-tag" data-person={ex.person}>{ex.person[0]}</span>
                          {new Date(ex.date).toLocaleDateString()} · {getAccountLabel(ex.accountId)}
                        </p>
                      </div>
                    </div>
                    <div className="expense-right">
                      <p className="expense-amount">-{formatRM(ex.amount)}</p>
                      <button className="mini-button" onClick={() => handleEditExpense(ex)}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {/* ── ADD EXPENSE ── */}
        {page === 'add' && (
          <section className="section-card">
            <div className="section-head">
              <div><p className="eyebrow">Expense</p><h2>{editId ? 'Edit expense' : 'New expense'}</h2></div>
              <span className="tag">RM</span>
            </div>
            <form className="card form-card" onSubmit={handleSaveExpense}>
              <label className="field-label">Date</label>
              <input type="date" className="text-input" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/>

              <label className="field-label">Who is spending?</label>
              <div className="person-selector">
                {PERSONS.map(p => (
                  <button key={p} type="button"
                    className={`person-btn${form.person === p ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>
                    <span className="person-tag" data-person={p} style={{marginRight:6}}>{p[0]}</span>{p}
                  </button>
                ))}
              </div>

              <label className="field-label">Account</label>
              <select className="text-input" value={form.accountId}
                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.owner}) — {formatRM(a.balance)}</option>)}
              </select>

              <label className="field-label">Category</label>
              <select className="text-input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="field-label">Amount (RM)</label>
              <input type="number" inputMode="decimal" min="0" step="0.01"
                className="text-input" value={form.amount} placeholder="0.00"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}/>
              <div className="quick-actions-form">
                {[5,10,20,50,100,200].map(v => (
                  <button key={v} type="button" className="button button-tertiary"
                    onClick={() => handleQuickAmount(v)}>+{v}</button>
                ))}
              </div>

              <label className="field-label">Notes (optional)</label>
              <textarea rows={2} className="text-input" value={form.notes}
                placeholder="e.g. lunch at mamak"
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>

              <div className="form-actions">
                <button type="button" className="button button-secondary" onClick={resetForm}>
                  <X size={16} aria-hidden="true"/> Clear
                </button>
                <button type="submit" className="button button-primary">
                  {editId ? <Check size={16} aria-hidden="true"/> : <Plus size={16} aria-hidden="true"/>}
                  {editId ? 'Save changes' : 'Save expense'}
                </button>
              </div>
            </form>

            <article className="card">
              <div className="section-head" style={{marginBottom:12}}>
                <div><p className="eyebrow">All expenses</p><h2>Manage records</h2></div>
              </div>
              <div className="expense-list">
                {expenses.length === 0 ? <p className="empty-state">No expenses yet.</p>
                : [...expenses].sort((a,b) => new Date(b.date)-new Date(a.date)).map(ex => (
                  <div key={ex.id} className="expense-item">
                    <div className="expense-left">
                      <CatBadge category={ex.category}/>
                      <div>
                        <p className="expense-title">{ex.category}</p>
                        <p className="expense-meta">
                          <span className="person-tag" data-person={ex.person}>{ex.person[0]}</span>
                          {new Date(ex.date).toLocaleDateString()} · {getAccountLabel(ex.accountId)}
                        </p>
                      </div>
                    </div>
                    <div className="expense-right">
                      <p className="expense-amount">-{formatRM(ex.amount)}</p>
                      <button className="mini-button" onClick={() => handleEditExpense(ex)}>Edit</button>
                      <button className="mini-button mini-delete" onClick={() => handleDeleteExpense(ex.id)}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {/* ── REPORTS ── */}
        {page === 'reports' && (
          <section className="section-card">
            <div className="section-head">
              <div><p className="eyebrow">Reports</p><h2>Monthly review</h2></div>
            </div>
            <div className="card form-card">
              <label className="field-label">Month</label>
              <select className="text-input" value={reportMonth} onChange={e => setReportMonth(e.target.value)}>
                {reportOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <label className="field-label">Person</label>
              <select className="text-input" value={reportPerson} onChange={e => setReportPerson(e.target.value)}>
                <option value="All">All</option>
                {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <label className="field-label">Account</label>
              <select className="text-input" value={reportAccount} onChange={e => setReportAccount(e.target.value)}>
                <option value="All">All accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.owner})</option>)}
              </select>
            </div>
            <div className="report-summary">
              <div className="summary-card"><p className="stat-label">Total spent</p><p className="stat-value">{formatRM(reportTotal)}</p></div>
              <div className="summary-card"><p className="stat-label">Transactions</p><p className="stat-value">{reportExpenses.length}</p></div>
            </div>
            {reportByPerson.length > 0 && (
              <div className="card">
                <p className="breakdown-title">By person</p>
                <ul className="breakdown-list">
                  {reportByPerson.map(([name, amt]) => (
                    <li key={name}>
                      <span style={{display:'flex',alignItems:'center',gap:8}}>
                        <span className="person-tag sm" data-person={name}>{name[0]}</span>{name}
                      </span>
                      <span>{formatRM(amt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reportByCategory.length > 0 && (
              <div className="card">
                <p className="breakdown-title">By category</p>
                <ul className="breakdown-list">
                  {reportByCategory.map(([cat, amt]) => (
                    <li key={cat}>
                      <span style={{display:'flex',alignItems:'center',gap:8}}><CatBadge category={cat}/>{cat}</span>
                      <span>{formatRM(amt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reportByAccount.length > 0 && (
              <div className="card">
                <p className="breakdown-title">By account</p>
                <ul className="breakdown-list">
                  {reportByAccount.map(([acc, amt]) => (
                    <li key={acc}><span>{acc}</span><span>{formatRM(amt)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {reportExpenses.length === 0 && <p className="empty-state">No expenses for this filter.</p>}
          </section>
        )}

        {/* ── ACCOUNTS ── */}
        {page === 'accounts' && (
          <section className="section-card">
            <div className="section-head">
              <div><p className="eyebrow">Accounts</p><h2>Manage balances</h2></div>
            </div>
            <div className="account-total-strip">
              <div>
                <p className="account-total-label">Total across all accounts</p>
                <p className="account-total-value">{formatRM(totalBalance)}</p>
              </div>
              <Building2 size={28} color="rgba(255,255,255,0.4)" aria-hidden="true"/>
            </div>
            <p style={{fontSize:12,color:'var(--text-muted)'}}>
              Set current balance. Updates automatically when you add or delete expenses.
            </p>
            {accounts.map(acc => (
              <div key={acc.id} className="card account-edit-card">
                <div className="account-edit-top">
                  <AccountBadge type={acc.type}/>
                  <div style={{flex:1}}>
                    <p className="account-name">{acc.name}</p>
                    <p className="account-owner">{acc.owner} · {acc.type}</p>
                  </div>
                  <p className={`account-balance${acc.balance===0?' zero':''}`}>{formatRM(acc.balance)}</p>
                </div>
                <div className="account-edit-row">
                  <input type="number" min="0" step="0.01" className="text-input small"
                    placeholder="Set new balance"
                    value={balanceEdits[acc.id] ?? ''}
                    onChange={e => setBalanceEdits(prev => ({ ...prev, [acc.id]: e.target.value }))}/>
                  <button className="button button-primary" style={{fontSize:12,padding:'9px 16px'}}
                    onClick={() => handleSaveBalance(acc.id)}>
                    <Check size={16} aria-hidden="true"/> Update
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── SETTINGS ── */}
        {page === 'settings' && (
          <section className="section-card">
            <div className="section-head">
              <div><p className="eyebrow">Settings</p><h2>Personalize</h2></div>
            </div>
            <article className="card settings-card">
              <div className="setting-row">
                <div>
                  <p className="setting-label">Monthly budget</p>
                  <p className="setting-description">Total spending limit for the whole family.</p>
                </div>
                <div className="setting-actions">
                  <input type="number" min="0" className="text-input small" value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}/>
                  <button className="button button-primary" onClick={handleSaveBudget}>Save</button>
                </div>
              </div>
              <div className="setting-group">
                <h3>Change PIN</h3>
                {[['cur','Current PIN','current'],['nxt','New PIN','next'],['con','Confirm PIN','confirm']].map(([id,lbl,key]) => (
                  <div key={id} className="setting-row single-row">
                    <label className="field-label" htmlFor={id}>{lbl}</label>
                    <input id={id} type="password" inputMode="numeric" maxLength={4}
                      className="text-input small" value={pinInputs[key]}
                      onChange={e => setPinInputs(p => ({ ...p, [key]: e.target.value.replace(/\D/g,'') }))}/>
                  </div>
                ))}
                <button className="button button-primary" onClick={handleChangePin}>
                  <LockKeyhole size={16} aria-hidden="true"/> Update PIN
                </button>
              </div>
              <div className="setting-group">
                <h3>Backup & restore</h3>
                <button className="button button-secondary" onClick={handleExportBackup}>
                  <Download size={16} aria-hidden="true"/> Export backup JSON
                </button>
                <label className="field-label" htmlFor="restore-json">Restore backup</label>
                <textarea id="restore-json" rows={4} className="text-input" value={restoreText}
                  onChange={e => setRestoreText(e.target.value)} placeholder="Paste JSON backup here"/>
                <button className="button button-primary" onClick={handleRestoreBackup}>
                  <Upload size={16} aria-hidden="true"/> Restore JSON
                </button>
              </div>
              <div className="setting-group">
                <h3>Reset app</h3>
                <p className="setting-description">Clears all expenses, resets balances and settings.</p>
                <button className="button button-destructive" onClick={handleResetAll}>
                  <Trash size={16} aria-hidden="true"/> Reset all data
                </button>
              </div>
            </article>
          </section>
        )}
      </main>

      {showCommitments && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="commitments-title">
          <section className="commitments-modal">
            <div className="commitments-head">
              <div>
                <p className="eyebrow">Commitments</p>
                <h2 id="commitments-title">Monthly Commitments</h2>
                <p className="commitments-sub">Total {formatRM(commitmentsTotal)} for {getMonthLabel(currentMonthKey)}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowCommitments(false)} aria-label="Close commitments">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="commitment-list">
              {commitments.map((commitment) => {
                const status = getCommitmentStatus(commitment)
                return (
                  <article key={commitment.id} className="commitment-item">
                    <div className="commitment-main">
                      <div className="commitment-icon"><Wallet size={16} aria-hidden="true" /></div>
                      <div>
                        <p className="commitment-name">{commitment.name}</p>
                        <p className="commitment-meta">
                          {formatRM(commitment.amount)} · due day {commitment.dueDay} · {commitment.category}
                        </p>
                      </div>
                    </div>
                    <div className="commitment-actions">
                      <span className={`commitment-status ${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
                      <button type="button" className="mini-button" onClick={() => handleMarkCommitmentPaid(commitment)} disabled={status === 'Paid'}>
                        <Check size={12} aria-hidden="true" /> Paid
                      </button>
                      <button type="button" className="mini-button" onClick={() => handleEditCommitment(commitment)}>
                        <Pencil size={12} aria-hidden="true" /> Edit
                      </button>
                      <button type="button" className="mini-button mini-delete" onClick={() => handleDeleteCommitment(commitment.id)}>
                        <Trash size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <form className="commitment-form" onSubmit={handleSaveCommitment}>
              <div className="commitment-form-head">
                <h3>{commitmentEditId ? 'Edit commitment' : 'Add commitment'}</h3>
                {commitmentEditId && (
                  <button type="button" className="mini-button" onClick={resetCommitmentForm}>Cancel</button>
                )}
              </div>

              <label className="field-label" htmlFor="commitment-name">Payment name</label>
              <input
                id="commitment-name"
                className="text-input"
                value={commitmentForm.name}
                onChange={e => setCommitmentForm(current => ({ ...current, name: e.target.value }))}
                placeholder="e.g. Car payment"
              />

              <div className="commitment-form-grid">
                <div>
                  <label className="field-label" htmlFor="commitment-amount">Amount</label>
                  <input
                    id="commitment-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="text-input"
                    value={commitmentForm.amount}
                    onChange={e => setCommitmentForm(current => ({ ...current, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="commitment-due">Due day</label>
                  <input
                    id="commitment-due"
                    type="number"
                    min="1"
                    max="31"
                    className="text-input"
                    value={commitmentForm.dueDay}
                    onChange={e => setCommitmentForm(current => ({ ...current, dueDay: e.target.value }))}
                  />
                </div>
              </div>

              <label className="field-label" htmlFor="commitment-category">Category</label>
              <select
                id="commitment-category"
                className="text-input"
                value={commitmentForm.category}
                onChange={e => setCommitmentForm(current => ({ ...current, category: e.target.value }))}
              >
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>

              <label className="field-label" htmlFor="commitment-account">Account</label>
              <select
                id="commitment-account"
                className="text-input"
                value={commitmentForm.accountId}
                onChange={e => setCommitmentForm(current => ({ ...current, accountId: e.target.value }))}
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name} ({account.owner})</option>
                ))}
              </select>

              <label className="commitment-toggle">
                <input
                  type="checkbox"
                  checked={commitmentForm.reminder}
                  onChange={e => setCommitmentForm(current => ({ ...current, reminder: e.target.checked }))}
                />
                Reminder enabled
              </label>

              <button type="submit" className="button button-primary">
                {commitmentEditId ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {commitmentEditId ? 'Save commitment' : 'Add commitment'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── BOTTOM NAV with FAB ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS_LEFT.map(item => (
          <button key={item.key} type="button"
            className={`bottom-tab${page===item.key?' active':''}`}
            onClick={() => setPage(item.key)}>
            <item.Icon size={23} aria-hidden="true"/>
            {item.label}
          </button>
        ))}
        <button className="bottom-tab-fab" onClick={() => setPage('add')} aria-label="Add expense">
          <Plus size={34} aria-hidden="true"/>
        </button>
        {NAV_ITEMS_RIGHT.map(item => (
          <button key={item.key} type="button"
            className={`bottom-tab${page===item.key?' active':''}`}
            onClick={() => setPage(item.key)}>
            <item.Icon size={23} aria-hidden="true"/>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
