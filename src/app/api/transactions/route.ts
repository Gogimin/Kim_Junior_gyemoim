import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const type     = searchParams.get('type')    // 'deposit' | 'withdrawal' | null
  const keyword  = searchParams.get('keyword') // 거래내용 검색
  const dateFrom = searchParams.get('from')    // YYYY-MM-DD
  const dateTo   = searchParams.get('to')      // YYYY-MM-DD

  const where: Record<string, unknown> = {}

  if (type === 'deposit')    where.deposit    = { gt: 0 }
  if (type === 'withdrawal') where.withdrawal = { gt: 0 }
  if (keyword) where.description = { contains: keyword, mode: 'insensitive' }
  if (dateFrom || dateTo) {
    where.transactionAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
    }
  }

  const [transactions, total, agg] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { transactionAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      include: {
        member:   { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: { deposit: true, withdrawal: true },
    }),
  ])

  return NextResponse.json({
    transactions,
    total,
    page,
    totalPages:       Math.ceil(total / limit),
    totalDepositSum:  agg._sum.deposit    ?? 0,
    totalWithdrawalSum: agg._sum.withdrawal ?? 0,
  })
}
