export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/adjustments — 조정 내역 추가
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { memberId, amount, memo } = body

    if (!memberId || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'memberId와 amount는 필수입니다.' }, { status: 400 })
    }
    if (amount === 0) {
      return NextResponse.json({ error: '조정 금액은 0이 될 수 없습니다.' }, { status: 400 })
    }

    const adjustment = await prisma.paymentAdjustment.create({
      data: {
        memberId: parseInt(memberId),
        amount:   parseInt(amount),
        memo:     memo?.trim() || null,
      },
    })
    return NextResponse.json({ adjustment }, { status: 201 })
  } catch (err) {
    console.error('[adjustments POST error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
