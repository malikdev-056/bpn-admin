import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './WalletSalaryPage.css'

const PLAN_OPTIONS = [
  { value: 'all', label: 'All Plans' },
  { value: '1', label: 'Level 1' },
  { value: '2', label: 'Level 2' },
]

function formatRs(value) {
  return Number(value || 0).toLocaleString('en-PK')
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  return <span className={`wallet-salary-status ${status}`}>{status}</span>
}

export default function WalletSalaryPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadTransactions() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (planFilter !== 'all') params.set('planId', planFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const query = params.toString()
      const data = await api.getWalletTransactions(query ? `?${query}` : '')
      setTransactions(data.transactions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [planFilter, statusFilter])

  const totals = useMemo(() => {
    const completed = transactions.filter((tx) => tx.status === 'completed')
    return {
      count: transactions.length,
      totalSalary: completed.reduce((sum, tx) => sum + (tx.salaryAmount || tx.amount || 0), 0),
      totalPlanAmount: completed.reduce((sum, tx) => sum + (tx.planAmount || 0), 0),
    }
  }, [transactions])

  function handleSearchSubmit(e) {
    e.preventDefault()
    loadTransactions()
  }

  if (loading) return <p className="page-loading">Loading wallet salary transactions...</p>

  return (
    <div className="wallet-salary-page">
      <header className="page-header">
        <h2>Wallet Salary</h2>
        <p>Plan purchase salary credits (25% of plan amount) — all users</p>
      </header>

      {error && <div className="page-alert page-alert-error">{error}</div>}

      <div className="wallet-salary-totals">
        <div className="wallet-salary-total-card">
          <span>Transactions</span>
          <strong>{totals.count}</strong>
        </div>
        <div className="wallet-salary-total-card accent">
          <span>Total Salary Credited</span>
          <strong>Rs. {formatRs(totals.totalSalary)}</strong>
        </div>
        <div className="wallet-salary-total-card">
          <span>Total Plan Amount</span>
          <strong>Rs. {formatRs(totals.totalPlanAmount)}</strong>
        </div>
      </div>

      <form className="wallet-salary-filters" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Search user, email, payment ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {transactions.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No salary transactions"
          description="Salary credits appear here when plan purchases are approved."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Plan</th>
                <th>Plan Amount</th>
                <th>Salary (25%)</th>
                <th>Wallet Balance</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>
                    <strong>{tx.user?.username || 'Unknown'}</strong>
                    <span className="cell-sub">{tx.user?.email || tx.userId}</span>
                  </td>
                  <td>{tx.planName || `Level ${tx.planId}`}</td>
                  <td>Rs. {formatRs(tx.planAmount)}</td>
                  <td className="salary-amount">Rs. {formatRs(tx.salaryAmount || tx.amount)}</td>
                  <td>Rs. {formatRs(tx.walletBalance)}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td>{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
