import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const [latest, agg, count, oldest] = await Promise.all([
      prisma.transaction.findFirst({
        orderBy: { transactionAt: 'desc' },
        select: { balance: true, transactionAt: true },
      }),
      prisma.transaction.aggregate({
        _sum: { deposit: true, withdrawal: true },
      }),
      prisma.transaction.count(),
      prisma.transaction.findFirst({
        orderBy: { transactionAt: 'asc' },
        select: { transactionAt: true },
      }),
    ])

    return NextResponse.json({
      balance:           latest?.balance ?? 0,
      lastTransactionAt: latest?.transactionAt ?? null,
      totalDeposit:      agg._sum.deposit    ?? 0,
      totalWithdrawal:   agg._sum.withdrawal ?? 0,
      totalCount:        count,
      startDate:         oldest?.transactionAt ?? null,
    })
  } catch (err) {
    console.error('[summary API error]', err)
    return NextResponse.json({
      balance: 0, lastTransactionAt: null,
      totalDeposit: 0, totalWithdrawal: 0,
      totalCount: 0, startDate: null,
      error: String(err),
    }, { status: 500 })
  }
}
