import { api, getToken, setToken, clearToken } from '../api/client.js'

export async function loginAdmin(email, password) {
  try {
    const data = await api.login({ email, password })
    setToken(data.token)
    return { ok: true, admin: data.admin }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function getSessionAdmin() {
  if (!getToken()) return null

  try {
    const data = await api.me()
    return data.admin
  } catch {
    clearToken()
    return null
  }
}

export function logoutAdmin() {
  clearToken()
}
