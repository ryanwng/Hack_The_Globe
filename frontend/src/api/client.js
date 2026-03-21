const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const payload = await response.json()
      detail = payload?.detail || payload?.message || detail
    } catch {
      // Ignore parse errors and keep default detail.
    }
    throw new Error(detail)
  }
  return response.json()
}

export function listScenarios() {
  return request('/v1/scenarios')
}

export function createSession(payload) {
  return request('/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function createTurn(sessionId, payload) {
  return request(`/v1/sessions/${sessionId}/turns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getHint(sessionId, payload) {
  return request(`/v1/sessions/${sessionId}/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function completeSession(sessionId) {
  return request(`/v1/sessions/${sessionId}/complete`, {
    method: 'POST',
  })
}

export { API_BASE_URL }
