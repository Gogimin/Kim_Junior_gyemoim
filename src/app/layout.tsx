import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '계모임 통장 관리',
  description: '가족 계모임 입출금 내역 관리 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
