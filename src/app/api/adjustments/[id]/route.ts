export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/adjustments/[id] — 조정 삭제
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)
    await prisma.paymentAdjustment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[adjustments DELETE error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
