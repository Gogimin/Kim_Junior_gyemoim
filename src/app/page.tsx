'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => { if (data.authenticated) window.location.href = '/dashboard' })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '접근 키가 올바르지 않습니다.')
        setLoading(false)
      }
    } catch {
      setError('서버에 연결할 수 없습니다.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-3xl shadow-lg mb-4">
            <span className="text-4xl">🏦</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">계모임 통장 관리</h1>
          <p className="text-sm text-gray-500 mt-1">가족 전용 서비스</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                접근 키
              </label>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="접근 키를 입력하세요"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:border-yellow-400 transition-colors"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !key}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50
                         disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-4
                         rounded-xl transition-colors text-sm"
            >
              {loading ? '확인 중...' : '입장하기'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          가족 외 무단 접근을 금지합니다.
        </p>
      </div>
    </main>
  )
}
