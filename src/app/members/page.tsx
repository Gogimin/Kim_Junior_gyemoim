'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'

const HOUSE_LABELS: Record<number, string> = {
  1: '첫째집', 2: '둘째집', 3: '셋째집', 4: '넷째집', 5: '다섯째집',
}
// 인라인 스타일로 관리 (Tailwind purge 우회)
const HOUSE_STYLES: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },  // blue
  2: { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' },  // purple
  3: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },  // green
  4: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },  // orange
  5: { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },  // pink
}

interface Member {
  id: number
  name: string
  nickname: string | null
  monthlyFee: number
  marriedAt: string | null
  houseNumber: number | null
  joinDate: string
  isActive: boolean
}

interface DepositEntry {
  date: string
  amount: number
  description: string
}

interface MemberPayment {
  id: number
  name: string
  nickname: string | null
  monthlyFee: number
  marriedAt: string | null
  houseNumber: number | null
  joinDate: string
  singleMonths: number
  marriedMonths: number
  eligibleMonths: number
  expectedTotal: number
  depositCount: number
  totalDeposited: number
  diff: number
  deposits: DepositEntry[]
}

interface PaymentsData {
  totalMonths: number
  members: MemberPayment[]
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

// 멤버 한 명의 인라인 편집 폼
function MemberEditForm({
  member,
  onSave,
  onCancel,
}: {
  member: Member
  onSave: (data: Partial<Member>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name:        member.name,
    nickname:    member.nickname ?? '',
    monthlyFee:  String(member.monthlyFee),
    joinDate:    member.joinDate.slice(0, 10),
    houseNumber: member.houseNumber != null ? String(member.houseNumber) : '',
    isMarried:   !!member.marriedAt,
    marriedAt:   member.marriedAt ? member.marriedAt.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name:        form.name.trim(),
      nickname:    form.nickname.trim() || null,
      monthlyFee:  parseInt(form.monthlyFee) || 10000,
      joinDate:    form.joinDate,
      houseNumber: form.houseNumber ? parseInt(form.houseNumber) : null,
      marriedAt:   form.isMarried && form.marriedAt ? form.marriedAt : null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-yellow-50 border-t border-yellow-100">
      <div className="flex flex-wrap gap-2">
        {/* 이름 */}
        <div className="flex flex-col gap-1 min-w-[100px]">
          <label className="text-[10px] text-gray-400 font-medium uppercase">이름</label>
          <input required value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:border-yellow-400" />
        </div>

        {/* 적요 키워드 */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[10px] text-gray-400 font-medium uppercase">
            입금 적요 키워드 <span className="normal-case text-gray-300">(쉼표로 여러 개 가능)</span>
          </label>
          <input value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            placeholder="예: 신대성,신연우"
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:border-yellow-400" />
        </div>

        {/* 집 번호 */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label className="text-[10px] text-gray-400 font-medium uppercase">집 번호</label>
          <select value={form.houseNumber}
            onChange={e => setForm(f => ({ ...f, houseNumber: e.target.value }))}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:border-yellow-400">
            <option value="">미지정</option>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{HOUSE_LABELS[n]}</option>
            ))}
          </select>
        </div>

        {/* 월 납부액 */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label className="text-[10px] text-gray-400 font-medium uppercase">미혼 납부액</label>
          <input type="number" value={form.monthlyFee}
            onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value }))}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:border-yellow-400" />
        </div>

        {/* 참여 시작일 */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-[10px] text-gray-400 font-medium uppercase">참여 시작일</label>
          <input type="date" required value={form.joinDate}
            onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:border-yellow-400" />
        </div>
      </div>

      {/* 결혼 여부 */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={form.isMarried}
            onChange={e => setForm(f => ({ ...f, isMarried: e.target.checked, marriedAt: e.target.checked ? f.marriedAt : '' }))}
            className="w-4 h-4 accent-yellow-400" />
          <span className="text-sm text-gray-700">결혼함 (결혼 이후 20,000원/월)</span>
        </label>
        {form.isMarried && (
          <div className="flex items-center gap-3 ml-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-medium uppercase">결혼일</label>
              <input type="date" required={form.isMarried} value={form.marriedAt}
                onChange={e => setForm(f => ({ ...f, marriedAt: e.target.value }))}
                className="px-2.5 py-1.5 border border-yellow-300 rounded-lg text-sm bg-white
                           focus:outline-none focus:border-yellow-400" />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              결혼 전 {formatKRW(parseInt(form.monthlyFee) || 10000)}/월 → 결혼 후 20,000원/월
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900
                     font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? '저장 중...' : '저장'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-sm">
          취소
        </button>
      </div>
    </form>
  )
}

// ─── 메인 페이지 ───────────────────────────────────────────────────
export default function MembersPage() {
  const [data, setData]       = useState<PaymentsData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [savingAdd, setSavingAdd]         = useState(false)
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [expandedId, setExpandedId]       = useState<number | null>(null)
  const [houseFilter, setHouseFilter]     = useState<number | null>(null) // null = 전체

  // 새 멤버 추가 폼 상태
  const [addForm, setAddForm] = useState({
    name: '', nickname: '', monthlyFee: '10000', joinDate: '2022-11-01',
    houseNumber: '', isMarried: false, marriedAt: '',
  })

  async function loadAll() {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/payments'),
      ])
      const mData = mRes.ok ? await mRes.json() : { members: [] }
      const pData = pRes.ok ? await pRes.json() : { totalMonths: 0, members: [] }
      setMembers(mData.members ?? [])
      setData(pData)
    } catch (e) {
      console.error('납부 현황 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSavingAdd(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        addForm.name.trim(),
          nickname:    addForm.nickname.trim() || null,
          monthlyFee:  parseInt(addForm.monthlyFee) || 10000,
          joinDate:    addForm.joinDate,
          houseNumber: addForm.houseNumber ? parseInt(addForm.houseNumber) : null,
          marriedAt:   addForm.isMarried && addForm.marriedAt ? addForm.marriedAt : null,
        }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setAddForm({ name: '', nickname: '', monthlyFee: '10000', joinDate: '2022-11-01', houseNumber: '', isMarried: false, marriedAt: '' })
        await loadAll()
      }
    } finally {
      setSavingAdd(false)
    }
  }

  async function handleEdit(id: number, data: Partial<Member>) {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setEditingId(null)
      await loadAll()
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConfirmDeleteId(null)
      await loadAll()
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
          불러오는 중...
        </div>
      </AppLayout>
    )
  }

  const allPayData  = data?.members    ?? []
  const totalMonths = data?.totalMonths ?? 0

  // 집 필터 적용
  const payData = houseFilter === null
    ? allPayData
    : allPayData.filter(mp => mp.houseNumber === houseFilter)

  // 실제 존재하는 집 번호 목록 (멤버 기준)
  const existingHouses = Array.from(
    new Set(allPayData.map(mp => mp.houseNumber).filter(Boolean) as number[])
  ).sort()

  return (
    <AppLayout>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">납부 현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            계모임 운영 <span className="font-semibold text-gray-600">{totalMonths}개월</span> 기준
          </p>
        </div>
        <button onClick={() => setShowAddForm(v => !v)}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900
                     font-semibold rounded-xl text-sm transition-colors">
          {showAddForm ? '✕ 닫기' : '+ 멤버 추가'}
        </button>
      </div>

      {/* 집 필터 탭 */}
      {existingHouses.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setHouseFilter(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              houseFilter === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            전체 ({allPayData.length}명)
          </button>
          {existingHouses.map(hn => {
            const s     = HOUSE_STYLES[hn]
            const count = allPayData.filter(m => m.houseNumber === hn).length
            const isActive = houseFilter === hn
            return (
              <button
                key={hn}
                onClick={() => setHouseFilter(isActive ? null : hn)}
                style={isActive ? { backgroundColor: s.color, color: '#fff', borderColor: s.color } : { borderColor: s.border }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-white"
              >
                <span style={isActive ? { color: '#fff' } : { color: s.color }}>
                  {HOUSE_LABELS[hn]}
                </span>
                <span style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#9ca3af' }} className="ml-1.5 text-xs">
                  {count}명
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 새 멤버 추가 폼 */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">새 멤버 추가</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[110px]">
                <label className="text-xs text-gray-400">이름 *</label>
                <input required value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="홍길동"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-xs text-gray-400">입금 적요 키워드 <span className="text-gray-300">(쉼표로 여러 개)</span></label>
                <input value={addForm.nickname}
                  onChange={e => setAddForm(f => ({ ...f, nickname: e.target.value }))}
                  placeholder="예: 신대성,신연우"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div className="flex flex-col gap-1 min-w-[110px]">
                <label className="text-xs text-gray-400">집 번호</label>
                <select value={addForm.houseNumber}
                  onChange={e => setAddForm(f => ({ ...f, houseNumber: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 bg-white">
                  <option value="">미지정</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{HOUSE_LABELS[n]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[110px]">
                <label className="text-xs text-gray-400">미혼 납부액</label>
                <input type="number" value={addForm.monthlyFee}
                  onChange={e => setAddForm(f => ({ ...f, monthlyFee: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs text-gray-400">참여 시작일 *</label>
                <input type="date" required value={addForm.joinDate}
                  onChange={e => setAddForm(f => ({ ...f, joinDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input type="checkbox" checked={addForm.isMarried}
                  onChange={e => setAddForm(f => ({ ...f, isMarried: e.target.checked, marriedAt: '' }))}
                  className="w-4 h-4 accent-yellow-400" />
                <span className="text-sm text-gray-700">결혼함 (이후 20,000원/월)</span>
              </label>
              {addForm.isMarried && (
                <div className="ml-6 flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">결혼일</label>
                    <input type="date" required={addForm.isMarried} value={addForm.marriedAt}
                      onChange={e => setAddForm(f => ({ ...f, marriedAt: e.target.value }))}
                      className="px-3 py-2 border border-yellow-300 rounded-xl text-sm bg-yellow-50 focus:outline-none focus:border-yellow-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    결혼 전 {formatKRW(parseInt(addForm.monthlyFee)||10000)}/월 → 결혼 후 20,000원/월
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingAdd}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900
                           font-semibold rounded-xl text-sm transition-colors disabled:opacity-60">
                {savingAdd ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 멤버 없음 */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">👥</p>
          <h2 className="text-base font-semibold text-gray-600">등록된 멤버가 없습니다</h2>
          <p className="text-sm text-gray-400 mt-1">위 버튼으로 멤버를 추가해 주세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payData.map(mp => {
            const memberInfo   = members.find(m => m.id === mp.id)
            const isEditing    = editingId === mp.id
            const isExpanded   = expandedId === mp.id
            const isConfirming = confirmDeleteId === mp.id
            const paidPct      = mp.expectedTotal > 0
              ? Math.min(100, Math.round((mp.totalDeposited / mp.expectedTotal) * 100)) : 0
            const diffColor = mp.diff >= 0 ? 'text-green-600' : 'text-red-500'
            const hn        = mp.houseNumber

            return (
              <div key={mp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* 카드 본문 */}
                <div className="px-5 py-4">
                  {/* 이름 행 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{mp.name}</span>
                      {hn && HOUSE_STYLES[hn] && (
                        <span
                          style={{
                            backgroundColor: HOUSE_STYLES[hn].bg,
                            color: HOUSE_STYLES[hn].color,
                            border: `1px solid ${HOUSE_STYLES[hn].border}`,
                          }}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                        >
                          {HOUSE_LABELS[hn]}
                        </span>
                      )}
                      {mp.marriedAt && (
                        <span className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">
                          💍 결혼
                        </span>
                      )}
                      {mp.nickname && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          적요: {mp.nickname}
                        </span>
                      )}
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isConfirming ? (
                        <>
                          <span className="text-xs text-gray-500 mr-1">삭제할까요?</span>
                          <button onClick={() => handleDelete(mp.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors">
                            삭제
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition-colors">
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(isEditing ? null : mp.id); setConfirmDeleteId(null) }}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              isEditing
                                ? 'bg-yellow-100 text-yellow-700 font-semibold'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}>
                            {isEditing ? '✕ 닫기' : '수정'}
                          </button>
                          <button onClick={() => { setConfirmDeleteId(mp.id); setEditingId(null) }}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 서브 텍스트 */}
                  <p className="text-xs text-gray-400 mb-3">
                    참여 {mp.eligibleMonths}개월
                    {mp.marriedAt && mp.singleMonths > 0
                      ? ` · 미혼 ${mp.singleMonths}개월(${formatKRW(mp.monthlyFee)}) + 결혼 ${mp.marriedMonths}개월(20,000원)`
                      : ` · ${formatKRW(mp.monthlyFee)}/월`}
                  </p>

                  {/* 수치 3칸 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 mb-1">총 입금액</p>
                      <p className="font-bold text-gray-900 text-sm">{formatKRW(mp.totalDeposited)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mp.depositCount}건</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 mb-1">예상 납부액</p>
                      <p className="font-bold text-gray-700 text-sm">{formatKRW(mp.expectedTotal)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {mp.marriedAt
                          ? `미혼 ${mp.singleMonths} + 결혼 ${mp.marriedMonths}개월`
                          : `${mp.eligibleMonths}개월 × ${formatKRW(mp.monthlyFee)}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 mb-1">차액</p>
                      <p className={`font-bold text-sm ${diffColor}`}>
                        {mp.diff >= 0 ? '+' : ''}{formatKRW(mp.diff)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mp.diff >= 0 ? '완납/과납' : '미납'}</p>
                    </div>
                  </div>

                  {/* 진행 바 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">납부율</span>
                      <span className={`text-[10px] font-semibold ${
                        paidPct >= 100 ? 'text-green-600' : paidPct >= 80 ? 'text-yellow-500' : 'text-red-500'
                      }`}>{paidPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        paidPct >= 100 ? 'bg-green-400' : paidPct >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} style={{ width: `${Math.min(paidPct, 100)}%` }} />
                    </div>
                  </div>

                  <button onClick={() => setExpandedId(isExpanded ? null : mp.id)}
                    className="mt-3 text-xs text-gray-400 hover:text-yellow-500 transition-colors">
                    {isExpanded ? '▲ 입금 내역 접기' : `▼ 입금 내역 보기 (${mp.depositCount}건)`}
                  </button>
                </div>

                {/* 인라인 수정 폼 */}
                {isEditing && memberInfo && (
                  <MemberEditForm
                    member={memberInfo}
                    onSave={data => handleEdit(mp.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                )}

                {/* 입금 내역 */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-gray-50 max-h-64 overflow-y-auto">
                    {mp.deposits.length === 0 ? (
                      <p className="text-center py-6 text-xs text-gray-400">
                        매핑된 입금 내역이 없습니다. 입금 적요 키워드를 설정해 주세요.
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] text-gray-400">
                            <th className="px-4 py-2 text-left font-medium">날짜</th>
                            <th className="px-4 py-2 text-left font-medium">내용</th>
                            <th className="px-4 py-2 text-right font-medium text-green-600">입금액</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {mp.deposits.map((d, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{d.date}</td>
                              <td className="px-4 py-2 text-gray-600">{d.description}</td>
                              <td className="px-4 py-2 text-right font-semibold text-green-600">
                                +{d.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
