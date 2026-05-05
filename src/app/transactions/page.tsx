'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import AppLayout from '@/components/AppLayout'

interface Transaction {
  id: number
  transactionAt: string
  description: string
  deposit: number
  withdrawal: number
  balance: number
  memo: string | null
  txType: string
  member:   { name: string } | null
  category: { name: string; color: string } | null
}

function formatKRW(n: number) {
  return n === 0 ? '—' : n.toLocaleString('ko-KR') + '원'
}

// ─── 메모 인라인 편집 셀 ───────────────────────────────────────────
function MemoCell({ tx, onSaved }: {
  tx: Transaction
  onSaved: (id: number, memo: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue]     = useState(tx.memo ?? '')
  const [saving, setSaving]   = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(tx.memo ?? '')
  }, [tx.memo])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: value }),
      })
      if (res.ok) {
        const trimmed = value.trim() || null
        onSaved(tx.id, trimmed)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); save() }
    if (e.key === 'Escape') { setValue(tx.memo ?? ''); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={save}
        placeholder="메모 입력 후 Enter"
        className="w-36 px-2 py-1 border border-yellow-300 rounded-lg text-xs
                   focus:outline-none focus:border-yellow-400 bg-yellow-50"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="클릭하여 메모 입력/수정"
      className="group flex items-center gap-1.5 text-left max-w-[180px]"
    >
      {tx.category && (
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: tx.category.color }}>
          {tx.category.name}
        </span>
      )}
      {tx.memo ? (
        <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-lg truncate
                         group-hover:bg-yellow-50 group-hover:text-yellow-700 transition-colors">
          {tx.memo}
        </span>
      ) : (
        <span className="text-xs text-gray-300 group-hover:text-yellow-400 transition-colors whitespace-nowrap">
          {tx.category ? '+ 메모' : '✏️ 메모 추가'}
        </span>
      )}
    </button>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────
export default function TransactionsPage() {
  const [items, setItems]           = useState<Transaction[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [depositSum, setDepositSum]         = useState(0)
  const [withdrawalSum, setWithdrawalSum]   = useState(0)

  const [type, setType]                   = useState('')
  const [keyword, setKeyword]             = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [inputKeyword, setInputKeyword]   = useState('')

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '50' })
    if (type)     params.set('type', type)
    if (keyword)  params.set('keyword', keyword)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo)   params.set('to', dateTo)

    const res  = await fetch(`/api/transactions?${params}`)
    const data = await res.json()
    setItems(data.transactions ?? [])
    setTotal(data.total ?? 0)
    setPage(data.page ?? 1)
    setTotalPages(data.totalPages ?? 1)
    setDepositSum(data.totalDepositSum ?? 0)
    setWithdrawalSum(data.totalWithdrawalSum ?? 0)
    setLoading(false)
  }, [type, keyword, dateFrom, dateTo])

  useEffect(() => { fetchData(1) }, [fetchData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setKeyword(inputKeyword)
  }

  function handleReset() {
    setType(''); setKeyword(''); setInputKeyword('')
    setDateFrom(''); setDateTo('')
  }

  // 메모 저장 후 리패치 없이 로컬 state 업데이트
  function handleMemoSaved(id: number, memo: string | null) {
    setItems(prev => prev.map(tx => tx.id === id ? { ...tx, memo } : tx))
  }

  return (
    <AppLayout>

      {/* 필터 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[['', '전체'], ['deposit', '입금'], ['withdrawal', '출금']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setType(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${type === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-1 min-w-[200px]">
            <input
              value={inputKeyword}
              onChange={e => setInputKeyword(e.target.value)}
              placeholder="거래내용 검색..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <button type="submit"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900
                         font-semibold rounded-xl text-sm transition-colors">
              검색
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
            <span className="text-gray-400 text-sm">~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
          </div>

          <button type="button" onClick={handleReset}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors">
            초기화
          </button>
        </form>
      </div>

      {/* 결과 수 + 합계 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{total.toLocaleString()}건</span>
          </span>
          {(depositSum > 0 || withdrawalSum > 0) && (
            <>
              <span className="text-gray-200">|</span>
              {depositSum > 0 && (
                <span className="text-sm">
                  입금 합계 <span className="font-semibold text-green-600">+{depositSum.toLocaleString()}원</span>
                </span>
              )}
              {withdrawalSum > 0 && (
                <span className="text-sm">
                  출금 합계 <span className="font-semibold text-orange-500">-{withdrawalSum.toLocaleString()}원</span>
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{page} / {totalPages} 페이지</span>
          <span className="text-xs text-blue-400">✏️ 메모 칸 클릭 시 편집</span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">조건에 맞는 거래가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium">일시</th>
                  <th className="px-4 py-3 text-left font-medium">내용</th>
                  <th className="px-4 py-3 text-right font-medium text-green-600">입금</th>
                  <th className="px-4 py-3 text-right font-medium text-orange-500">출금</th>
                  <th className="px-4 py-3 text-right font-medium">잔액</th>
                  <th className="px-4 py-3 text-left font-medium">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.transactionAt).toLocaleDateString('ko-KR', {
                        year: '2-digit', month: '2-digit', day: '2-digit',
                      })}
                      <span className="ml-1 text-gray-300">
                        {new Date(tx.transactionAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{tx.description || '—'}</span>
                      {tx.member && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                          {tx.member.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {tx.deposit > 0 ? '+' + tx.deposit.toLocaleString() : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-500">
                      {tx.withdrawal > 0 ? '-' + tx.withdrawal.toLocaleString() : ''}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs">
                      {tx.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <MemoCell tx={tx} onSaved={handleMemoSaved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600
                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← 이전
          </button>
          <span className="text-sm text-gray-500 px-2">{page} / {totalPages}</span>
          <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600
                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            다음 →
          </button>
        </div>
      )}
    </AppLayout>
  )
}
