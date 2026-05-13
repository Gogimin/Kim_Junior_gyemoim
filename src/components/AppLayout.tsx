'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/upload',    label: '파일 업로드', icon: '📂' },
  { href: '/transactions', label: '거래내역', icon: '📋' },
  { href: '/members',   label: '납부 현황', icon: '👥' },
  { href: '/settlement', label: '정산',     icon: '💰' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl">🏦</span>
            <span className="font-bold text-gray-900 text-xs sm:text-sm">계모임 통장</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            나가기 →
          </button>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5
                    px-2.5 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium
                    whitespace-nowrap border-b-2 transition-colors min-w-0 shrink-0
                    ${active
                      ? 'border-yellow-400 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="text-base sm:text-sm">{item.icon}</span>
                  <span className="leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* 본문 */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
