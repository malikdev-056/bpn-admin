import { useState, useEffect } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './DashboardPage.css'

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent || ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getStats()
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="page-loading">Loading dashboard...</p>
  if (error) return <p className="page-error">{error}</p>

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your BPN Pakistan</p>
      </header>

      {stats.totalUsers === 0 && (
        <EmptyState
          icon="📭"
          title="No activity yet"
          description="Your dashboard is empty. Users, payments, and requests will show up here once people register on the website."
        />
      )}

      <div className="stats-grid">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active Users" value={stats.activeUsers} accent="success" />
        <StatCard label="Pending Users" value={stats.pendingUsers} accent="warning" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} accent="warning" />
        <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} accent="warning" />
        <StatCard label="Pending Rewards" value={stats.pendingRewards} accent="warning" />
        <StatCard label="Approved Payments" value={stats.approvedPayments} accent="success" />
        <StatCard
          label="Total Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString('en-PK')}`}
          accent="accent"
        />
      </div>

      {stats.usersByLevel && stats.usersByLevel.length > 0 && (
        <section className="level-stats-section">
          <h3 className="section-title">Users by Plan / Level</h3>
          <div className="level-grid">
            {stats.usersByLevel.map((item) => (
              <div key={item.level} className="level-card">
                <div className="level-card-header">
                  <span className="level-badge">Plan {item.level} (Level {item.level})</span>
                  <span className="level-price">Rs. {item.amount.toLocaleString('en-PK')}</span>
                </div>
                <div className="level-card-body">
                  <div className="level-stat-item">
                    <span className="level-stat-label">Total Users</span>
                    <span className="level-stat-count">{item.totalUsers}</span>
                  </div>
                  <div className="level-stat-item highlight-success">
                    <span className="level-stat-label">Active</span>
                    <span className="level-stat-count">{item.activeUsers}</span>
                  </div>
                  <div className="level-stat-item highlight-warning">
                    <span className="level-stat-label">Pending</span>
                    <span className="level-stat-count">{item.pendingUsers}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
