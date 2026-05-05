import ExcelJS from 'exceljs'
import crypto from 'crypto'

export interface ParsedTransaction {
  transactionAt: Date
  description: string   // 내용 (이름 등)
  txType: string        // 구분 (입금/출금)
  txCategory: string    // 거래구분 (일반입금 등)
  withdrawal: number    // 출금액
  deposit: number       // 입금액
  balance: number       // 거래 후 잔액
  memo: string
  txHash: string        // 중복 방지 해시
}

export interface ParseResult {
  transactions: ParsedTransaction[]
  periodStart: Date
  periodEnd: Date
  totalRows: number
  skippedRows: number   // 파싱 실패 행
}

/** 금액 문자열 → 정수 변환 ("10,000" → 10000, "-10,000" → 10000) */
function parseAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0
  const str = String(raw).replace(/,/g, '').replace(/-/g, '').trim()
  const num = parseInt(str, 10)
  return isNaN(num) ? 0 : num
}

/** "2022.11.01 20:24:39" → Date */
function parseDate(raw: unknown): Date | null {
  if (!raw) return null
  const str = String(raw).trim()
  // "YYYY.MM.DD HH:MM:SS" 포맷
  const match = str.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, sec] = match
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}+09:00`) // KST
}

/** tx_hash 생성 — 거래일시+구분+금액+잔액+내용 조합 */
function makeTxHash(
  transactionAt: Date,
  txType: string,
  amount: number,
  balance: number,
  description: string
): string {
  const raw = `${transactionAt.toISOString()}|${txType}|${amount}|${balance}|${description}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** 카카오뱅크 엑셀 파일 파싱 */
export async function parseKakaoExcel(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('시트를 찾을 수 없습니다.')

  const transactions: ParsedTransaction[] = []
  let skippedRows = 0
  let headerFound = false
  let headerRowIndex = -1

  // 헤더 행 찾기 (거래일시 컬럼이 있는 행)
  worksheet.eachRow((row, rowNumber) => {
    if (headerFound) return
    const cellB = String(row.getCell(2).value ?? '').trim()
    if (cellB === '거래일시') {
      headerFound = true
      headerRowIndex = rowNumber
    }
  })

  if (!headerRowIndex) throw new Error('거래내역 헤더를 찾을 수 없습니다.')

  // 데이터 행 파싱 (헤더 다음 행부터)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return

    const rawDate      = row.getCell(2).value  // 거래일시
    const rawType      = row.getCell(3).value  // 구분 (입금/출금)
    const rawAmount    = row.getCell(4).value  // 거래금액
    const rawBalance   = row.getCell(5).value  // 거래 후 잔액
    const rawCategory  = row.getCell(6).value  // 거래구분
    const rawDesc      = row.getCell(7).value  // 내용
    const rawMemo      = row.getCell(8).value  // 메모

    // 필수 필드 체크
    if (!rawDate || !rawType || rawAmount === null || rawAmount === undefined) {
      skippedRows++
      return
    }

    const transactionAt = parseDate(rawDate)
    if (!transactionAt) {
      skippedRows++
      return
    }

    const txType     = String(rawType).trim()
    const amount     = parseAmount(rawAmount)
    const balance    = parseAmount(rawBalance)
    const txCategory = String(rawCategory ?? '').trim()
    const description = String(rawDesc ?? '').trim()
    const memo       = String(rawMemo ?? '').trim()

    // 입금/출금 분리
    const deposit    = txType === '입금' ? amount : 0
    const withdrawal = txType === '출금' ? amount : 0

    const txHash = makeTxHash(transactionAt, txType, amount, balance, description)

    transactions.push({
      transactionAt,
      description,
      txType,
      txCategory,
      withdrawal,
      deposit,
      balance,
      memo,
      txHash,
    })
  })

  if (transactions.length === 0) {
    throw new Error('파싱된 거래내역이 없습니다. 파일 형식을 확인해주세요.')
  }

  // 날짜 정렬
  transactions.sort((a, b) => a.transactionAt.getTime() - b.transactionAt.getTime())

  const periodStart = transactions[0].transactionAt
  const periodEnd   = transactions[transactions.length - 1].transactionAt

  return {
    transactions,
    periodStart,
    periodEnd,
    totalRows: transactions.length + skippedRows,
    skippedRows,
  }
}
