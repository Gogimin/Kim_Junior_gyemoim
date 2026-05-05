export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessKey, getSessionCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: '키를 입력해주세요.' }, { status: 400 })
    }

    if (!verifyAccessKey(key)) {
      // 브루트포스 방지: 실패 시 약간의 딜레이
      await new Promise(r => setTimeout(r, 500))
      return NextResponse.json({ error: '접근 키가 올바르지 않습니다.' }, { status: 401 })
    }

    const cookieOptions = getSessionCookieOptions()
    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieOptions)

    return response
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
