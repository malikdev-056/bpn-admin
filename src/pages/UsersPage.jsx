import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './UsersPage.css'

const PAGE_SIZE = 10

const APPROVED_STATUSES = new Set(['Active', 'Approved'])

function isApprovedStatus(status) {
  return APPROVED_STATUSES.has(status)
}

function getDisplayStatus(status) {
  return isApprovedStatus(status) ? 'Approved' : status
}

function StatusBadge({ status }) {
  const label = getDisplayStatus(status)
  const cls = label.toLowerCase()
  return <span className={`status-badge ${cls}`}>{label}</span>
}

function sortUsersNewestFirst(list) {
  return [...list].sort((a, b) => {
    const dateDiff = new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    if (dateDiff !== 0) return dateDiff
    return b.id - a.id
  })
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [successMsg, setSuccessMsg] = useState('')
  const [planFilter, setPlanFilter] = useState('all')

  async function loadUsers() {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const data = await api.getUsers()
      setUsers(data.users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const levelCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0 }
    users.forEach((u) => {
      const lvl = Number(u.level)
      if (counts[lvl] !== undefined) {
        counts[lvl]++
      }
    })
    return counts
  }, [users])

  const filteredUsers = useMemo(() => {
    if (planFilter === 'all') return users
    return users.filter((u) => Number(u.level) === Number(planFilter))
  }, [users, planFilter])

  const sortedUsers = useMemo(() => sortUsersNewestFirst(filteredUsers), [filteredUsers])
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  async function handleApprove(userId) {
    setUpdatingId(userId)
    setError('')
    setSuccessMsg('')
    try {
      const data = await api.updateUser(userId, { status: 'Active' })
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)))
      setSuccessMsg('User approved successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleReject(userId) {
    setUpdatingId(userId)
    setError('')
    setSuccessMsg('')
    try {
      const data = await api.updateUser(userId, { status: 'Rejected' })
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)))
      setSuccessMsg('User rejected.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(userId, username) {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return

    setUpdatingId(userId)
    setError('')
    setSuccessMsg('')
    try {
      await api.deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setSuccessMsg(`User "${username}" deleted.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleStatChange(userId, key, value) {
    if (Number.isNaN(value)) {
      setError('Please enter a valid number.')
      return
    }

    setUpdatingId(userId)
    setError('')
    setSuccessMsg('')
    try {
      const data = await api.updateUser(userId, { stats: { [key]: value } })
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)))
      setSuccessMsg('User stats saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="page-loading">Loading users...</p>

  return (
    <div className="users-page">
      <header className="page-header">
        <h2>Users</h2>
        <p>{users.length} registered users</p>
      </header>

      {error && <div className="page-alert page-alert-error">{error}</div>}
      {successMsg && <div className="page-alert page-alert-success">{successMsg}</div>}

      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users yet"
          description="Registered members will appear here after they sign up on the website."
        />
      ) : (
        <>
          <div className="users-toolbar">
            <div className="plan-filter-group">
              <label htmlFor="planFilter" className="filter-label">Filter by Plan:</label>
              <select
                id="planFilter"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="plan-select-dropdown"
              >
                <option value="all">All Plans ({users.length} Users)</option>
                <option value="1">Plan 1 / Level 1 ({levelCounts[1]} Users)</option>
                <option value="2">Plan 2 / Level 2 ({levelCounts[2]} Users)</option>
              </select>
            </div>

            <div className="level-pills-bar">
              {[1, 2].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`level-pill-btn ${planFilter === String(lvl) ? 'active' : ''}`}
                  onClick={() => {
                    setPlanFilter(planFilter === String(lvl) ? 'all' : String(lvl))
                    setCurrentPage(1)
                  }}
                >
                  <span className="pill-lvl">Plan {lvl}</span>
                  <span className="pill-count">{levelCounts[lvl]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Level</th>
              <th>Balance</th>
              <th>Team</th>
              <th>Status</th>
              <th>Upline</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>Level {user.level}</td>
                <td>
                  <div className="user-balance-cells">
                    <input
                      type="number"
                      className="stat-input"
                      defaultValue={user.stats?.walletBalance ?? 0}
                      key={`wallet-${user.id}-${user.stats?.walletBalance}`}
                      disabled={updatingId === user.id}
                      onBlur={(e) => {
                        const val = Number(e.target.value)
                        if (val !== (user.stats?.walletBalance ?? 0)) {
                          handleStatChange(user.id, 'walletBalance', val)
                        }
                      }}
                      title="Wallet salary balance"
                    />
                    <span className="balance-label">Salary</span>
                    <input
                      type="number"
                      className="stat-input"
                      defaultValue={user.stats?.profitBase ?? 0}
                      key={`balance-${user.id}-${user.stats?.profitBase}`}
                      disabled={updatingId === user.id}
                      onBlur={(e) => {
                        const val = Number(e.target.value)
                        if (val !== (user.stats?.profitBase ?? 0)) {
                          handleStatChange(user.id, 'profitBase', val)
                        }
                      }}
                      title="Referral profit balance"
                    />
                    <span className="balance-label">Referral</span>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    className="stat-input"
                    defaultValue={user.stats?.totalTeam ?? 0}
                    key={`team-${user.id}-${user.stats?.totalTeam}`}
                    disabled={updatingId === user.id}
                    onBlur={(e) => {
                      const val = Number(e.target.value)
                      if (val !== (user.stats?.totalTeam ?? 0)) {
                        handleStatChange(user.id, 'totalTeam', val)
                      }
                    }}
                    title="Total team members"
                  />
                </td>
                <td><StatusBadge status={user.status} /></td>
                <td>
                  {user.uplineId === '—'
                    ? '—'
                    : users.find((u) => u.id === user.uplineId)?.referralCode ||
                      `RFC${user.uplineId}`}
                </td>
                <td>{new Date(user.joinedAt).toLocaleDateString('en-PK')}</td>
                <td>
                  <div className="user-actions">
                    {!isApprovedStatus(user.status) && user.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          className="btn-approve"
                          disabled={updatingId === user.id}
                          onClick={() => handleApprove(user.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-reject"
                          disabled={updatingId === user.id}
                          onClick={() => handleReject(user.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={updatingId === user.id}
                      onClick={() => handleDelete(user.id, user.username)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedUsers.length > 0 && (
        <div className="pagination">
          <p className="pagination-info">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, sortedUsers.length)} of{' '}
            {sortedUsers.length}
          </p>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="pagination-page">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
