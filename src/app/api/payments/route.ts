import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payments
 *
 * 멤버별 총 입금액 vs 예상 납부액 (결혼 시점에 따라 가변)
 *
 * 납부 기준:
 *  - 미혼 기간  : monthlyFee (기본 10,000원)
 *  - 결혼 이후  : 20,000원 (배우자 포함)
 *
 * {
 *   totalMonths: 42,
 *   members: [{
 *     id, name, nickname, monthlyFee, joinDate, marriedAt,
 *     singleMonths,    // 미혼 납부 개월 수
 *     marriedMonths,   // 결혼 후 납부 개월 수
 *     eligibleMonths,
 *     expectedTotal,
 *     depositCount,
 *     totalDeposited,
 *     diff,
 *     deposits: [{ date, amount, description }]
 *   }]
 * }
 */

const MARRIED_FEE = 20000  // 결혼 후 고정 납부액

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const [members, allTx, deposits] = await Promise.all([
      prisma.member.findMany({
        where: { isActive: true },
        orderBy: [{ houseNumber: 'asc' }, { joinDate: 'asc' }],
      }),
      prisma.transaction.findMany({
        select: { transactionAt: true },
        orderBy: { transactionAt: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { deposit: { gt: 0 } },
        select: {
          transactionAt: true,
          deposit: true,
          description: true,
          memberId: true,
        },
        orderBy: { transactionAt: 'asc' },
      }),
    ])

    if (allTx.length === 0) {
      return NextResponse.json({ totalMonths: 0, members: [] })
    }

    const firstDate = new Date(allTx[0].transactionAt)
    const lastDate  = new Date(allTx[allTx.length - 1].transactionAt)

    const totalMonths =
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (lastDate.getMonth()    - firstDate.getMonth()) + 1

    // 멤버별 입금 집계
    const memberDeposits = new Map<number, { date: string; amount: number; description: string }[]>()
    for (const m of members) memberDeposits.set(m.id, [])

    for (const tx of deposits) {
      const dateStr = new Date(tx.transactionAt).toISOString().slice(0, 10)

      if (tx.memberId && memberDeposits.has(tx.memberId)) {
        memberDeposits.get(tx.memberId)!.push({
          date: dateStr, amount: tx.deposit, description: tx.description,
        })
        continue
      }

      const desc = (tx.description ?? '').toLowerCase()
      for (const m of members) {
        // 쉼표로 구분된 복수 키워드 지원 (예: "신대성,신연우")
        const rawKeyword = m.nickname || m.name
        const keywords   = rawKeyword.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
        const matched    = keywords.some(kw => desc.includes(kw))
        if (matched) {
          memberDeposits.get(m.id)!.push({
            date: dateStr, amount: tx.deposit, description: tx.description,
          })
          break
        }
      }
    }

    // 결과 조립
    const result = members.map(m => {
      const joinDate   = new Date(m.joinDate)
      const marriedAt  = m.marriedAt ? new Date(m.marriedAt) : null
      const singleFee  = m.monthlyFee  // 미혼 기준 납부액 (기본 10,000)

      // 월별로 순회하며 예상 납부액 누계
      let expectedTotal  = 0
      let singleMonths   = 0
      let marriedMonths  = 0
      let eligibleMonths = 0

      const cur = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)
      const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)

      while (cur <= end) {
        const isMarried = marriedAt !== null && cur >= new Date(marriedAt.getFullYear(), marriedAt.getMonth(), 1)
        if (isMarried) {
          expectedTotal += MARRIED_FEE
          marriedMonths++
        } else {
          expectedTotal += singleFee
          singleMonths++
        }
        eligibleMonths++
        cur.setMonth(cur.getMonth() + 1)
      }

      const txList         = memberDeposits.get(m.id) ?? []
      const totalDeposited = txList.reduce((s, t) => s + t.amount, 0)

      return {
        id:             m.id,
        name:           m.name,
        nickname:       m.nickname,
        monthlyFee:     singleFee,
        marriedAt:      m.marriedAt,
        houseNumber:    m.houseNumber,
        joinDate:       m.joinDate,
        singleMonths,
        marriedMonths,
        eligibleMonths,
        expectedTotal,
        depositCount:   txList.length,
        totalDeposited,
        diff:           totalDeposited - expectedTotal,
        deposits:       txList,
      }
    })

    return NextResponse.json({ totalMonths, members: result })
  } catch (err) {
    console.error('[payments GET error]', err)
    return NextResponse.json({ totalMonths: 0, members: [], error: String(err) }, { status: 500 })
  }
}
