'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Summary {
  balance: number
  totalDeposit: number
  totalWithdrawal: number
  totalCount: number
  startDate: string | null
  lastTransactionAt: string | null
}

interface MonthlyData {
  month: string
  deposit: number
  withdrawal: number
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${y.slice(2)}년 ${parseInt(m)}월`
}

export default function DashboardPage() {
  const [summary, setSummary]   = useState<Summary | null>(null)
  const [monthly, setMonthly]   = useState<MonthlyData[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, mRes] = await Promise.all([
          fetch('/api/summary'),
          fetch('/api/monthly'),
        ])
        const s = sRes.ok  ? await sRes.json()  : null
        const m = mRes.ok  ? await mRes.json()  : { data: [] }
        setSummary(s)
        setMonthly(m.data ?? [])
      } catch (e) {
        console.error('대시보드 데이터 로드 실패', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
          데이터 불러오는 중...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="현재 잔액"
          value={summary ? formatKRW(summary.balance) : '—'}
          sub={summary?.lastTransactionAt
            ? new Date(summary.lastTransactionAt).toLocaleDateString('ko-KR') + ' 기준'
            : ''}
          icon="💵"
          color="yellow"
        />
        <SummaryCard
          label="누적 입금 총액"
          value={summary ? formatKRW(summary.totalDeposit) : '—'}
          sub={summary ? `${summary.totalCount}건 거래` : ''}
          icon="📥"
          color="green"
        />
        <SummaryCard
          label="누적 출금 총액"
          value={summary ? formatKRW(summary.totalWithdrawal) : '—'}
          sub={summary?.startDate
            ? new Date(summary.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) + '부터'
            : ''}
          icon="📤"
          color="red"
        />
      </div>

      {/* 월별 입출금 차트 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">월별 입출금 현황</h2>

        {monthly.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthly} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                interval={2}
              />
              <YAxis
                tickFormatter={v => (v / 10000) + '만'}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                width={50}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatKRW(value),
                  name === 'deposit' ? '입금' : '출금',
                ]}
                labelFormatter={formatMonth}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Legend
                formatter={v => v === 'deposit' ? '입금' : '출금'}
                wrapperStyle={{ fontSize: 13 }}
              />
              <Bar dataKey="deposit"    name="deposit"    fill="#facc15" radius={[4,4,0,0]} />
              <Bar dataKey="withdrawal" name="withdrawal" fill="#fb923c" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 하단 인포 */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoChip label="계모임 시작" value={summary.startDate
            ? new Date(summary.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
            : '—'} />
          <InfoChip label="총 거래 건수" value={`${summary.totalCount.toLocaleString()}건`} />
          <InfoChip label="순수익 (입금 - 출금)"
            value={formatKRW(summary.totalDeposit - summary.totalWithdrawal)} />
          <InfoChip label="데이터 기간"
            value={`${monthly.length}개월`} />
        </div>
      )}

    </AppLayout>
  )
}

function SummaryCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub: string; icon: string
  color: 'yellow' | 'green' | 'red'
}) {
  const bg = { yellow: 'bg-yellow-50 text-yellow-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600' }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg ${bg[color]}`}>{icon}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  )
}
