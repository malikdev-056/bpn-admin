import { useState, useEffect } from 'react'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import './PaymentsPage.css'

function PaymentStatusBadge({ status }) {
  return <span className={`payment-badge ${status}`}>{status}</span>
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  async function loadPayments() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPayments()
      setPayments(data.payments)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  async function handleAction(paymentId, status) {
    setUpdatingId(paymentId)
    try {
      const data = await api.updatePayment(paymentId, { status })
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? data.payment : p)),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="page-loading">Loading payments...</p>

  const pendingCount = payments.filter((p) => p.status === 'pending').length

  return (
    <div className="payments-page">
      <header className="page-header">
        <h2>Payments</h2>
        <p>{pendingCount} pending review</p>
      </header>

      {error && <div className="page-alert">{error}</div>}

      <div className="payments-list">
        {payments.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No payments yet"
            description="Payment submissions from new registrations will appear here for review."
          />
        ) : (
          payments.map((payment) => (
            <article key={payment.id} className="payment-card">
              <div className="payment-header">
                <div>
                  <h3>
                    {payment.user?.username || 'Unknown user'}
                    <span className="payment-id">#{payment.id}</span>
                  </h3>
                  <p className="payment-meta">
                    {payment.user?.email} · Level {payment.level} · Rs. {payment.amount.toLocaleString('en-PK')}
                  </p>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>

              <div className="payment-details">
                <div>
                  <span>Sender Account</span>
                  <strong>{payment.senderAccountNumber}</strong>
                </div>
                <div>
                  <span>Account Title</span>
                  <strong>{payment.senderAccountTitle}</strong>
                </div>
                <div>
                  <span>Transaction ID</span>
                  <strong>{payment.transactionId}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>{new Date(payment.createdAt).toLocaleString('en-PK')}</strong>
                </div>
              </div>

              <div className="payment-actions">
                {payment.screenshotPath && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPreviewUrl(payment.screenshotPath)}
                  >
                    View Screenshot
                  </button>
                )}

                {payment.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={updatingId === payment.id}
                      onClick={() => handleAction(payment.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={updatingId === payment.id}
                      onClick={() => handleAction(payment.id, 'rejected')}
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

      {previewUrl && (
        <div className="screenshot-modal" onClick={() => setPreviewUrl(null)}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
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
