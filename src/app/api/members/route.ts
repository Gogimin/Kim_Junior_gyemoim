import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/members — 전체 멤버 목록
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ houseNumber: 'asc' }, { joinDate: 'asc' }],
    })
    return NextResponse.json({ members })
  } catch (err) {
    console.error('[members GET error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/members — 멤버 추가
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { name, nickname, monthlyFee, joinDate, marriedAt, houseNumber } = body

    if (!name || !joinDate) {
      return NextResponse.json({ error: '이름과 참여일은 필수입니다.' }, { status: 400 })
    }

    const member = await prisma.member.create({
      data: {
        name:        name.trim(),
        nickname:    nickname?.trim() || null,
        monthlyFee:  monthlyFee ? parseInt(monthlyFee) : 10000,
        marriedAt:   marriedAt   ? new Date(marriedAt)  : null,
        houseNumber: houseNumber ? parseInt(houseNumber) : null,
        joinDate:    new Date(joinDate),
      },
    })
    return NextResponse.json({ member }, { status: 201 })
  } catch (err) {
    console.error('[members POST error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
