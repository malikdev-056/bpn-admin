import { useEffect } from 'react'
import './ReceiptModal.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function resolveScreenshotUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE.replace(/\/api$/, '')}${path}`
}

function statusIcon(status) {
  if (status === 'approved') return '✓'
  if (status === 'rejected') return '✕'
  return '⏳'
}

function statusClass(status) {
  if (status === 'approved') return 'status-approved'
  if (status === 'rejected') return 'status-rejected'
  return 'status-pending'
}

function statusValueClass(status) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

/**
 * ReceiptModal — shows a stylized receipt card for a request or payment.
 *
 * Props:
 *   item      – the request or payment object
 *   type      – 'request' | 'payment'
 *   onClose   – callback to close the modal
 */
export default function ReceiptModal({ item, type, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!item) return null

  const isWithdraw = type === 'request' && item.type === 'withdraw'
  const isPayment  = type === 'payment'
  const isReward   = type === 'request' && item.type === 'reward'

  // ── Title ──────────────────────────────────────────────────────────────
  let title = 'Receipt'
  if (isWithdraw) title = 'Withdrawal Receipt'
  else if (isPayment) title = 'Deposit Receipt'
  else if (item.category === 'starReward')
    title = `⭐ Star ${item.starNumber} Reward`
  else if (item.category === 'referralPartnerBonus') title = 'Referral Bonus'
  else if (item.category === 'teamBonus') title = 'Team Bonus'
  else if (isReward) title = 'Reward Receipt'

  const sc = statusClass(item.status)
  const vc = statusValueClass(item.status)

  const screenshotUrl = resolveScreenshotUrl(item.screenshotPath)

  return (
    <div className="receipt-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="receipt-card" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="receipt-close" onClick={onClose} aria-label="Close receipt">×</button>

        {/* Header */}
        <div className="receipt-head">
          <div className={`receipt-icon-wrap ${sc}`}>
            {statusIcon(item.status)}
          </div>
          <span className="receipt-type-title">{title}</span>
          <span className={`receipt-status-label ${sc}`}>{item.status}</span>
        </div>

        {/* Body rows */}
        <div className="receipt-body">

          {/* User */}
          <div className="receipt-row">
            <span className="receipt-row-label">User</span>
            <span className="receipt-row-value">{item.user?.username || 'Unknown'}</span>
          </div>

          {/* Date */}
          <div className="receipt-row">
            <span className="receipt-row-label">Date</span>
            <span className="receipt-row-value">{fmt(item.createdAt)}</span>
          </div>

          {/* Amount */}
          <div className="receipt-row">
            <span className="receipt-row-label">Amount</span>
            <span className="receipt-row-value amount">
              Rs. {Number(item.amount || 0).toLocaleString('en-PK')}
            </span>
          </div>

          {/* ── Withdraw-specific ── */}
          {isWithdraw && (
            <>
              <div className="receipt-row">
                <span className="receipt-row-label">Payment Method</span>
                <span className="receipt-row-value">{item.accountType || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Account Number</span>
                <span className="receipt-row-value">{item.accountNumber || item.accountNumber || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Account Title</span>
                <span className="receipt-row-value">{item.accountTitle || '—'}</span>
              </div>
            </>
          )}

          {/* ── Payment (deposit)-specific ── */}
          {isPayment && (
            <>
              <div className="receipt-row">
                <span className="receipt-row-label">Plan Level</span>
                <span className="receipt-row-value">Level {item.level}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Account Type</span>
                <span className="receipt-row-value">{item.accountType || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Sender Account</span>
                <span className="receipt-row-value">{item.senderAccountNumber || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Account Title</span>
                <span className="receipt-row-value">{item.senderAccountTitle || '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Transaction ID</span>
                <span className="receipt-row-value">{item.transactionId || '—'}</span>
              </div>
            </>
          )}

          {/* ── Star Reward specific ── */}
          {isReward && item.category === 'starReward' && (
            <>
              <div className="receipt-row">
                <span className="receipt-row-label">Star</span>
                <span className="receipt-row-value">
                  ⭐ Star {item.starNumber} — {item.starTitle || '—'}
                </span>
              </div>
              {item.membersAtClaim != null && (
                <div className="receipt-row">
                  <span className="receipt-row-label">Team at Claim</span>
                  <span className="receipt-row-value">{item.membersAtClaim} members</span>
                </div>
              )}
            </>
          )}

          {/* ── Referral Partner Bonus specific ── */}
          {isReward && item.category === 'referralPartnerBonus' && (
            <>
              <div className="receipt-row">
                <span className="receipt-row-label">Partners at Claim</span>
                <span className="receipt-row-value">{item.partnersAtClaim ?? '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-row-label">Milestones</span>
                <span className="receipt-row-value">{item.milestoneCount ?? 1}</span>
              </div>
            </>
          )}

          {/* Reviewed date */}
          {item.reviewedAt && (
            <div className="receipt-row">
              <span className="receipt-row-label">
                {item.autoApproved ? 'Auto Processed' : 'Reviewed On'}
              </span>
              <span className="receipt-row-value">{fmt(item.reviewedAt)}</span>
            </div>
          )}

          {/* Status */}
          <div className="receipt-row">
            <span className="receipt-row-label">Status</span>
            <span className={`receipt-row-value ${vc}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Screenshot thumbnail (payments) */}
        {screenshotUrl && (
          <>
            <a
              className="receipt-screenshot-wrap"
              href={screenshotUrl}
              target="_blank"
              rel="noreferrer"
              title="Open full screenshot"
            >
              <img src={screenshotUrl} alt="Payment screenshot" />
            </a>
            <p className="receipt-screenshot-label">Tap screenshot to view full size</p>
          </>
        )}

        {/* Footer */}
        <div className="receipt-footer">
          Thank you for using <strong>BPN Pakistan</strong>
        </div>
      </div>
    </div>
  )
}
