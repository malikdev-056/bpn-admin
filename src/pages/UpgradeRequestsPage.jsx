import { useState, useEffect } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './UpgradeRequestsPage.css'

function StatusBadge({ status }) {
  return <span className={`upgrade-req-badge ${status}`}>{status}</span>
}

export default function UpgradeRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  async function loadRequests() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getRequests('upgrade')
      setRequests(data.requests)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

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

  return (
    <div className="upgrade-requests-page">
      <header className="page-header">
        <h2>Upgrade Plan Requests</h2>
        <p>{pendingCount} pending upgrade requests</p>
      </header>

      {error && <div className="page-alert">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading upgrade requests...</p>
      ) : (
        <div className="upgrade-requests-list">
          {requests.length === 0 ? (
            <EmptyState
              icon="⬆️"
              title="No upgrade requests yet"
              description="When users submit plan upgrade requests from their dashboard, they will appear here."
            />
          ) : (
            requests.map((request) => (
              <article key={request.id} className="upgrade-request-card">
                <div className="upgrade-request-header">
                  <div>
                    <h3>
                      {request.user?.username || 'Unknown user'}
                      <span className="upgrade-request-id">#{request.id}</span>
                    </h3>
                    <p className="upgrade-request-meta">
                      {request.user?.email} · Level {request.fromLevel} → Level {request.targetLevel}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="upgrade-request-details">
                  <div>
                    <span>Current Plan</span>
                    <strong>Level {request.fromLevel}</strong>
                  </div>
                  <div>
                    <span>Upgrade To</span>
                    <strong>Level {request.targetLevel}</strong>
                  </div>
                  <div>
                    <span>Amount</span>
                    <strong>Rs. {request.amount.toLocaleString('en-PK')}</strong>
                  </div>
                  <div>
                    <span>Account Type</span>
                    <strong>{request.accountType || '—'}</strong>
                  </div>
                  <div>
                    <span>Sender Account</span>
                    <strong>{request.senderAccountNumber}</strong>
                  </div>
                  <div>
                    <span>Account Title</span>
                    <strong>{request.senderAccountTitle}</strong>
                  </div>
                  <div>
                    <span>Transaction ID</span>
                    <strong>{request.transactionId}</strong>
                  </div>
                  <div>
                    <span>Submitted</span>
                    <strong>{new Date(request.createdAt).toLocaleString('en-PK')}</strong>
                  </div>
                  {request.reviewedAt && (
                    <div>
                      <span>Reviewed</span>
                      <strong>{new Date(request.reviewedAt).toLocaleString('en-PK')}</strong>
                    </div>
                  )}
                </div>

                <div className="upgrade-request-actions">
                  {request.screenshotPath && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setPreviewUrl(request.screenshotPath)}
                    >
                      View Screenshot
                    </button>
                  )}

                  {request.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn-approve"
                        disabled={updatingId === request.id}
                        onClick={() => handleAction(request.id, 'approved')}
                      >
                        Approve Upgrade
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

      {previewUrl && (
        <div className="upgrade-screenshot-modal" onClick={() => setPreviewUrl(null)}>
          <div className="upgrade-screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setPreviewUrl(null)}>
              ×
            </button>
            <img src={previewUrl} alt="Payment screenshot" />
          </div>
        </div>
      )}
    </div>
  )
}
