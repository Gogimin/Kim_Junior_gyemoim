import { NextRequest } from 'next/server'
import crypto from 'crypto'

const SESSION_COOKIE = 'gm_session'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24시간 (초 단위)

/** 입력된 키가 환경변수 ACCESS_KEY와 일치하는지 검증 */
export function verifyAccessKey(inputKey: string): boolean {
  try {
    const ACCESS_KEY = process.env.ACCESS_KEY
    if (!ACCESS_KEY) return false

    // timingSafeEqual은 길이가 다르면 throw → 단순 비교로 안전하게 처리
    const a = Buffer.from(inputKey.trim())
    const b = Buffer.from(ACCESS_KEY.trim())
    if (a.length !== b.length) return false

    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.')
  return secret
}

/** 세션 토큰 생성 (HMAC 서명) */
export function createSessionToken(): string {
  const payload = JSON.stringify({ ts: Date.now() })
  const encoded = Buffer.from(payload).toString('base64')
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('hex')
  return `${encoded}.${sig}`
}

/** 세션 토큰 유효성 검증 */
export function verifySessionToken(token: string): boolean {
  try {
    const [encoded, sig] = token.split('.')
    if (!encoded || !sig) return false

    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(encoded)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return false
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString())
    const age = Date.now() - payload.ts
    return age < SESSION_MAX_AGE * 1000
  } catch {
    return false
  }
}

/** API Route에서 인증 여부 확인 */
export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token)
}

/** 세션 쿠키 설정값 반환 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  }
}
