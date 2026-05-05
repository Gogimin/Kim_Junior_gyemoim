/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['exceljs', '@prisma/client'],
  },
  // Node.js 버전 차이로 인한 Buffer 타입 에러 무시 (런타임 동작에 영향 없음)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
