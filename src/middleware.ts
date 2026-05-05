import { NextRequest, NextResponse } from 'next/server'

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/api/auth/verify', '/api/auth/check', '/api/health']

// Edge Runtime에서 동작하는 HMAC 검증 (Web Crypto API 사용)
async function verifyTokenEdge(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return false
    const [encoded, sig] = parts

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBytes = Uint8Array.from(
      sig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )
    const dataBytes = new TextEncoder().encode(encoded)

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes)
    if (!valid) return false

    // 만료 체크 (24시간)
    const payload = JSON.parse(atob(encoded))
    const age = Date.now() - payload.ts
    return age < 86400 * 1000
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 공개 경로는 통과
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // 정적 파일, Next.js 내부 경로 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 쿠키에서 세션 토큰 읽기
  const token = req.cookies.get('gm_session')?.value
  const secret = process.env.SESSION_SECRET ?? ''

  const authenticated = token ? await verifyTokenEdge(token, secret) : false

  if (!authenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
