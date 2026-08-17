import { useState, useEffect } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import ReceiptModal from '../components/ReceiptModal'
import './RequestsPage.css'

const TABS = [
  { id: 'withdraw', label: 'Withdraw', icon: '💸' },
  { id: 'reward', label: 'Reward & Bonus', icon: '🎁' },
]

const CATEGORY_LABELS = {
  profitBase: 'Profit Base',
  profitTrinity: 'Profit Trinity',
  teamBonus: 'Team Reward (100 members)',
  referralPartnerBonus: 'Referral Partner Bonus',
  starReward: 'Star Reward',
}

function requestLabel(request) {
  if (request.type === 'withdraw') return 'Withdrawal'
  if (request.type === 'bonus') return 'Team Reward'
  if (request.category === 'teamBonus') return 'Team Reward'
  if (request.category === 'starReward') {
    return `⭐ Star ${request.starNumber} — ${request.starTitle || 'Star Reward'}`
  }
  if (request.category) return CATEGORY_LABELS[request.category] || 'Reward'
  return 'Reward'
}

function StatusBadge({ status, autoApproved }) {
  if (autoApproved && status === 'approved') {
    return <span className="request-badge auto-approved">Auto Approved</span>
  }
  return <span className={`request-badge ${status}`}>{status}</span>
}

export default function RequestsPage() {
  const [tab, setTab] = useState('withdraw')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [receiptItem, setReceiptItem] = useState(null)

  async function loadRequests(type) {
    setLoading(true)
    setError('')
    try {
      const data = await api.getRequests(type)
      setRequests(data.requests)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests(tab)
  }, [tab])

  async function handleAction(requestId, status) {
    setUpdatingId(requestId)
    try {
      const data = await api.updateRequest(requestId, { status })
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? data.request : r)),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const tabLabel = TABS.find((t) => t.id === tab)?.label.toLowerCase()

  return (
    <div className="requests-page">
      <header className="page-header">
        <h2>Requests</h2>
        <p>{pendingCount} pending {tabLabel} requests</p>
      </header>

      <div className="request-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`request-tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="page-alert">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading requests...</p>
      ) : (
        <div className="requests-list">
          {requests.length === 0 ? (
            <EmptyState
              icon={tab === 'withdraw' ? '💸' : '🎁'}
              title={`No ${tabLabel} requests yet`}
              description={
                tab === 'withdraw'
                  ? 'Withdrawal requests from users will show up here once they submit them.'
                  : 'Reward and bonus claims will appear here when users request them.'
              }
            />
          ) : (
            requests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>
                      {request.user?.username || 'Unknown user'}
                      <span className="request-id">#{request.id}</span>
                    </h3>
                    <p className="request-meta">
                      {request.user?.email} · {requestLabel(request)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} autoApproved={request.autoApproved} />
                </div>

                <div className="request-details">
                  <div>
                    <span>Amount</span>
                    <strong>Rs. {request.amount.toLocaleString('en-PK')}</strong>
                  </div>

                  {request.type === 'withdraw' && (
                    <>
                      <div>
                        <span>Account Type</span>
                        <strong>{request.accountType || '—'}</strong>
                      </div>
                      <div>
                        <span>Account Number</span>
                        <strong>{request.accountNumber}</strong>
                      </div>
                      <div>
                        <span>Account Title</span>
                        <strong>{request.accountTitle}</strong>
                      </div>
                    </>
                  )}

                  {(request.category === 'teamBonus' || request.type === 'bonus') &&
                    request.teamSize != null && (
                    <div>
                      <span>Team Size</span>
                      <strong>{request.teamSize} members</strong>
                    </div>
                  )}

                  {request.category === 'referralPartnerBonus' && (
                    <>
                      <div>
                        <span>Partners at Claim</span>
                        <strong>{request.partnersAtClaim ?? '—'}</strong>
                      </div>
                      <div>
                        <span>Milestones</span>
                        <strong>{request.milestoneCount ?? 1}</strong>
                      </div>
                    </>
                  )}

                  {request.category === 'starReward' && (
                    <>
                      <div>
                        <span>Star</span>
                        <strong>⭐ Star {request.starNumber} — {request.starTitle || '—'}</strong>
                      </div>
                      {request.membersAtClaim != null && (
                        <div>
                          <span>Team Size at Claim</span>
                          <strong>{request.membersAtClaim} members</strong>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <span>Submitted</span>
                    <strong>{new Date(request.createdAt).toLocaleString('en-PK')}</strong>
                  </div>

                  {request.reviewedAt && (
                    <div>
                      <span>{request.autoApproved ? 'Auto Processed' : 'Reviewed'}</span>
                      <strong>{new Date(request.reviewedAt).toLocaleString('en-PK')}</strong>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button
                    type="button"
                    className="btn-receipt"
                    onClick={() => setReceiptItem(request)}
                  >
                    View Receipt
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn-approve"
                        disabled={updatingId === request.id}
                        onClick={() => handleAction(request.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        disabled={updatingId === request.id}
                        onClick={() => handleAction(request.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}
      {receiptItem && (
        <ReceiptModal
          item={receiptItem}
          type="request"
          onClose={() => setReceiptItem(null)}
        />
      )}
    </div>
  )
}
