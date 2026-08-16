import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import './SalaryPage.css'

function getCycleId(cycle) {
  return Number(cycle.cycleId ?? cycle.cycleDay)
}

function getRemainingMs(cycle, now) {
  if (cycle.isRunning && cycle.dueDate) {
    return Math.max(0, new Date(cycle.dueDate).getTime() - now)
  }
  if (cycle.isLocked && cycle.startedAt) {
    return Math.max(0, new Date(cycle.startedAt).getTime() - now)
  }
  return 0
}

function formatTimer(ms) {
  if (ms <= 0) return '00:00:00'

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return days > 0 ? `${days}d ${time}` : time
}

function formatDueDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Karachi',
  })
}

function CycleCard({ cycle, now, onDistribute, distributing }) {
  const cycleId = getCycleId(cycle)
  const periodLabel = cycle.periodLabel ?? `Cycle ${cycleId}`
  const remainingMs = getRemainingMs(cycle, now)
  const isRunning = Boolean(cycle.isRunning)
  const canDistribute = cycle.canDistribute

  let statusLabel = 'Waiting'
  let statusClass = 'idle'

  if (cycle.isLocked) {
    statusLabel = 'Locked'
    statusClass = 'idle'
  } else if (cycle.isPaid) {
    statusLabel = 'Paid'
    statusClass = 'paid'
  } else if (canDistribute) {
    statusLabel = 'Ready to pay'
    statusClass = 'ready'
  } else if (isRunning) {
    statusLabel = 'Running'
    statusClass = 'waiting'
  }

  const countdownLabel = cycle.isLocked
    ? `Starts ${formatDueDate(cycle.startedAt)}`
    : canDistribute
      ? `Period ended ${formatDueDate(cycle.dueDate)}`
      : isRunning
        ? `Countdown to ${cycle.periodEndLabel ?? formatDueDate(cycle.dueDate)}`
        : 'Waiting'

  return (
    <article className={`salary-cycle-card ${statusClass}${cycle.isLocked ? ' locked' : ''}`}>
      <div className="cycle-card-header">
        <div>
          <span className="cycle-day-badge">{periodLabel}</span>
          <h3>
            {cycle.label || `Cycle ${cycleId}`} — {periodLabel}
          </h3>
          <p className="cycle-due">
            {cycle.isLocked
              ? `Period ${formatDueDate(cycle.startedAt)} se shuru hogi`
              : cycleId === 1
                ? 'Period start par timer khud chalega'
                : `Cycle ${cycleId - 1} khatam → yeh period auto active`}
          </p>
        </div>
        <span className={`cycle-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="cycle-timer-box">
        <span className="cycle-timer-label">
          {cycle.isPaid
            ? 'Distributed'
            : cycle.isLocked
              ? 'Locked'
              : canDistribute
                ? 'Period finished — Distribute dabao'
                : isRunning
                  ? countdownLabel
                  : 'Waiting'}
        </span>

        <strong className={`cycle-timer-value${isRunning ? ' is-live' : ''}`}>
          {cycle.isPaid
            ? new Date(cycle.paidAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
            : cycle.isLocked
              ? formatTimer(remainingMs)
              : canDistribute
                ? '00:00:00'
                : formatTimer(remainingMs)}
        </strong>
      </div>

      {cycle.isPaid && (
        <div className="cycle-paid-summary">
          <span>Rs. {cycle.totalPaid.toLocaleString('en-PK')} paid</span>
          <span>{cycle.recipientCount} users</span>
        </div>
      )}

      {canDistribute && !cycle.isPaid && !cycle.isLocked && (
        <button
          type="button"
          className="btn-distribute"
          disabled={distributing === cycleId}
          onClick={() => onDistribute(cycleId)}
        >
          {distributing === cycleId ? 'Distributing...' : 'Distribute Salary (50% / 50%)'}
        </button>
      )}
    </article>
  )
}

export default function SalaryPage() {
  const [salary, setSalary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [distributing, setDistributing] = useState(null)
  const [now, setNow] = useState(Date.now())

  const loadSalary = useCallback(async (silent = false) => {
    if (!silent) setError('')
    try {
      const data = await api.getSalaryStatus()
      setSalary(data.salary)
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSalary()
  }, [loadSalary])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!salary?.cycles) return

    const running = salary.cycles.find((c) => c.isRunning)
    if (!running) return

    const msLeft = getRemainingMs(running, now)
    if (msLeft <= 0) {
      loadSalary(true)
      return
    }

    const timeout = window.setTimeout(() => loadSalary(true), msLeft + 500)
    const poll = window.setInterval(() => loadSalary(true), 60000)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(poll)
    }
  }, [salary, now, loadSalary])

  async function handleDistribute(cycleId) {
    const cycle = salary?.cycles?.find((c) => getCycleId(c) === Number(cycleId))
    const periodLabel = cycle?.periodLabel ?? `Cycle ${cycleId}`
    const pool = salary?.salaryPool ?? 0
    const leaderboardCount = salary?.leaderboardCount ?? 0
    const plan5Count = salary?.plan5Count ?? 0
    const leaderboardPool = salary?.leaderboardPool ?? 0
    const plan5Pool = salary?.plan5Pool ?? 0
    const rankBonuses = salary?.rankBonuses ?? [50, 40, 30]
    const bonusTotal = rankBonuses
      .slice(0, leaderboardCount)
      .reduce((sum, b) => sum + b, 0)
    const bonusesApply = salary?.rankBonusesApplied ?? bonusTotal <= leaderboardPool
    const distributablePool = bonusesApply ? leaderboardPool - bonusTotal : leaderboardPool
    const perLeaderboard =
      leaderboardCount > 0 ? Math.round(distributablePool / leaderboardCount) : 0
    const perPlan5 = plan5Count > 0 ? Math.round(plan5Pool / plan5Count) : 0
    const bonusLine = bonusesApply
      ? `  (Top 3 bonus: 1st +Rs. ${rankBonuses[0] ?? 0}, 2nd +Rs. ${rankBonuses[1] ?? 0}, 3rd +Rs. ${rankBonuses[2] ?? 0})\n`
      : ''

    if (
      !window.confirm(
        `Salary distribute karni hai?\n\nTotal pool: Rs. ${pool.toLocaleString('en-PK')}\n` +
          `• ${salary?.leaderboardSharePercent ?? 50}% (Rs. ${leaderboardPool.toLocaleString('en-PK')}) → ${leaderboardCount} leaderboard users (~Rs. ${perLeaderboard} each)\n` +
          bonusLine +
          `• ${salary?.plan5SharePercent ?? 50}% (Rs. ${plan5Pool.toLocaleString('en-PK')}) → ${plan5Count} Plan 2 users (~Rs. ${perPlan5} each)\n\n${periodLabel}?`,
      )
    ) {
      return
    }

    setDistributing(cycleId)
    setError('')
    setSuccess('')
    try {
      const data = await api.distributeSalary(cycleId)
      setSalary(data.status)
      setSuccess(`Cycle ${cycleId} ki salary distribute ho gayi.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setDistributing(null)
    }
  }

  if (loading) {
    return <p className="page-loading">Loading salary cycles...</p>
  }

  return (
    <div className="salary-page">
      <header className="page-header">
        <h2>Salary</h2>
        <p>
          Approved Level 1 join payments ka <strong>Total Revenue</strong> se salary pool
          banti hai — us ka <strong>25%</strong>. Example: Rs. 15,000 revenue →{' '}
          <strong>Rs. 3,750 pool</strong> (50% = Rs. 1,875, 50% = Rs. 1,875). Pool
          distribute hoti hai: <strong>50%</strong> team leaderboard users mein —
          pehle top 3 ke bonus reserve hote hain (<strong>1st +Rs. 50</strong>,{' '}
          <strong>2nd +Rs. 40</strong>, <strong>3rd +Rs. 30</strong>), phir baqi amount
          sab leaderboard users mein equally. <strong>50%</strong> sab active Plan 2
          users mein equally. Daily window: <strong>12 AM – 5 PM</strong>{' '}
          (Asia/Karachi).
        </p>
      </header>

      {error && <div className="page-alert">{error}</div>}
      {success && <div className="page-success">{success}</div>}

      <section className="salary-flow-steps">
        <div className="flow-step">
          <span>1</span>
          <p>Cycle 1: 1st – 10th · har din 12 AM – 5 PM</p>
        </div>
        <div className="flow-step">
          <span>2</span>
          <p>Cycle 2: 11th – 20th (auto) · 5 PM par period end</p>
        </div>
        <div className="flow-step">
          <span>3</span>
          <p>Cycle 3: 21st – month end (auto)</p>
        </div>
        <div className="flow-step">
          <span>4</span>
          <p>Agle mahine dubara Cycle 1 — koi reset nahi</p>
        </div>
      </section>

      <section className="salary-info-banner">
        <div>
          <span>Active cycle</span>
          <strong>
            {salary?.activeCycleId ? `Cycle ${salary.activeCycleId}` : 'None'}
          </strong>
        </div>
        <div>
          <span>Current month</span>
          <strong>{salary?.month ?? '—'}</strong>
        </div>
        <div>
          <span>Total revenue (L1 joins)</span>
          <strong>Rs. {(salary?.totalRevenue ?? 0).toLocaleString('en-PK')}</strong>
        </div>
        <div>
          <span>Salary pool (25% of revenue)</span>
          <strong>Rs. {(salary?.salaryPool ?? 0).toLocaleString('en-PK')}</strong>
        </div>
        <div>
          <span>Leaderboard share ({salary?.leaderboardSharePercent ?? 50}%)</span>
          <strong>Rs. {(salary?.leaderboardPool ?? 0).toLocaleString('en-PK')}</strong>
        </div>
        <div>
          <span>Plan 2 share ({salary?.plan5SharePercent ?? 50}%)</span>
          <strong>Rs. {(salary?.plan5Pool ?? 0).toLocaleString('en-PK')}</strong>
        </div>
        <div>
          <span>Leaderboard users</span>
          <strong>{salary?.leaderboardCount ?? 0} users</strong>
        </div>
        <div>
          <span>Plan 2 users</span>
          <strong>{salary?.plan5Count ?? 0} users</strong>
        </div>
      </section>

      <section className="salary-cycles">
        <h3>Salary Cycles</h3>
        <div className="cycles-grid">
          {salary?.cycles.map((cycle) => (
            <CycleCard
              key={getCycleId(cycle)}
              cycle={cycle}
              now={now}
              onDistribute={handleDistribute}
              distributing={distributing}
            />
          ))}
        </div>
      </section>

      <section className="salary-eligible">
        <h3>Leaderboard Users — {salary?.leaderboardSharePercent ?? 50}% of Pool</h3>
        <p className="section-sub">
          Pool ka {salary?.leaderboardSharePercent ?? 50}% in {salary?.leaderboardCount ?? 0} leaderboard
          users mein jata hai — top 3 bonus (1st +Rs. 50, 2nd +Rs. 40, 3rd +Rs. 30) reserve kar ke
          baqi amount sab mein equally. Example: Rs. 1,875 → bonus Rs. 120 minus → Rs. 1,755 → 6 users
          = Rs. 293 each (1st = Rs. 343, 2nd = Rs. 333, 3rd = Rs. 323).
        </p>

        {(salary?.leaderboardEligibleUsers?.length ?? 0) === 0 ? (
          <p className="empty-state">No leaderboard users for salary yet.</p>
        ) : (
          <div className="eligible-table-wrap">
            <table className="eligible-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Level</th>
                  <th>Active Plan</th>
                  <th>Team</th>
                  <th>Rank Bonus</th>
                  <th>Salary ({salary?.leaderboardSharePercent ?? 50}%)</th>
                </tr>
              </thead>
              <tbody>
                {salary.leaderboardEligibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.rank && user.rank <= 3
                        ? ['🥇', '🥈', '🥉'][user.rank - 1]
                        : user.rank ?? '—'}
                    </td>
                    <td>{user.username}</td>
                    <td>Level {user.level}</td>
                    <td>Rs. {user.planAmount.toLocaleString('en-PK')}</td>
                    <td>{user.totalTeam}</td>
                    <td>{user.rankBonus ? `+Rs. ${user.rankBonus}` : '—'}</td>
                    <td className="salary-amount">Rs. {user.salaryAmount.toLocaleString('en-PK')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="salary-eligible">
        <h3>Plan 2 Users — {salary?.plan5SharePercent ?? 50}% of Pool</h3>
        <p className="section-sub">
          Pool ka {salary?.plan5SharePercent ?? 50}% sab approved users mein jin ka active plan Level 2 hai,
          un mein equally divide hoga. Example: Rs. 3,750 pool → Rs. 1,875 → 3 users = Rs. 625 each.
        </p>

        {(salary?.plan5EligibleUsers?.length ?? 0) === 0 ? (
          <p className="empty-state">No active Plan 2 users for salary share yet.</p>
        ) : (
          <div className="eligible-table-wrap">
            <table className="eligible-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Level</th>
                  <th>Active Plan</th>
                  <th>Salary ({salary?.plan5SharePercent ?? 50}%)</th>
                </tr>
              </thead>
              <tbody>
                {salary.plan5EligibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>Level {user.level}</td>
                    <td>Rs. {user.planAmount.toLocaleString('en-PK')}</td>
                    <td className="salary-amount">Rs. {user.salaryAmount.toLocaleString('en-PK')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {salary?.history.length > 0 && (
        <section className="salary-history">
          <h3>Recent Salary Payments</h3>
          <div className="history-list">
            {salary.history.map((record) => (
              <article key={record.id} className="history-card">
                <div className="history-header">
                  <strong>
                    Cycle {record.cycleId ?? record.cycleDay} — {record.periodLabel ?? record.month}
                  </strong>
                  <span>Rs. {record.totalAmount.toLocaleString('en-PK')}</span>
                </div>
                <p>
                  {record.recipients.length} users ·{' '}
                  {new Date(record.distributedAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
