import * as XLSX from 'xlsx'
import crypto from 'crypto'

export interface ParsedTransaction {
  transactionAt: Date
  description:   string
  txType:        string
  txCategory:    string
  withdrawal:    number
  deposit:       number
  balance:       number
  memo:          string
  txHash:        string
}

export interface ParseResult {
  transactions: ParsedTransaction[]
  periodStart:  Date
  periodEnd:    Date
  totalRows:    number
  skippedRows:  number
}

function parseAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0
  const str = String(raw).replace(/,/g, '').replace(/-/g, '').trim()
  const num  = parseInt(str, 10)
  return isNaN(num) ? 0 : num
}

/** "2022.11.01 20:24:39" → Date (KST) */
function parseDate(raw: unknown): Date | null {
  if (!raw) return null
  const str   = String(raw).trim()
  const match = str.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, sec] = match
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}+09:00`)
}

function makeTxHash(
  transactionAt: Date,
  txType:        string,
  amount:        number,
  balance:       number,
  description:   string,
): string {
  const raw = `${transactionAt.toISOString()}|${txType}|${amount}|${balance}|${description}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** 카카오뱅크 엑셀 파일 파싱 (암호화 파일 지원) */
export async function parseKakaoExcel(buffer: Buffer): Promise<ParseResult> {
  const password = process.env.EXCEL_PASSWORD || undefined

  let workbook: XLSX.WorkBook

  // 1차: 환경변수 암호로 시도
  try {
    workbook = XLSX.read(buffer, {
      type:      'buffer',
      password,
      raw:       false,
    })
  } catch {
    // 2차: 암호 없이 재시도 (수동으로 암호 제거 후 업로드한 경우)
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', raw: false })
    } catch {
      const hint = password
        ? '파일을 열 수 없습니다. EXCEL_PASSWORD 환경변수를 확인해주세요.'
        : '파일을 열 수 없습니다. 암호가 걸린 파일이면 EXCEL_PASSWORD 환경변수를 설정해주세요.'
      throw new Error(hint)
    }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('시트를 찾을 수 없습니다.')

  // 행 배열로 변환 (header: 1 → 2차원 배열)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { header: 1, defval: '' },
  )

  // 헤더 행 찾기 (B열 = index 1 이 "거래일시"인 행)
  let headerRowIndex = -1
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === '거래일시') {
      headerRowIndex = i
      break
    }
  }
  if (headerRowIndex === -1) throw new Error('거래내역 헤더를 찾을 수 없습니다.')

  const transactions: ParsedTransaction[] = []
  let skippedRows = 0

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]

    const rawDate     = row[1]  // 거래일시
    const rawType     = row[2]  // 구분 (입금/출금)
    const rawAmount   = row[3]  // 거래금액
    const rawBalance  = row[4]  // 거래 후 잔액
    const rawCategory = row[5]  // 거래구분
    const rawDesc     = row[6]  // 내용
    const rawMemo     = row[7]  // 메모

    if (!rawDate || !rawType || rawAmount === '' || rawAmount === null) {
      skippedRows++
      continue
    }

    const transactionAt = parseDate(rawDate)
    if (!transactionAt) { skippedRows++; continue }

    const txType      = String(rawType).trim()
    const amount      = parseAmount(rawAmount)
    const balance     = parseAmount(rawBalance)
    const txCategory  = String(rawCategory ?? '').trim()
    const description = String(rawDesc      ?? '').trim()
    const memo        = String(rawMemo       ?? '').trim()

    const deposit    = txType === '입금' ? amount : 0
    const withdrawal = txType === '출금' ? amount : 0
    const txHash     = makeTxHash(transactionAt, txType, amount, balance, description)

    transactions.push({
      transactionAt, description, txType, txCategory,
      withdrawal, deposit, balance, memo, txHash,
    })
  }

  if (transactions.length === 0) {
    throw new Error('파싱된 거래내역이 없습니다. 파일 형식을 확인해주세요.')
  }

  transactions.sort((a, b) => a.transactionAt.getTime() - b.transactionAt.getTime())

  return {
    transactions,
    periodStart: transactions[0].transactionAt,
    periodEnd:   transactions[transactions.length - 1].transactionAt,
    totalRows:   transactions.length + skippedRows,
    skippedRows,
  }
}
