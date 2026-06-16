import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
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
import { db, familyId, firebaseEnabled } from './firebase'
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

const INCOME_CATEGORIES = [
  'Salary','Business Income','Allowance','Bonus','Refund','Gift','Other',
]

const TRANSACTION_FILTERS = ['All', 'Expenses', 'Income', 'Transfers']

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
  transfers: 'duitlife_transfers',
  settings: 'duitlife_settings',
  commitments: 'duitlife_commitments',
  commitmentPaidPrefix: 'duitlife_commitmentPaid_',
}

const FIRESTORE_COLLECTIONS = {
  expenses: 'expenses',
  accounts: 'accounts',
  transfers: 'transfers',
  commitments: 'monthlyCommitments',
  commitmentPaidStatus: 'commitmentPaidStatus',
  settings: 'settings',
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

const formatLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysToDateString = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return formatLocalDateString(date)
}

const todayString = () => formatLocalDateString(new Date())

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

const isPaidCommitment = (paidCommitments, id) => {
  const value = paidCommitments[id]
  return value === true || (value && typeof value === 'object' && value.paid !== false)
}

const getPersonLabel = (person) => {
  const label = String(person || 'Adam').trim()
  return label || 'Adam'
}

const getPersonInitial = (person) => getPersonLabel(person).charAt(0).toUpperCase()

const getExpenseDisplayTitle = (expense) => String(expense?.notes || '').trim() || expense?.category || 'Expense'

const getTransactionType = (record) => record?.type === 'income' ? 'income' : record?.type === 'transfer' ? 'transfer' : 'expense'
const isIncomeRecord = (record) => getTransactionType(record) === 'income'
const isExpenseRecord = (record) => getTransactionType(record) === 'expense'
const isBusinessExpenseRecord = (record) =>
  isExpenseRecord(record) && (record?.isBusiness === true || record?.category === 'Business')
const isPersonalExpenseRecord = (record) => isExpenseRecord(record) && !isBusinessExpenseRecord(record)
// Sum real expenses (excludes income/transfers) booked on a given date key (YYYY-MM-DD)
const sumExpensesForDate = (records, dateKey) =>
  records
    .filter(record => isPersonalExpenseRecord(record) && record.date === dateKey)
    .reduce((sum, record) => sum + Number(record.amount || 0), 0)
