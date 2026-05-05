'use client'

import { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface UploadResult {
  filename: string
  success: boolean
  error?: string
  periodStart?: string
  periodEnd?: string
  totalRows?: number
  insertedRows?: number
  skippedDuplicates?: number
}

interface UploadLog {
  id: number
  filename: string
  periodStart: string
  periodEnd: string
  totalRows: number
  insertedRows: number
  skippedRows: number
  uploadedAt: string
}

export default function UploadPage() {
  const [files, setFiles]       = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [results, setResults]   = useState<UploadResult[]>([])
  const [logs, setLogs]         = useState<UploadLog[]>([])
  const fileInputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    const res = await fetch('/api/upload/history')
    if (res.ok) setLogs((await res.json()).logs)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'))
    setFiles(prev => mergeFiles(prev, dropped))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter(f => f.name.endsWith('.xlsx'))
    setFiles(prev => mergeFiles(prev, selected))
    e.target.value = ''
  }

  function mergeFiles(existing: File[], added: File[]): File[] {
    const names = new Set(existing.map(f => f.name))
    return [...existing, ...added.filter(f => !names.has(f.name))]
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    setResults([])
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      setResults(data.results ?? [])
      setFiles([])
      fetchLogs()
    } catch {
      setResults([{ filename: '전체', success: false, error: '네트워크 오류' }])
    } finally {
      setUploading(false)
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <AppLayout>

      {/* 안내 배너 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-6 text-sm text-blue-700">
        <p className="font-semibold mb-1">📌 엑셀 파일 받는 방법</p>
        <p>카카오뱅크 앱 → 해당 계좌 선택 → 거래내역 → 우측 상단 ··· → 거래내역 내보내기 → 이메일 수신</p>
        <p className="text-blue-500 mt-1">파일 여러 개를 한 번에 올려도 됩니다. 기간이 겹치는 중복 거래는 자동으로 제거됩니다.</p>
      </div>

      {/* 드래그앤드롭 */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-4
          ${dragging
            ? 'border-yellow-400 bg-yellow-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50'
          }`}
      >
        <p className="text-4xl mb-3">📂</p>
        <p className="font-semibold text-gray-700">파일을 여기로 드래그하거나 클릭해서 선택</p>
        <p className="text-sm text-gray-400 mt-1">.xlsx 파일만 지원 · 여러 파일 동시 선택 가능</p>
        <input ref={fileInputRef} type="file" accept=".xlsx" multiple onChange={handleFileChange} className="hidden" />
      </div>

      {/* 선택된 파일 목록 */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            선택된 파일 ({files.length}개)
          </div>
          {files.map(f => (
            <div key={f.name} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-500 shrink-0">📄</span>
                <span className="text-sm text-gray-800 truncate">{f.name}</span>
                <span className="text-xs text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)}KB)</span>
              </div>
              <button onClick={() => setFiles(p => p.filter(x => x.name !== f.name))}
                className="text-gray-300 hover:text-red-400 transition-colors ml-3 shrink-0 text-lg leading-none">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40
                   disabled:cursor-not-allowed text-gray-900 font-bold py-3.5 rounded-xl
                   transition-colors text-sm mb-8"
      >
        {uploading ? '업로드 중...' : files.length > 0 ? `${files.length}개 파일 업로드` : '파일을 먼저 선택해주세요'}
      </button>

      {/* 업로드 결과 */}
      {results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">업로드 결과</h2>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`rounded-2xl p-4 border ${r.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{r.success ? '✅' : '❌'}</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{r.filename}</span>
                </div>
                {r.success ? (
                  <div className="text-xs text-gray-500 ml-6 space-y-0.5">
                    <p>기간: {fmtDate(r.periodStart!)} ~ {fmtDate(r.periodEnd!)}</p>
                    <p>
                      총 {r.totalRows}건 중&nbsp;
                      <span className="text-green-700 font-bold">{r.insertedRows}건 저장</span>
                      {(r.skippedDuplicates ?? 0) > 0 &&
                        <span className="text-gray-400"> (중복 {r.skippedDuplicates}건 제거)</span>}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 ml-6">{r.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 이력 */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">업로드 이력</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">파일명</th>
                    <th className="px-5 py-3 text-left font-medium">기간</th>
                    <th className="px-5 py-3 text-right font-medium">저장</th>
                    <th className="px-5 py-3 text-right font-medium">중복제거</th>
                    <th className="px-5 py-3 text-left font-medium">업로드일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-700 max-w-[180px]">
                        <span className="block truncate text-xs">{log.filename}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {fmtDate(log.periodStart)} ~ {fmtDate(log.periodEnd)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-green-700 font-bold">{log.insertedRows}건</span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">{log.skippedRows}건</td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.uploadedAt).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
