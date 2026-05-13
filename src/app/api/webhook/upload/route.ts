export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { parseKakaoExcel } from '@/lib/excel-parser'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/webhook/upload
 *
 * Make.com 등 외부 자동화 툴에서 호출하는 전용 엔드포인트.
 * 쿠키 세션 대신 WEBHOOK_API_KEY 헤더로 인증.
 *
 * Headers:
 *   x-api-key: <WEBHOOK_API_KEY 환경변수 값>
 *
 * Body: multipart/form-data
 *   file: xlsx 파일 (카카오뱅크 거래내역)
 */
export async function POST(req: NextRequest) {
  // API 키 인증
  const apiKey     = req.headers.get('x-api-key')
  const configKey  = process.env.WEBHOOK_API_KEY

  if (!configKey) {
    return NextResponse.json(
      { error: 'WEBHOOK_API_KEY 환경변수가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }
  if (!apiKey || apiKey !== configKey) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file 필드가 없습니다.' }, { status: 400 })
    }
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: '.xlsx 파일만 지원합니다.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseKakaoExcel(buffer)

    let insertedRows     = 0
    let skippedDuplicates = 0

    const uploadLog = await prisma.uploadLog.create({
      data: {
        filename:    file.name,
        periodStart: parsed.periodStart,
        periodEnd:   parsed.periodEnd,
        totalRows:   parsed.totalRows,
        insertedRows: 0,
        skippedRows:  0,
      },
    })

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
        if (isUniqueConstraintError(e)) {
          skippedDuplicates++
        } else {
          throw e
        }
      }
    }

    await prisma.uploadLog.update({
      where: { id: uploadLog.id },
      data: {
        insertedRows,
        skippedRows: skippedDuplicates + parsed.skippedRows,
      },
    })

    return NextResponse.json({
      success:          true,
      filename:         file.name,
      periodStart:      parsed.periodStart,
      periodEnd:        parsed.periodEnd,
      totalRows:        parsed.totalRows,
      insertedRows,
      skippedDuplicates,
    })
  } catch (err) {
    console.error('[webhook/upload error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
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