const getTransactionAmountLabel = (record) => {
  if (isIncomeRecord(record)) return `+${formatRM(record.amount)}`
  if (getTransactionType(record) === 'transfer') return formatRM(record.amount)
  return `-${formatRM(record.amount)}`
}
const getTransactionAmountClass = (record) => {
  const type = getTransactionType(record)
  return type === 'income' ? ' income' : type === 'transfer' ? ' transfer' : ''
}
const formatTransactionDate = (record) => {
  const value = record?.date || record?.createdAt
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}
const formatTransactionTime = (record) => {
  if (!record?.createdAt) return ''

  const date = new Date(record.createdAt)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${day}/${month}/${year}, ${time}`
}
const wasUpdatedRecently = (value) => {
  if (!value) return false
  const updatedAt = new Date(value).getTime()
  return Number.isFinite(updatedAt) && Date.now() - updatedAt < 5 * 60 * 1000
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

const getAccountLogo = (name = '') => {
  const key = String(name).trim().toLowerCase()

  if (key.includes('hong') || key.includes('leong') || key === 'hlb') return '/logos/hong-leong.png'
  if (key.includes('public') || key === 'pbb') return '/logos/public-bank.gif'
  if (key.includes('affin')) return '/logos/affin.png'
  if (key.includes('tng') || key.includes('touch')) return '/logos/tng.png'
  if (key.includes('maybank')) return '/logos/maybank.png'
  if (key.includes('rhb')) return '/logos/rhb.png'

  return null
}

const AccountBadge = ({ name, type }) => {
  const cls = type === 'eWallet' ? 'ewallet' : type === 'Cash' ? 'cash' : 'bank'
  const Icon = type === 'eWallet' ? Smartphone : type === 'Cash' ? Banknote : Building2
  const logo = getAccountLogo(name)

  if (logo) {
    return (
      <div className={`account-badge ${cls} has-logo`}>
        <img className="account-logo-img" src={logo} alt={`${name} logo`} />
      </div>
    )
  }

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

// Today's Spending card — daily summary without budget-limit noise
const DailySummaryCard = ({ title, spent, recordCount, biggestAmount, transactionLabel = 'transactions today' }) => {
  const recordsLabel = recordCount === 1 ? 'record' : 'records'
  return (
    <article className="card spend-limit-card">
      <div className="spend-limit-info">
        <p className="eyebrow">{title}</p>
        <p className="spend-limit-amount">{formatRM(spent)}</p>
        <p className="spend-limit-sub">{recordCount} {transactionLabel}</p>
        <p className="spend-limit-sub">Biggest: {formatRM(biggestAmount)}</p>
      </div>
      <div className="daily-record-badge" aria-label={`${recordCount} ${recordsLabel}`}>
        <span>{recordCount}x</span>
        <small>{recordsLabel}</small>
      </div>
    </article>
  )
}

const NAV_ITEMS_LEFT  = [
  { key: 'dashboard', label: 'Home',    Icon: Home },
  { key: 'recent',    label: 'Recent',  Icon: Receipt },
]
const NAV_ITEMS_RIGHT = [
  { key: 'reports',   label: 'Reports', Icon: PieChart },
  { key: 'settings',  label: 'Settings',Icon: Settings },
]

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput]   = useState('')
  const [page, setPage]           = useState('dashboard')
  const [expenses, setExpenses]   = useState([])
  const [accounts, setAccounts]   = useState(DEFAULT_ACCOUNTS)
  const [transfers, setTransfers] = useState([])
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [commitments, setCommitments] = useState(DEFAULT_COMMITMENTS)
  const [paidCommitments, setPaidCommitments] = useState({})
  const [syncStatus, setSyncStatus] = useState(firebaseEnabled ? 'Syncing' : 'Offline')
  const [firestoreReady, setFirestoreReady] = useState(false)
  const migrationStarted = useRef(false)
  const [showCommitments, setShowCommitments] = useState(false)
  const [commitmentEditId, setCommitmentEditId] = useState(null)
  const [editId, setEditId]       = useState(null)
  const [form, setForm] = useState({
    type: 'expense',
    date: new Date().toISOString().slice(0, 10),
    person: 'Adam', accountId: 'cash', toAccountId: '',
    category: 'Food & Drink', amount: '', notes: '', isBusiness: false,
  })
  const [budgetInput, setBudgetInput]   = useState(String(DEFAULT_SETTINGS.monthlyBudget))
  const [pinInputs, setPinInputs]       = useState({ current: '', next: '', confirm: '' })
  const [restoreText, setRestoreText]   = useState('')
  const [restoreMessage, setRestoreMessage] = useState('')
  const [recentFilterDate, setRecentFilterDate] = useState('')
  const [reportMonth, setReportMonth]   = useState(getMonthKey(new Date()))
  const [reportPerson, setReportPerson] = useState('All')
  const [reportAccount, setReportAccount] = useState('All')
  const [reportType, setReportType] = useState('All')
  const [transactionFilter, setTransactionFilter] = useState('All')
  const [balanceEdits, setBalanceEdits] = useState({})
  const [commitmentForm, setCommitmentForm] = useState({
    name: '',
    amount: '',
    dueDay: '1',
    category: 'Bills & Utilities',
    accountId: 'cash',
    reminder: true,
  })
  const [localDataLoaded, setLocalDataLoaded] = useState(false)

  const familyDocPath = ['families', familyId]
  const collectionRef = (name) => collection(db, ...familyDocPath, name)
  const docRef = (name, id) => doc(db, ...familyDocPath, name, String(id))
  const cleanRecord = (record) => JSON.parse(JSON.stringify(record || {}))
  const upsertDoc = async (ref, data) => {
    try {
      await updateDoc(ref, cleanRecord(data))
    } catch {
      await setDoc(ref, cleanRecord(data))
    }
  }

  // Helper: get a single snapshot via onSnapshot then unsubscribe immediately.
  const onceCollectionSnapshot = (ref) => new Promise((resolve, reject) => {
    let unsub = null
    try {
      unsub = onSnapshot(ref, (snapshot) => {
        resolve({ snapshot, unsub })
      }, (err) => {
        if (unsub) unsub()
        reject(err)
      })
    } catch (err) {
      if (unsub) unsub()
      reject(err)
    }
  })

  const writeWithSyncStatus = async (operation) => {
    if (!firebaseEnabled || !db || !firestoreReady) return
    setSyncStatus('Syncing')
    try {
      await operation()
      setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
    } catch (error) {
      console.warn('Firestore sync failed', error)
      setSyncStatus('Offline')
    }
  }

  const syncArrayCollection = async (collectionName, items) => {
    if (!firebaseEnabled || !db) return
    // Use a one-time onSnapshot to read current documents, then unsubscribe.
    const { snapshot, unsub } = await onceCollectionSnapshot(collectionRef(collectionName))
    try {
      const currentDocs = snapshot
      const nextIds = new Set(items.map(item => String(item.id)))
      await Promise.all([
        ...currentDocs.docs
          .filter(item => !nextIds.has(item.id))
          .map(item => deleteDoc(item.ref)),
        ...items.map(item => (
          item.id
            ? upsertDoc(docRef(collectionName, item.id), item)
            : addDoc(collectionRef(collectionName), cleanRecord(item))
        )),
      ])
    } finally {
      if (typeof unsub === 'function') unsub()
    }
  }

  const syncSettingsDoc = (nextSettings) => writeWithSyncStatus(() =>
    upsertDoc(docRef(FIRESTORE_COLLECTIONS.settings, 'app'), nextSettings)
  )

  const syncPaidStatusDoc = (monthKey, nextPaidStatus) => writeWithSyncStatus(() =>
    upsertDoc(docRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus, monthKey), {
      month: monthKey,
      paid: cleanRecord(nextPaidStatus),
    })
  )

  const syncFullData = (nextData) => writeWithSyncStatus(async () => {
    await Promise.all([
      syncArrayCollection(FIRESTORE_COLLECTIONS.expenses, nextData.expenses || []),
      syncArrayCollection(FIRESTORE_COLLECTIONS.accounts, nextData.accounts || []),
      syncArrayCollection(FIRESTORE_COLLECTIONS.transfers, nextData.transfers || []),
      syncArrayCollection(FIRESTORE_COLLECTIONS.commitments, nextData.commitments || []),
      upsertDoc(docRef(FIRESTORE_COLLECTIONS.settings, 'app'), nextData.settings || DEFAULT_SETTINGS),
      upsertDoc(docRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus, currentMonthKey), {
        month: currentMonthKey,
        paid: cleanRecord(nextData.paidCommitments || {}),
      }),
    ])
  })

  useEffect(() => {
    const ex = safeParse(localStorage.getItem(STORAGE.expenses), [])
    const ac = safeParse(localStorage.getItem(STORAGE.accounts), DEFAULT_ACCOUNTS)
    const tr = safeParse(localStorage.getItem(STORAGE.transfers), [])
    const se = safeParse(localStorage.getItem(STORAGE.settings), DEFAULT_SETTINGS)
    const cm = safeParse(localStorage.getItem(STORAGE.commitments), DEFAULT_COMMITMENTS)
    setExpenses(Array.isArray(ex) ? ex : [])
    setAccounts(Array.isArray(ac) && ac.length ? ac : DEFAULT_ACCOUNTS)
    setTransfers(Array.isArray(tr) ? tr : [])
    setCommitments(Array.isArray(cm) && cm.length ? cm : DEFAULT_COMMITMENTS)
    setSettings({ ...DEFAULT_SETTINGS, ...se })
    setBudgetInput(String(se.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget))
    setLocalDataLoaded(true)
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE.expenses, JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem(STORAGE.accounts, JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem(STORAGE.transfers, JSON.stringify(transfers)) }, [transfers])
  useEffect(() => { localStorage.setItem(STORAGE.settings, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(STORAGE.commitments, JSON.stringify(commitments)) }, [commitments])

  const today          = new Date()
  const todayKey       = todayString()
  const currentMonthKey = getMonthKey(today)
  const currentMonthOverviewLabel = `${today.toLocaleString('default', { month: 'long' })} Overview`
  const latestUpdate = useMemo(() => {
    return [...expenses, ...transfers]
      .filter(item => item?.updatedAt || item?.createdAt)
      .sort((a, b) => (
        new Date(b.updatedAt || b.createdAt).getTime()
        - new Date(a.updatedAt || a.createdAt).getTime()
      ))[0]
  }, [expenses, transfers])
  const latestUpdateLabel = latestUpdate
    ? `Updated on ${formatDateTime(latestUpdate.updatedAt || latestUpdate.createdAt)}`
    : 'No recent updates'

  useEffect(() => {
    setPaidCommitments(safeParse(localStorage.getItem(`${STORAGE.commitmentPaidPrefix}${currentMonthKey}`), {}))
  }, [currentMonthKey])

  useEffect(() => {
    localStorage.setItem(`${STORAGE.commitmentPaidPrefix}${currentMonthKey}`, JSON.stringify(paidCommitments))
  }, [currentMonthKey, paidCommitments])

  useEffect(() => {
    if (!firebaseEnabled || !db) {
      setSyncStatus('Offline')
      return
    }
    if (!localDataLoaded || migrationStarted.current) return

    migrationStarted.current = true
        const migrateLocalData = async () => {
      setSyncStatus('Syncing')
      try {
        const localPaid = safeParse(localStorage.getItem(`${STORAGE.commitmentPaidPrefix}${currentMonthKey}`), {})
        const seedIfEmpty = async (collectionName, items) => {
          // Read the collection once via onSnapshot and unsubscribe immediately.
          const { snapshot, unsub } = await onceCollectionSnapshot(collectionRef(collectionName))
          try {
            if (snapshot.empty && items.length) await syncArrayCollection(collectionName, items)
          } finally {
            if (typeof unsub === 'function') unsub()
          }
        }

        await Promise.all([
          seedIfEmpty(FIRESTORE_COLLECTIONS.expenses, expenses),
          seedIfEmpty(FIRESTORE_COLLECTIONS.accounts, accounts),
          seedIfEmpty(FIRESTORE_COLLECTIONS.transfers, transfers),
          seedIfEmpty(FIRESTORE_COLLECTIONS.commitments, commitments),
        ])

        // Ensure settings doc exists using a one-time snapshot check.
        {
          const { snapshot, unsub } = await onceCollectionSnapshot(collectionRef(FIRESTORE_COLLECTIONS.settings))
          try {
            if (snapshot.empty) {
              await upsertDoc(docRef(FIRESTORE_COLLECTIONS.settings, 'app'), settings)
            }
          } finally {
            if (typeof unsub === 'function') unsub()
          }
        }

        // Ensure commitmentPaidStatus for current month exists if local data present.
        {
          const { snapshot, unsub } = await onceCollectionSnapshot(collectionRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus))
          try {
            if (snapshot.empty && Object.keys(localPaid).length) {
              await upsertDoc(docRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus, currentMonthKey), {
                month: currentMonthKey,
                paid: cleanRecord(localPaid),
              })
            }
          } finally {
            if (typeof unsub === 'function') unsub()
          }
        }

        setFirestoreReady(true)
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      } catch (error) {
        console.warn('Firebase migration failed', error)
        setSyncStatus('Offline')
      }
    }

    migrateLocalData()
  }, [accounts, commitments, currentMonthKey, expenses, localDataLoaded, settings, transfers])

  useEffect(() => {
    if (!firebaseEnabled || !db || !firestoreReady) return undefined
    setSyncStatus('Syncing')

    const sortAccounts = (items) => {
      const order = new Map(DEFAULT_ACCOUNTS.map((item, index) => [item.id, index]))
      return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
    }
    const sortCommitments = (items) => {
      const order = new Map(DEFAULT_COMMITMENTS.map((item, index) => [item.id, index]))
      return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
    }
    const readDocs = (snapshot) => snapshot.docs.map(item => ({ id: item.id, ...item.data() }))

    const unsubscribers = [
      onSnapshot(collectionRef(FIRESTORE_COLLECTIONS.expenses), (snapshot) => {
        setExpenses(readDocs(snapshot))
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
      onSnapshot(collectionRef(FIRESTORE_COLLECTIONS.accounts), (snapshot) => {
        const nextAccounts = readDocs(snapshot)
        setAccounts(nextAccounts.length ? sortAccounts(nextAccounts) : DEFAULT_ACCOUNTS)
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
      onSnapshot(collectionRef(FIRESTORE_COLLECTIONS.transfers), (snapshot) => {
        setTransfers(readDocs(snapshot))
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
      onSnapshot(collectionRef(FIRESTORE_COLLECTIONS.commitments), (snapshot) => {
        const nextCommitments = readDocs(snapshot)
        setCommitments(nextCommitments.length ? sortCommitments(nextCommitments) : DEFAULT_COMMITMENTS)
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
      onSnapshot(collectionRef(FIRESTORE_COLLECTIONS.settings), (snapshot) => {
        if (!snapshot.empty) {
          // Prefer a doc named 'app' if present, otherwise pick the first doc
          const appDoc = snapshot.docs.find(d => d.id === 'app') || snapshot.docs[0]
          if (appDoc) {
            const nextSettings = { ...DEFAULT_SETTINGS, ...appDoc.data() }
            setSettings(nextSettings)
            setBudgetInput(String(nextSettings.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget))
          }
        }
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
      onSnapshot(docRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus, currentMonthKey), (snapshot) => {
        setPaidCommitments(snapshot.exists() ? (snapshot.data().paid || {}) : {})
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline')
      }, () => setSyncStatus('Offline')),
    ]

    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [currentMonthKey, firestoreReady])

  useEffect(() => {
    const updateOnlineStatus = () => setSyncStatus(firebaseEnabled && navigator.onLine ? 'Synced' : 'Offline')
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const currentMonthTransactions = useMemo(
    () => expenses.filter(e => getMonthKey(e.date) === currentMonthKey),
    [expenses, currentMonthKey]
  )
  const personalExpenses = useMemo(
    () => expenses.filter(isPersonalExpenseRecord),
    [expenses]
  )
  const currentMonthPersonalExpenses = useMemo(
    () => currentMonthTransactions.filter(isPersonalExpenseRecord),
    [currentMonthTransactions]
  )
  const currentMonthIncome = useMemo(
    () => currentMonthTransactions.filter(isIncomeRecord),
    [currentMonthTransactions]
  )
  const todayTotal = useMemo(
    () => sumExpensesForDate(personalExpenses, todayKey),
    [personalExpenses, todayKey]
  )
  const todayExpenseRecords = useMemo(
    () => personalExpenses.filter(e => e.date === todayKey),
    [personalExpenses, todayKey]
  )
  const todayBiggestExpense = useMemo(
    () => todayExpenseRecords.reduce((max, expense) => Math.max(max, Number(expense.amount) || 0), 0),
    [todayExpenseRecords]
  )
  const todayTransferTotal = useMemo(
    () => transfers
      .filter(transfer => (transfer.date || transfer.createdAt || '').slice(0, 10) === todayKey)
      .reduce((sum, transfer) => sum + (Number(transfer.amount) || 0), 0),
    [transfers, todayKey]
  )
  const todayCategoryChips = useMemo(() => {
    const totals = todayExpenseRecords.reduce((map, expense) => {
      const category = expense.category || 'Other'
      map.set(category, (map.get(category) || 0) + (Number(expense.amount) || 0))
      return map
    }, new Map())
    if (todayTransferTotal > 0) totals.set('Transfer', todayTransferTotal)
    return [...totals.entries()]
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }))
  }, [todayExpenseRecords, todayTransferTotal])
  // The date the "Recent" tab is currently filtered to (falls back to today when no filter is active)
  const selectedSpendDate = recentFilterDate || todayKey
  const selectedDayExpenseRecords = useMemo(
    () => personalExpenses.filter(e => e.date === selectedSpendDate),
    [personalExpenses, selectedSpendDate]
  )
  const selectedDaySpendTotal = useMemo(
    () => selectedDayExpenseRecords.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
    [selectedDayExpenseRecords]
  )
  const selectedDayBiggestExpense = useMemo(
    () => selectedDayExpenseRecords.reduce((max, expense) => Math.max(max, Number(expense.amount) || 0), 0),
    [selectedDayExpenseRecords]
  )
  const monthTotal = useMemo(
    () => currentMonthPersonalExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [currentMonthPersonalExpenses]
  )
  const monthIncomeTotal = useMemo(
    () => currentMonthIncome.reduce((s, e) => s + Number(e.amount), 0),
    [currentMonthIncome]
  )
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance), 0), [accounts])
  const cashBalance = useMemo(
    () => accounts
      .filter(account => account.type === 'Cash' || account.id === 'cash')
      .reduce((sum, account) => sum + Number(account.balance || 0), 0),
    [accounts]
  )
  const bankBalance = Math.max(totalBalance - cashBalance, 0)
  const currentMonthTransferCount = useMemo(
    () => transfers.filter(transfer => getMonthKey(transfer.date || transfer.createdAt || todayKey) === currentMonthKey).length,
    [transfers, currentMonthKey, todayKey]
  )
  const currentMonthRecordCount = currentMonthTransactions.length + currentMonthTransferCount
  const activeCommitments = useMemo(
    () => commitments.filter(c => c.active !== false),
    [commitments]
  )
  const commitmentsTotal = useMemo(
    () => activeCommitments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [activeCommitments]
  )
  const paidCommitmentsTotal = useMemo(
    () => activeCommitments.reduce((sum, item) => (
      isPaidCommitment(paidCommitments, item.id) ? sum + Number(item.amount || 0) : sum
    ), 0),
    [activeCommitments, paidCommitments]
  )
  const remainingCommitments = Math.max(commitmentsTotal - paidCommitmentsTotal, 0)
  const effectiveMonthlyBudget = Number(settings.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget)
  const remainingBudget = Math.max(effectiveMonthlyBudget - monthTotal, 0)
  const budgetUsage = effectiveMonthlyBudget > 0 ? Math.min(100, (monthTotal / effectiveMonthlyBudget) * 100) : 0
  const commitmentProgress = commitmentsTotal > 0 ? Math.min(100, (paidCommitmentsTotal / commitmentsTotal) * 100) : 0
  const unpaidCommitments = activeCommitments.filter(item => !isPaidCommitment(paidCommitments, item.id))
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
  const dailyTotals = useMemo(() => sumByDate(personalExpenses), [personalExpenses])
  const todaySparkline = useMemo(() => {
    const values = currentMonthPersonalExpenses
      .filter(e => e.date === todayKey)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .map(e => Number(e.amount || 0))
    return values.length ? values : [0, 0, 0, 0, 0, 0, 0]
  }, [currentMonthPersonalExpenses, todayKey])
  const monthBarValues = useMemo(() => {
    const activeDays = Object.entries(sumByDate(currentMonthPersonalExpenses))
      .filter(([, total]) => total > 0)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-10)
      .map(([, total]) => total)
    return activeDays.length ? activeDays : [0, 0, 0, 0, 0, 0, 0]
  }, [currentMonthPersonalExpenses])
  const recentDayKeys = useMemo(() => getLastDateKeys(7, today), [todayKey])
  const transactionSparkline = useMemo(
    () => recentDayKeys.map((key) => personalExpenses.filter(e => e.date === key).length || dailyTotals[key] || 0),
    [dailyTotals, personalExpenses, recentDayKeys]
  )
  const dashboardAccounts = useMemo(() => {
    const featured = accounts.filter(a => a.id === 'hlb_ft' || a.id === 'mbb_ml')
    return featured.length ? featured : accounts.slice(0, 2)
  }, [accounts])

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    [expenses]
  )
  const visibleRecentExpenses = useMemo(
    () => recentFilterDate
      ? [...expenses].filter((expense) => expense.date === recentFilterDate).sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')))
      : recentExpenses,
    [expenses, recentExpenses, recentFilterDate]
  )
  const recentFilterLabel = recentFilterDate
    ? new Date(`${recentFilterDate}T00:00:00`).toLocaleDateString()
    : ''

  const changeSelectedExpenseDate = (days) => {
    setRecentFilterDate(prev =>
      addDaysToDateString(prev || todayString(), days)
    )
  }

  const openAddExpenseFromRecent = () => {
    setForm(f => ({
      ...f,
      type: 'expense',
      date: recentFilterDate || todayKey,
      category: CATEGORIES.includes(f.category) ? f.category : 'Food & Drink',
      isBusiness: false,
    }))
    setPage('add')
  }
  const reportOptions = useMemo(buildMonthOptions, [])

  const reportExpenses = useMemo(() => {
    const transferItems = transfers.map((transfer) => ({
      ...transfer,
      type: 'transfer',
      category: transfer.category || 'Transfer',
      person: transfer.person || transfer.owner || 'Shared',
      amount: Number(transfer.amount || 0),
      accountId: transfer.accountId || transfer.fromAccountId || transfer.from || '',
      toAccountId: transfer.toAccountId || transfer.to || '',
      date: transfer.date || transfer.createdAt || getDateKey(new Date()),
      notes: transfer.notes || 'Transfer',
    }))

    return [...expenses, ...transferItems].filter(e => {
      const mok = getMonthKey(e.date) === reportMonth
      const pok = reportPerson  === 'All' || e.person    === reportPerson
      const aok = reportAccount === 'All' || e.accountId === reportAccount || e.toAccountId === reportAccount
      const tok = reportType === 'All'
        || (reportType === 'Expenses' && isExpenseRecord(e))
        || (reportType === 'Income' && isIncomeRecord(e))
        || (reportType === 'Transfers' && getTransactionType(e) === 'transfer')
      return mok && pok && aok && tok
    })
  }, [expenses, transfers, reportMonth, reportPerson, reportAccount, reportType])
  const reportExpenseTotal = useMemo(() => reportExpenses.filter(isExpenseRecord).reduce((s, e) => s + Number(e.amount), 0), [reportExpenses])
  const reportIncomeTotal = useMemo(() => reportExpenses.filter(isIncomeRecord).reduce((s, e) => s + Number(e.amount), 0), [reportExpenses])
  const reportNetTotal = reportIncomeTotal - reportExpenseTotal
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

  const historyTransactions = useMemo(() => {
    const expenseItems = expenses.map(item => ({ ...item, type: getTransactionType(item) }))
    const transferItems = transfers.map((transfer) => ({
      ...transfer,
      type: 'transfer',
      category: transfer.category || 'Transfer',
      person: transfer.person || transfer.owner || 'Shared',
      amount: Number(transfer.amount || 0),
      accountId: transfer.accountId || transfer.fromAccountId || transfer.from || '',
      date: transfer.date || transfer.createdAt || getDateKey(new Date()),
      notes: transfer.notes || 'Transfer',
    }))
    const allItems = [...expenseItems, ...transferItems]
    return allItems
      .filter((item) => (
        transactionFilter === 'All'
        || (transactionFilter === 'Expenses' && getTransactionType(item) === 'expense')
        || (transactionFilter === 'Income' && getTransactionType(item) === 'income')
        || (transactionFilter === 'Transfers' && getTransactionType(item) === 'transfer')
      ))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, transfers, transactionFilter])

  const getAccountLabel = (id) => {
    const acc = accounts.find(a => a.id === id)
    return acc ? `${acc.name} (${acc.owner})` : id
  }

  const getTransactionAccountLabel = (record) => {
    if (getTransactionType(record) === 'transfer') {
      return `${getAccountLabel(record.accountId)} -> ${getAccountLabel(record.toAccountId)}`
    }
    return getAccountLabel(record.accountId)
  }

  const getTransactionMeta = (record) => [
    formatTransactionDate(record),
    formatTransactionTime(record),
  ].filter(Boolean).join(' • ')

  const getLinkedAccount = (record) => {
    const accountName = String(record.accountName || record.account || '').trim().toLowerCase()
    return accounts.find(account => account.id === record.accountId)
      || accounts.find(account => account.name.toLowerCase() === accountName)
      || null
  }

  const TransactionAccountBadge = ({ transaction }) => {
    const linkedAccount = getLinkedAccount(transaction)
    const accountName = linkedAccount?.name || transaction.accountName || transaction.account || ''
    const logo = linkedAccount?.logo || linkedAccount?.icon || getAccountLogo(accountName)
    const isCash = linkedAccount?.type === 'Cash' || String(accountName).toLowerCase() === 'cash' || transaction.accountId === 'cash'

    if (logo) {
      return (
        <div className="transaction-account-badge has-logo">
          <img className="transaction-account-logo" src={logo} alt={`${accountName} logo`} />
        </div>
      )
    }

    if (isCash) {
      return (
        <div className="transaction-account-badge cash">
          <Banknote size={17} aria-hidden="true" />
        </div>
      )
    }

    return (
      <div className="transaction-account-badge fallback">
        <Receipt size={17} aria-hidden="true" />
      </div>
    )
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (pinInput === settings.pin) { setAuthenticated(true); setPinInput(''); setPage('dashboard') }
    else { alert('Incorrect PIN.'); setPinInput('') }
  }

  const resetForm = () => {
    setEditId(null)
    setForm({ type: 'expense', date: todayString(), person: 'Adam', accountId: 'cash', toAccountId: '', category: 'Food & Drink', amount: '', notes: '', isBusiness: false })
  }

  const normalizeExpenseDate = (value) => {
    const raw = String(value || '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMatch) {
      const [, month, day, year] = slashMatch
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) return getDateKey(parsed)

    return ''
  }

  const parseExpenseAmount = (value) => {
    const normalized = String(value ?? '').trim().replace(',', '.')
    return Number(normalized)
  }

  const resolveExpenseAccountId = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    if (accounts.some((account) => account.id === raw)) return raw

    const match = accounts.find((account) => (
      account.name.toLowerCase() === raw.toLowerCase()
      || `${account.name} (${account.owner})`.toLowerCase() === raw.toLowerCase()
    ))

    return match?.id || raw
  }

  const validateExpenseForm = () => {
    const type = form.type === 'income' ? 'income' : form.type === 'transfer' ? 'transfer' : 'expense'
    const existingRecord = editId ? expenses.find(ex => ex.id === editId) || transfers.find(item => item.id === editId) : null
    const timestamp = new Date().toISOString()
    const date = normalizeExpenseDate(form.date)
    const person = getPersonLabel(form.person)
    const accountId = resolveExpenseAccountId(form.accountId)
    const toAccountId = resolveExpenseAccountId(form.toAccountId)
    const category = String(form.category || '').trim()
    const amount = parseExpenseAmount(form.amount)
    const failures = []

    if (!date) failures.push('date')
    if (!person) failures.push('spender')
    if (!accountId) failures.push('account')
    if (type === 'transfer' && !toAccountId) failures.push('to account')
    if (type === 'transfer' && accountId && toAccountId && accountId === toAccountId) failures.push('different accounts')
    if (type !== 'transfer' && !category) failures.push('category')
    if (!Number.isFinite(amount) || amount <= 0) failures.push('amount')

    if (failures.length > 0) {
      console.warn('Expense validation failed', {
        failures,
        form,
        normalized: { type, date, person, accountId, toAccountId, category, amount },
      })
      return {
        ok: false,
        message: `Please check: ${failures.join(', ')}.`,
      }
    }

    return {
      ok: true,
      record: {
        id: editId || `${Date.now()}`,
        type,
        date,
        person,
        accountId,
        toAccountId,
        category: type === 'transfer' ? 'Transfer' : category,
        amount,
        notes: String(form.notes || '').trim(),
        isBusiness: type === 'expense' ? Boolean(form.isBusiness || category === 'Business') : false,
        createdAt: existingRecord?.createdAt || timestamp,
        ...(editId ? { updatedAt: timestamp } : {}),
      },
    }
  }

  const applyTransactionToAccounts = (accountItems, record, direction = 1) => {
    const amount = Number(record.amount || 0)
    if (!amount || !record.accountId) return accountItems

    if (getTransactionType(record) === 'transfer') {
      return accountItems.map((account) => {
        if (account.id === record.accountId) return { ...account, balance: Math.max(0, Number(account.balance || 0) - (amount * direction)) }
        if (account.id === record.toAccountId) return { ...account, balance: Math.max(0, Number(account.balance || 0) + (amount * direction)) }
        return account
      })
    }

    return accountItems.map((account) => {
      if (account.id !== record.accountId) return account
      const delta = isIncomeRecord(record) ? amount * direction : -amount * direction
      return { ...account, balance: Math.max(0, Number(account.balance || 0) + delta) }
    })
  }

  const handleSaveExpense = (e) => {
    e.preventDefault()
    const validation = validateExpenseForm()
    if (!validation.ok) {
      alert(validation.message)
      return
    }

    const { record } = validation
    if (record.type === 'transfer') {
      const nextTransfers = [record, ...transfers]
      const nextAccounts = applyTransactionToAccounts(accounts, record, 1)
      setTransfers(nextTransfers)
      setAccounts(nextAccounts)
      writeWithSyncStatus(async () => {
        await Promise.all([
          upsertDoc(docRef(FIRESTORE_COLLECTIONS.transfers, record.id), record),
          syncArrayCollection(FIRESTORE_COLLECTIONS.accounts, nextAccounts),
        ])
      })
      resetForm(); setPage('dashboard')
      return
    }

    let nextExpenses
    let nextAccounts = accounts
    if (editId) {
      const old = expenses.find(ex => ex.id === editId)
      if (old) nextAccounts = applyTransactionToAccounts(nextAccounts, old, -1)
      nextExpenses = expenses.map(ex => ex.id === editId ? record : ex)
    } else {
      nextExpenses = [record, ...expenses]
    }
    nextAccounts = applyTransactionToAccounts(nextAccounts, record, 1)
    setExpenses(nextExpenses)
    setAccounts(nextAccounts)
    writeWithSyncStatus(async () => {
      await Promise.all([
        upsertDoc(docRef(FIRESTORE_COLLECTIONS.expenses, record.id), record),
        syncArrayCollection(FIRESTORE_COLLECTIONS.accounts, nextAccounts),
      ])
    })
    resetForm(); setPage('dashboard')
  }

  const handleQuickAmount = (v) => setForm(f => ({ ...f, amount: String(Number(f.amount || 0) + v) }))

  const handleEditExpense = (expense) => {
    setEditId(expense.id)
    setForm({
      type: getTransactionType(expense),
      date: expense.date,
      person: expense.person,
      accountId: expense.accountId,
      toAccountId: expense.toAccountId || '',
      category: expense.category,
      amount: String(expense.amount),
      notes: expense.notes || '',
      isBusiness: isBusinessExpenseRecord(expense),
    })
    setPage('add')
  }

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Delete this transaction?')) return
    const ex = expenses.find(e => e.id === id)
    const nextAccounts = ex
      ? applyTransactionToAccounts(accounts, ex, -1)
      : accounts
    const nextExpenses = expenses.filter(e => e.id !== id)
    setAccounts(nextAccounts)
    setExpenses(nextExpenses)
    writeWithSyncStatus(async () => {
      await Promise.all([
        deleteDoc(docRef(FIRESTORE_COLLECTIONS.expenses, id)),
        syncArrayCollection(FIRESTORE_COLLECTIONS.accounts, nextAccounts),
      ])
    })
  }

  const handleSaveBalance = (id) => {
    const val = Number(balanceEdits[id])
    if (isNaN(val) || val < 0) { alert('Enter a valid balance.'); return }
    const nextAccounts = accounts.map(a => a.id === id ? { ...a, balance: val } : a)
    setAccounts(nextAccounts)
    writeWithSyncStatus(() => syncArrayCollection(FIRESTORE_COLLECTIONS.accounts, nextAccounts))
    setBalanceEdits(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const handleSaveBudget = () => {
    const b = Number(budgetInput)
    if (isNaN(b) || b < 0) { alert('Enter a valid budget.'); return }
    const nextSettings = { ...settings, monthlyBudget: b, manualBudgetOverride: true }
    setSettings(nextSettings)
    syncSettingsDoc(nextSettings)
    alert('Budget updated.')
  }

  const handleChangePin = () => {
    if (pinInputs.current !== settings.pin) { alert('Current PIN is incorrect.'); return }
    if (pinInputs.next.length !== 4 || pinInputs.next !== pinInputs.confirm) { alert('New PIN must be 4 digits and match.'); return }
    const nextSettings = { ...settings, pin: pinInputs.next }
    setSettings(nextSettings)
    syncSettingsDoc(nextSettings)
    setPinInputs({ current: '', next: '', confirm: '' }); alert('PIN updated.')
  }

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ settings, expenses, accounts, transfers, commitments }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob); link.download = 'duitlife-backup.json'; link.click(); URL.revokeObjectURL(link.href)
  }

  const getExpenseTitle = (expense) => String(
    expense?.title ?? expense?.name ?? expense?.notes ?? expense?.category ?? 'Imported expense'
  ).trim().toLowerCase()

  const getExpenseDuplicateKey = (expense) => [
    String(expense?.date ?? '').trim(),
    Number(expense?.amount ?? 0).toFixed(2),
    getExpenseTitle(expense),
  ].join('|')

  const parseImportedExpenses = (text) => {
    if (!text.trim()) {
      throw new Error('Choose a JSON backup file or paste backup JSON first.')
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('This is not valid JSON. Please choose or paste a FamilyExpenses backup file.')
    }

    const importedExpenses = Array.isArray(parsed) ? parsed : parsed?.expenses
    if (!Array.isArray(importedExpenses)) {
      throw new Error('Backup must be an expenses list or an object with an expenses list.')
    }

    const importBatchId = Date.now()
    let skippedInvalid = 0
    const expensesToImport = importedExpenses.reduce((items, expense, index) => {
      if (!expense || typeof expense !== 'object' || Array.isArray(expense)) {
        skippedInvalid += 1
        return items
      }

      const amount = Number(expense.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        skippedInvalid += 1
        return items
      }

      const title = String(expense.title ?? expense.name ?? expense.notes ?? '').trim() || 'Imported expense'
      const category = String(expense.category ?? '').trim() || 'Other'
      const date = String(expense.date ?? '').trim() || getDateKey(new Date())
      const person = getPersonLabel(expense.person)
      const accountId = String(expense.accountId ?? '').trim() || accounts[0]?.id || 'cash'

      items.push({
        ...expense,
        id: expense.id ? String(expense.id) : `import_${importBatchId}_${index}`,
        title,
        name: expense.name ?? title,
        date,
        person,
        accountId,
        category,
        amount,
        notes: String(expense.notes ?? title),
        isBusiness: expense.isBusiness === true || category === 'Business',
      })

      return items
    }, [])

    return { expenses: expensesToImport, skippedInvalid }
  }

  const handleRestoreFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setRestoreMessage('')

    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) {
      setRestoreMessage('Please choose a .json backup file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '')
      setRestoreText(content)
      try {
        const preview = parseImportedExpenses(content)
        setRestoreMessage(`Loaded ${file.name}. Found ${preview.expenses.length} expenses. Skipped ${preview.skippedInvalid} invalid.`)
      } catch (error) {
        setRestoreMessage(error.message)
      }
    }
    reader.onerror = () => setRestoreMessage('Could not read that file. Please try another JSON backup.')
    reader.readAsText(file)
  }

  const handleRestoreBackup = () => {
    try {
      const { expenses: importedExpenses, skippedInvalid } = parseImportedExpenses(restoreText)
      const existingIds = new Set(expenses.map((expense) => String(expense.id || '')).filter(Boolean))
      const existingKeys = new Set(expenses.map(getExpenseDuplicateKey))
      const importIds = new Set()
      const importKeys = new Set()
      const uniqueExpenses = []
      let skippedDuplicates = 0

      importedExpenses.forEach((expense) => {
        const id = String(expense.id || '')
        const key = getExpenseDuplicateKey(expense)
        const isDuplicate = (id && (existingIds.has(id) || importIds.has(id))) || existingKeys.has(key) || importKeys.has(key)

        if (isDuplicate) {
          skippedDuplicates += 1
          return
        }

        uniqueExpenses.push(expense)
        if (id) importIds.add(id)
        importKeys.add(key)
      })

      if (uniqueExpenses.length > 0) {
        setExpenses(prev => [...prev, ...uniqueExpenses])
        writeWithSyncStatus(async () => {
          await Promise.all(uniqueExpenses.map((expense) => (
            upsertDoc(docRef(FIRESTORE_COLLECTIONS.expenses, expense.id), expense)
          )))
        })
      }

      const duplicateText = skippedDuplicates ? ` Skipped ${skippedDuplicates} duplicates.` : ''
      const message = `Imported ${uniqueExpenses.length}, skipped ${skippedInvalid} invalid.${duplicateText}`
      setRestoreText('')
      setRestoreMessage(message)
      alert(message)
    } catch (error) {
      setRestoreMessage(error.message)
      alert(error.message)
    }
  }

  const handleResetAll = () => {
    if (!window.confirm('Reset all data?')) return
    setExpenses([]); setAccounts(DEFAULT_ACCOUNTS); setTransfers([]); setCommitments(DEFAULT_COMMITMENTS); setPaidCommitments({}); setSettings(DEFAULT_SETTINGS)
    syncFullData({
      expenses: [],
      accounts: DEFAULT_ACCOUNTS,
      transfers: [],
      commitments: DEFAULT_COMMITMENTS,
      settings: DEFAULT_SETTINGS,
      paidCommitments: {},
    })
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
    const nextCommitments = commitmentEditId
      ? commitments.map(item => item.id === commitmentEditId ? record : item)
      : [record, ...commitments]
    setCommitments(nextCommitments)
    writeWithSyncStatus(() => syncArrayCollection(FIRESTORE_COLLECTIONS.commitments, nextCommitments))
    resetCommitmentForm()
  }

  const handleDeleteCommitment = (id) => {
    if (!window.confirm('Delete this commitment?')) return
    const nextCommitments = commitments.filter(item => item.id !== id)
    const nextPaid = { ...paidCommitments }
    delete nextPaid[id]
    setCommitments(nextCommitments)
    setPaidCommitments(nextPaid)
    writeWithSyncStatus(async () => {
      await Promise.all([
        deleteDoc(docRef(FIRESTORE_COLLECTIONS.commitments, id)),
        syncPaidStatusDoc(currentMonthKey, nextPaid),
      ])
    })
  }

  const toggleCommitmentPaid = (id) => {
    const nextPaid = { ...paidCommitments }
    if (isPaidCommitment(paidCommitments, id)) {
      delete nextPaid[id]
    } else {
      nextPaid[id] = true
    }
    setPaidCommitments(nextPaid)
    writeWithSyncStatus(async () => {
      await upsertDoc(docRef(FIRESTORE_COLLECTIONS.commitmentPaidStatus, currentMonthKey), {
        month: currentMonthKey,
        paid: cleanRecord(nextPaid),
      })
    })
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
          <img src="/hero-family.png" alt="Adam and Fatihah family portrait" className="family-img" />
          <div className="family-overlay" />
          <div className="family-content">
            <h1 className="family-title">Adam & Fatihah</h1>
            <p className="family-sub">{currentMonthOverviewLabel}</p>
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
          <div className="header-chip-row">
            <button type="button" className="button button-secondary logout-button" onClick={() => setAuthenticated(false)}>
              <LogOut size={18} aria-hidden="true"/> Logout
            </button>
            <div className={`sync-pill ${syncStatus.toLowerCase()}`}>{syncStatus}</div>
          </div>
          <p className="header-updated-line">{latestUpdateLabel}</p>
        </div>
      </header>

      {/* ── QUICK ACTIONS ── */}
      <div className="quick-actions">
        <button className="qa-btn" onClick={() => {
          setForm(f => ({ ...f, type: 'expense', category: CATEGORIES.includes(f.category) ? f.category : 'Food & Drink', isBusiness: false }))
          setPage('add')
        }}>
          <div className="qa-icon qa-orange"><Plus size={19} aria-hidden="true"/></div>
          <span className="qa-label">+ Expense</span>
        </button>
        <button className="qa-btn" onClick={() => {
          setForm(f => ({ ...f, type: 'income', category: INCOME_CATEGORIES.includes(f.category) ? f.category : 'Salary', isBusiness: false }))
          setPage('add')
        }}>
          <div className="qa-icon qa-green"><Download size={19} aria-hidden="true"/></div>
          <span className="qa-label">+ Income</span>
        </button>
        <button className="qa-btn" onClick={() => {
          setForm(f => ({ ...f, type: 'transfer', category: 'Transfer', toAccountId: f.toAccountId || accounts.find(a => a.id !== f.accountId)?.id || '', isBusiness: false }))
          setPage('add')
        }}>
          <div className="qa-icon qa-blue"><Repeat2 size={19} aria-hidden="true"/></div>
          <span className="qa-label">⇄ Transfer</span>
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

            {/* Today's spending summary */}
            <DailySummaryCard
              title="Today's Spending"
              spent={todayTotal}
              recordCount={todayExpenseRecords.length}
              biggestAmount={todayBiggestExpense}
            />

            <div className="category-chip-row" aria-label="Today's category spending">
              {todayCategoryChips.length ? (
                todayCategoryChips.map(item => (
                  <div key={item.category} className="category-insight-chip">
                    <span>{item.category}</span>
                    <strong>{formatRM(item.amount)}</strong>
                  </div>
                ))
              ) : (
                <div className="category-insight-chip muted">
                  <span>No spending today</span>
                  <strong>{formatRM(0)}</strong>
                </div>
              )}
            </div>

            {/* Stats 2x2 with sparklines */}
            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><BarChart3 size={20} aria-hidden="true"/></div>
                  <span className="stat-label">MONTH SPENT</span>
                </div>
                <p className="stat-value">{formatRM(monthTotal)}</p>
                <p className="stat-note">{getMonthLabel(currentMonthKey)}</p>
                <SparkLine color="#FFB347" type="bar" values={monthBarValues}/>
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><Download size={20} aria-hidden="true"/></div>
                  <span className="stat-label">MONTH INCOME</span>
                </div>
                <p className="stat-value income-value">{formatRM(monthIncomeTotal)}</p>
                <p className="stat-note">Received this month</p>
                <SparkLine color="#6BBF8A" type="wave1" values={currentMonthIncome.map(e => Number(e.amount || 0))}/>
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><Wallet size={20} aria-hidden="true"/></div>
                  <span className="stat-label">REMAINING BUDGET</span>
                </div>
                <p className="stat-value">{formatRM(remainingBudget)}</p>
                <p className="stat-note">Budget minus spending</p>
                <SparkLine
                  color="#9B7EC8"
                  type="progress"
                  progress={budgetUsage / 100}
                />
              </article>
              <article className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-icon-badge"><FileText size={20} aria-hidden="true"/></div>
                  <span className="stat-label">TRANSACTIONS</span>
                </div>
                <p className="stat-value">{currentMonthRecordCount}</p>
                <p className="stat-note">All records this month</p>
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
                  <p className="progress-spent">{formatRM(paidCommitmentsTotal)} paid</p>
                  <p className="progress-target">{formatRM(remainingCommitments)} remaining</p>
                </div>
              </div>
            </article>

            {/* Accounts */}
            <div className="section-head">
              <div>
                <p className="eyebrow">Accounts</p>
                <div className="balances-title-row">
                  <h2>Balances</h2>
                  <span className="pill balance-total-pill">{formatRM(totalBalance)}</span>
                </div>
                <div className="balance-split-row">
                  <span>Cash {formatRM(cashBalance)}</span>
                  <span>Bank {formatRM(bankBalance)}</span>
                </div>
              </div>
              <button className="manage-link" onClick={() => setPage('settings')}>Manage</button>
            </div>

            <div className="account-list">
              {dashboardAccounts.map(acc => (
                <div key={acc.id} className="account-row" onClick={() => setPage('settings')} style={{cursor:'pointer'}}>
                  <div className="account-left">
                    <AccountBadge name={acc.name} type={acc.type}/>
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
          </section>
        )}

        {/* ── RECENT EXPENSES ── */}
        {page === 'recent' && (
          <section className="section-card">
            <DailySummaryCard
              title={recentFilterDate && recentFilterDate !== todayKey ? `Spending on ${recentFilterLabel}` : "Today's Spending"}
              spent={selectedDaySpendTotal}
              recordCount={selectedDayExpenseRecords.length}
              biggestAmount={selectedDayBiggestExpense}
              transactionLabel={recentFilterDate && recentFilterDate !== todayKey ? 'transactions' : 'transactions today'}
            />

            <article className="card">
              <div className="section-head" style={{marginBottom:12}}>
                <div>
                  <p className="eyebrow">Recent</p>
                  <h2>Last expenses</h2>
                </div>
                <div className="recent-actions">
                  <button type="button" className="recent-date-step" onClick={() => changeSelectedExpenseDate(-1)} aria-label="Previous day">
                    {'<'}
                  </button>
                  <div className="recent-date-control" aria-label="Filter recent expenses by date">
                    <Calendar size={14} aria-hidden="true"/>
                    <input id="recent-date-filter" type="date" value={recentFilterDate}
                      onChange={e => setRecentFilterDate(e.target.value)}/>
                  </div>
                  <button type="button" className="recent-date-step" onClick={() => changeSelectedExpenseDate(1)} aria-label="Next day">
                    {'>'}
                  </button>
                  {recentFilterDate && (
                    <button type="button" className="recent-clear-button" onClick={() => setRecentFilterDate('')}>
                      Clear
                    </button>
                  )}
                  <button type="button" className="button button-primary" style={{fontSize:11,padding:'7px 14px'}} onClick={openAddExpenseFromRecent}>
                    <Plus size={15} aria-hidden="true"/> Add
                  </button>
                </div>
              </div>
              <div className="expense-list">
                {visibleRecentExpenses.length === 0 ? (
                  <p className="empty-state">
                    <Smile className="empty-icon" size={32} aria-hidden="true"/>
                    {recentFilterDate ? `No expenses on ${recentFilterLabel}` : 'No expenses yet. Tap Add to start!'}
                  </p>
                ) : visibleRecentExpenses.map(ex => (
                  <div key={ex.id} className="expense-item recent-expense-item">
                    <div className="expense-left">
                      <TransactionAccountBadge transaction={ex}/>
                      <div>
                        <p className="expense-title">{getExpenseDisplayTitle(ex)}</p>
                        <p className="expense-meta recent-expense-meta">
                          <span className="person-tag" data-person={getPersonLabel(ex.person)}>{getPersonInitial(ex.person)}</span>
                          <span className="transaction-time-meta">{getTransactionMeta(ex)}</span>
                          {isBusinessExpenseRecord(ex) && <span className="business-chip">Business</span>}
                          {wasUpdatedRecently(ex.updatedAt) && <span className="updated-chip">Updated</span>}
                        </p>
                      </div>
                    </div>
                    <div className="expense-right recent-expense-right">
                      <div className="expense-amount-column">
                        <p className={`expense-amount${getTransactionAmountClass(ex)}`}>{getTransactionAmountLabel(ex)}</p>
                      </div>
                      <div className="recent-expense-actions">
                        <button className="mini-button" onClick={() => handleEditExpense(ex)}>Edit</button>
                        <button className="mini-button mini-delete" onClick={() => handleDeleteExpense(ex.id)}>
                          <Trash size={12} aria-hidden="true" />
                        </button>
                      </div>
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
              <div><p className="eyebrow">Transaction</p><h2>{editId ? 'Edit transaction' : form.type === 'income' ? 'New income' : 'New expense'}</h2></div>
              <span className="tag">RM</span>
            </div>
            <form className="card form-card" onSubmit={handleSaveExpense}>
              <label className="field-label">Type</label>
              <div className="person-selector">
                {[
                  ['expense', 'Expense'],
                  ['income', 'Income'],
                  ['transfer', 'Transfer'],
                ].map(([type, label]) => (
                  <button key={type} type="button"
                    className={`person-btn${form.type === type ? ' active' : ''}`}
                    onClick={() => setForm(f => ({
                      ...f,
                      type,
                      category: type === 'income'
                        ? (INCOME_CATEGORIES.includes(f.category) ? f.category : 'Salary')
                        : type === 'transfer'
                          ? 'Transfer'
                          : (CATEGORIES.includes(f.category) ? f.category : 'Food & Drink'),
                      toAccountId: type === 'transfer' ? (f.toAccountId || accounts.find(a => a.id !== f.accountId)?.id || '') : f.toAccountId,
                      isBusiness: type === 'expense' ? Boolean(f.isBusiness) : false,
                    }))}>
                    {label}
                  </button>
                ))}
              </div>

              <label className="field-label">Date</label>
              <input type="date" className="text-input" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/>

              <label className="field-label">{form.type === 'income' ? 'Received by' : form.type === 'transfer' ? 'Handled by' : 'Who is spending?'}</label>
              <div className="person-selector">
                {PERSONS.map(p => (
                  <button key={p} type="button"
                    className={`person-btn${form.person === p ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>
                    <span className="person-tag" data-person={p} style={{marginRight:6}}>{p[0]}</span>{p}
                  </button>
                ))}
              </div>

              <label className="field-label">{form.type === 'transfer' ? 'From account' : 'Account'}</label>
              <select className="text-input" value={form.accountId}
                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.owner}) — {formatRM(a.balance)}</option>)}
              </select>

              {form.type === 'transfer' && (
                <>
                  <label className="field-label">To account</label>
                  <select className="text-input" value={form.toAccountId}
                    onChange={e => setForm(f => ({ ...f, toAccountId: e.target.value }))}>
                    <option value="">Choose account</option>
                    {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.owner}) — {formatRM(a.balance)}</option>)}
                  </select>
                </>
              )}

              {form.type !== 'transfer' && (
                <>
                  <label className="field-label">{form.type === 'income' ? 'Category / source' : 'Category'}</label>
                  <select className="text-input" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {(form.type === 'income' ? INCOME_CATEGORIES : CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}

              {form.type === 'expense' && (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isBusiness)}
                    onChange={e => setForm(f => ({ ...f, isBusiness: e.target.checked }))}
                  />
                  <span>Mark as Business Expense</span>
                </label>
              )}

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
                  {editId ? 'Save changes' : form.type === 'income' ? 'Save income' : form.type === 'transfer' ? 'Save transfer' : 'Save expense'}
                </button>
              </div>
            </form>

            <article className="card">
              <div className="section-head" style={{marginBottom:12}}>
                <div><p className="eyebrow">Transactions</p><h2>Manage records</h2></div>
              </div>
              <div className="transaction-filter">
                {TRANSACTION_FILTERS.map((filter) => (
                  <button key={filter} type="button"
                    className={`filter-chip${transactionFilter === filter ? ' active' : ''}`}
                    onClick={() => setTransactionFilter(filter)}>
                    {filter}
                  </button>
                ))}
              </div>
              <div className="expense-list">
                {historyTransactions.length === 0 ? <p className="empty-state">No transactions yet.</p>
                : historyTransactions.map(ex => (
                  <div key={ex.id} className="expense-item">
                    <div className="expense-left">
                      <TransactionAccountBadge transaction={ex}/>
                      <div>
                        <p className="expense-title">{getExpenseDisplayTitle(ex)}</p>
                        <p className="expense-meta">
                          <span className="person-tag" data-person={getPersonLabel(ex.person)}>{getPersonInitial(ex.person)}</span>
                          {getTransactionMeta(ex)}
                          {isBusinessExpenseRecord(ex) && <span className="business-chip">Business</span>}
                          {wasUpdatedRecently(ex.updatedAt) && <span className="updated-chip">Updated</span>}
                        </p>
                      </div>
                    </div>
                    <div className="expense-right">
                      <div className="expense-amount-column">
                        <p className={`expense-amount${getTransactionAmountClass(ex)}`}>{getTransactionAmountLabel(ex)}</p>
                      </div>
                      {getTransactionType(ex) !== 'transfer' && (
                        <>
                          <button className="mini-button" onClick={() => handleEditExpense(ex)}>Edit</button>
                          <button className="mini-button mini-delete" onClick={() => handleDeleteExpense(ex.id)}>
                            <Trash size={12} aria-hidden="true" />
                          </button>
                        </>
                      )}
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
              <label className="field-label">Type</label>
              <select className="text-input" value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="All">All</option>
                <option value="Expenses">Expenses</option>
                <option value="Income">Income</option>
                <option value="Transfers">Transfers</option>
              </select>
            </div>
            <div className="report-summary">
              <div className="summary-card"><p className="stat-label">Total spent</p><p className="stat-value">{formatRM(reportExpenseTotal)}</p></div>
              <div className="summary-card"><p className="stat-label">Total income</p><p className="stat-value income-value">{formatRM(reportIncomeTotal)}</p></div>
              <div className="summary-card"><p className="stat-label">Net</p><p className={`stat-value${reportNetTotal >= 0 ? ' income-value' : ''}`}>{formatRM(reportNetTotal)}</p></div>
              <div className="summary-card"><p className="stat-label">Transactions</p><p className="stat-value">{reportExpenses.length}</p></div>
            </div>
            {reportByPerson.length > 0 && (
              <div className="card">
                <p className="breakdown-title">By person</p>
                <ul className="breakdown-list">
                  {reportByPerson.map(([name, amt]) => (
                    <li key={name}>
                      <span style={{display:'flex',alignItems:'center',gap:8}}>
                        <span className="person-tag sm" data-person={getPersonLabel(name)}>{getPersonInitial(name)}</span>{name}
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

        {/* ── SETTINGS ── */}
        {page === 'settings' && (
          <section className="section-card">
            <div className="section-head">
              <div><p className="eyebrow">Settings</p><h2>Personalize</h2></div>
            </div>

            <div className="section-head" style={{ marginTop: 24 }}>
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
                  <AccountBadge name={acc.name} type={acc.type}/>
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

            <div className="section-head" style={{ marginTop: 32 }}>
              <div><p className="eyebrow">Preferences</p><h2>App settings</h2></div>
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
                <label className="button button-secondary restore-file-button" htmlFor="restore-file">
                  <Upload size={16} aria-hidden="true"/> Choose JSON file
                </label>
                <input id="restore-file" className="restore-file-input" type="file" accept=".json,application/json"
                  onChange={handleRestoreFileChange}/>
                <label className="field-label" htmlFor="restore-json">Restore backup</label>
                <textarea id="restore-json" rows={4} className="text-input" value={restoreText}
                  onChange={e => {
                    setRestoreText(e.target.value)
                    setRestoreMessage('')
                  }} placeholder="Paste JSON backup here"/>
                {restoreMessage && <p className="restore-message">{restoreMessage}</p>}
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
                const isPaid = isPaidCommitment(paidCommitments, commitment.id)
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
                      <button type="button" className={`mini-button commitment-toggle-button${isPaid ? ' paid' : ' unpaid'}`} onClick={() => toggleCommitmentPaid(commitment.id)}>
  {isPaid ? 'Paid' : 'Unpaid'}
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
