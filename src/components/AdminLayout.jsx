import './AdminLayout.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'requests', label: 'Requests', icon: '📋' },
  { id: 'salary', label: 'Salary', icon: '💰' },
  { id: 'wallet-salary', label: 'Wallet Salary', icon: '👛' },
  { id: 'plan-history', label: 'Plan History', icon: '📊' },
  { id: 'upgrade-requests', label: 'Upgrade Requests', icon: '⬆️' },
];

export default function AdminLayout({ admin, page, onNavigate, onLogout, children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">B</div>
          <div>
            <h1>BPN Admin</h1>
            <p>Control Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="admin-email">{admin.email}</p>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
