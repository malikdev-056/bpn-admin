// In dev, always use the Vite proxy (/api) to avoid CORS. In production, use relative /api (Vercel rewrite).
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'vortexa_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = { ...options.headers }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData || typeof options.body === 'string'
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  })

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'Admin API not found. Restart the backend server (npm run dev in backend folder).'
          : `Server error (${res.status}). Make sure the backend is running on port 5000.`,
      )
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

export const api = {
  login: (body) => request('/admin/login', { method: 'POST', body }),
  me: () => request('/admin/me'),
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getPayments: () => request('/admin/payments'),
  updatePayment: (id, body) => request(`/admin/payments/${id}`, { method: 'PATCH', body }),
  getRequests: (type) =>
    request(type ? `/admin/requests?type=${type}` : '/admin/requests'),
  updateRequest: (id, body) => request(`/admin/requests/${id}`, { method: 'PATCH', body }),
  getSalaryStatus: () => request('/admin/salary/status'),
  startSalaryCycle: (cycleId) =>
    request('/admin/salary/start', { method: 'POST', body: { cycleId } }),
  distributeSalary: (cycleId) =>
    request('/admin/salary/distribute', { method: 'POST', body: { cycleId } }),
  resetSalarySession: () => request('/admin/salary/reset', { method: 'POST' }),
  getPlanHistory: () => request('/admin/plans/history'),
  getWalletTransactions: (query = '') => request(`/admin/wallet/transactions${query}`),
}
