import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    // 전체 거래 내역 조회 후 JS에서 월별 집계 (raw SQL 대신)
    const transactions = await prisma.transaction.findMany({
      select: { transactionAt: true, deposit: true, withdrawal: true },
      orderBy: { transactionAt: 'asc' },
    })

    // 월별 집계 Map
    const map = new Map<string, { deposit: number; withdrawal: number }>()

    for (const tx of transactions) {
      // "YYYY-MM" 형태로 변환 (KST 기준)
      const d = new Date(tx.transactionAt)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const prev = map.get(month) ?? { deposit: 0, withdrawal: 0 }
      map.set(month, {
        deposit:    prev.deposit    + tx.deposit,
        withdrawal: prev.withdrawal + tx.withdrawal,
      })
    }

    const data = Array.from(map.entries()).map(([month, v]) => ({
      month,
      deposit:    v.deposit,
      withdrawal: v.withdrawal,
    }))

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[monthly API error]', err)
    return NextResponse.json({ data: [], error: String(err) }, { status: 500 })
  }
}
