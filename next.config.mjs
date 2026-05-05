/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['exceljs', '@prisma/client'],
  },
  // 파일 업로드 크기 제한 해제 (엑셀 파일용)
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

export default nextConfig
