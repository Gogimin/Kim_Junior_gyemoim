import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/transactions/[id] — 멤버 또는 카테고리 수동 지정
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const id   = parseInt(params.id)
    const body = await req.json()
    const { memberId, categoryId, memo } = body

    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        ...(memberId   !== undefined && { memberId:   memberId   ?? null }),
        ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
        ...(memo       !== undefined && { memo:       memo?.trim() || null }),
      },
    })
    return NextResponse.json({ transaction: tx })
  } catch (err) {
    console.error('[transaction PATCH error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
