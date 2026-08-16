import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './PlanHistoryPage.css'

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
  return <span className={`plan-status-badge ${status}`}>{status}</span>
}

export default function PlanHistoryPage() {
  const [planHistory, setPlanHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  useEffect(() => {
    api
      .getPlanHistory()
      .then((data) => setPlanHistory(data.planHistory))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredHistory = useMemo(() => {
    if (!planHistory) return []
    if (levelFilter === 'all') return planHistory.history
    return planHistory.history.filter((entry) => Number(entry.level) === Number(levelFilter))
  }, [planHistory, levelFilter])

  if (loading) return <p className="page-loading">Loading plan history...</p>
  if (error) return <p className="page-error">{error}</p>

  const { summary, totals } = planHistory

  return (
    <div className="plan-history-page">
      <header className="page-header">
        <h2>Plan History</h2>
        <p>
          Har plan par kitne users hain aur kitni purchases hui hain — poori subscription history
        </p>
      </header>

      <div className="plan-totals-grid">
        <div className="plan-total-card">
          <span>Total Users</span>
          <strong>{totals.totalUsers}</strong>
        </div>
        <div className="plan-total-card">
          <span>Total Purchases</span>
          <strong>{totals.totalPurchases}</strong>
        </div>
        <div className="plan-total-card success">
          <span>Approved Purchases</span>
          <strong>{totals.approvedPurchases}</strong>
        </div>
        <div className="plan-total-card accent">
          <span>Total Revenue</span>
          <strong>Rs. {formatRs(totals.totalRevenue)}</strong>
        </div>
      </div>

      <section className="plan-summary-section">
        <h3>Plan-wise Summary</h3>
        <div className="plan-summary-grid">
          {summary.map((plan) => (
            <article key={plan.level} className="plan-summary-card">
              <div className="plan-summary-header">
                <span className="plan-level-badge">Level {plan.level}</span>
                <strong className="plan-amount">Rs. {formatRs(plan.amount)}</strong>
              </div>
              <div className="plan-summary-stats">
                <div>
                  <span>Current users</span>
                  <strong>{plan.currentUsers}</strong>
                </div>
                <div>
                  <span>Approved purchases</span>
                  <strong>{plan.approvedPurchases}</strong>
                </div>
                <div>
                  <span>Pending</span>
                  <strong>{plan.pendingPurchases}</strong>
                </div>
                <div>
                  <span>Revenue</span>
                  <strong>Rs. {formatRs(plan.totalRevenue)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-history-section">
        <div className="plan-history-toolbar">
          <h3>Purchase History</h3>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="plan-level-filter"
          >
            <option value="all">All Plans</option>
            {summary.map((plan) => (
              <option key={plan.level} value={plan.level}>
                Level {plan.level} — Rs. {formatRs(plan.amount)}
              </option>
            ))}
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No plan purchases yet"
            description="Jab users koi plan subscribe karenge, unki history yahan dikhegi."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.username}</strong>
                      <span className="plan-user-email">{entry.email}</span>
                    </td>
                    <td>Level {entry.level}</td>
                    <td>Rs. {formatRs(entry.amount)}</td>
                    <td>
                      <StatusBadge status={entry.status} />
                    </td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
