export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/members/[id] — 멤버 수정
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const id   = parseInt(params.id)
    const body = await req.json()
    const { name, nickname, monthlyFee, joinDate, isActive, marriedAt, houseNumber } = body

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name: name.trim() }),
        ...(nickname    !== undefined && { nickname: nickname?.trim() || null }),
        ...(monthlyFee  !== undefined && { monthlyFee: parseInt(monthlyFee) }),
        ...(joinDate    !== undefined && { joinDate: new Date(joinDate) }),
        ...(isActive    !== undefined && { isActive }),
        ...(marriedAt   !== undefined && { marriedAt: marriedAt ? new Date(marriedAt) : null }),
        ...(houseNumber !== undefined && { houseNumber: houseNumber ? parseInt(houseNumber) : null }),
      },
    })
    return NextResponse.json({ member })
  } catch (err) {
    console.error('[members PATCH error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/members/[id] — 멤버 삭제 (소프트: isActive=false)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)
    const member = await prisma.member.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ member })
  } catch (err) {
    console.error('[members DELETE error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
