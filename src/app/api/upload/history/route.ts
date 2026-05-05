export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const logs = await prisma.uploadLog.findMany({
    orderBy: { uploadedAt: 'desc' },
  })

  return NextResponse.json({ logs })
}
