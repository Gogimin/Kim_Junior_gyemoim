import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { parseKakaoExcel } from '@/lib/excel-parser'
import { prisma } from '@/lib/prisma'

// App Router route segment config (replaces old export const config)
export const maxDuration = 30

export async function POST(req: NextRequest) {
  // 인증 확인
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 })
    }

    const results = []

    for (const file of files) {
      if (!file.name.endsWith('.xlsx')) {
        results.push({ filename: file.name, success: false, error: '.xlsx 파일만 업로드 가능합니다.' })
        continue
      }

      try {
        // 파일 → Buffer 변환
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 엑셀 파싱
        const parsed = await parseKakaoExcel(buffer)

        // DB 저장 (중복 제외)
        let insertedRows = 0
        let skippedDuplicates = 0

        // upload_log 먼저 생성
        const uploadLog = await prisma.uploadLog.create({
          data: {
            filename: file.name,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            totalRows: parsed.totalRows,
            insertedRows: 0,   // 나중에 업데이트
            skippedRows: 0,
          },
        })

        // 거래내역 저장 (중복은 무시)
        for (const tx of parsed.transactions) {
          try {
            await prisma.transaction.create({
              data: {
                transactionAt: tx.transactionAt,
                description:   tx.description,
                withdrawal:    tx.withdrawal,
                deposit:       tx.deposit,
                balance:       tx.balance,
                memo:          tx.memo,
                txHash:        tx.txHash,
                uploadLogId:   uploadLog.id,
              },
            })
            insertedRows++
          } catch (e: unknown) {
            // unique constraint violation = 중복 → 스킵
            if (isUniqueConstraintError(e)) {
              skippedDuplicates++
            } else {
              throw e
            }
          }
        }

        // upload_log 결과 업데이트
        await prisma.uploadLog.update({
          where: { id: uploadLog.id },
          data: {
            insertedRows,
            skippedRows: skippedDuplicates + parsed.skippedRows,
          },
        })

        results.push({
          filename: file.name,
          success: true,
          periodStart: parsed.periodStart,
          periodEnd: parsed.periodEnd,
          totalRows: parsed.totalRows,
          insertedRows,
          skippedDuplicates,
        })
      } catch (err) {
        results.push({
          filename: file.name,
          success: false,
          error: err instanceof Error ? err.message : '파싱 실패',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[Upload Error]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2002'
  )
}
