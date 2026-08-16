import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import AdminLayout from './components/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import PaymentsPage from './pages/PaymentsPage'
import RequestsPage from './pages/RequestsPage'
import SalaryPage from './pages/SalaryPage'
import PlanHistoryPage from './pages/PlanHistoryPage'
import UpgradeRequestsPage from './pages/UpgradeRequestsPage';
import WalletSalaryPage from './pages/WalletSalaryPage'
import { getSessionAdmin, logoutAdmin } from './utils/auth'
import './App.css'

export default function App() {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    getSessionAdmin().then((sessionAdmin) => {
      setAdmin(sessionAdmin)
      setLoading(false)
    })
  }, [])

  function handleLogin(loggedInAdmin) {
    setAdmin(loggedInAdmin)
    setPage('dashboard')
  }

  function handleLogout() {
    logoutAdmin()
    setAdmin(null)
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>
  }

  if (!admin) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <AdminLayout
      admin={admin}
      page={page}
      onNavigate={setPage}
      onLogout={handleLogout}
    >
      {page === 'dashboard' && <DashboardPage />}
      {page === 'users' && <UsersPage />}
      {page === 'payments' && <PaymentsPage />}
      {page === 'requests' && <RequestsPage />}
      {page === 'salary' && <SalaryPage />}
      {page === 'wallet-salary' && <WalletSalaryPage />}
      {page === 'plan-history' && <PlanHistoryPage />}
      {page === 'upgrade-requests' && <UpgradeRequestsPage />}
    </AdminLayout>
  );
}
