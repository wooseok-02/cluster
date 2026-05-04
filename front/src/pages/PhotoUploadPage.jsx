// 사진 업로드 페이지 — EXIF 기반 분석 후 match_type별 UI 처리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPhotos } from '../api/activity'
import { confirmSchedule } from '../api/schedule'

export default function PhotoUploadPage() {
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [results, setResults] = useState(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // 그룹별 상태
  const [confirmedGroups, setConfirmedGroups] = useState(new Set())
  const [confirmingGroup, setConfirmingGroup] = useState(null)
  const [confirmErrors, setConfirmErrors] = useState({})
  const [memos, setMemos] = useState({})                   // group_index → memo
  const [selectedCandidates, setSelectedCandidates] = useState({}) // group_index → schedule_id

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (selected.length > 10) {
      setUploadError('최대 10장까지 선택할 수 있습니다.')
      return
    }
    setFiles(selected)
    setUploadError('')
    setResults(null)
    setConfirmedGroups(new Set())
    setConfirmErrors({})
    setMemos({})
    setSelectedCandidates({})
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError('사진을 선택해주세요.')
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const data = await uploadPhotos(files)
      setResults(data.data)
      setSkippedCount(data.skipped_count)
    } catch (err) {
      setUploadError(err.response?.data?.detail || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async (groupIndex, scheduleId) => {
    setConfirmErrors((prev) => ({ ...prev, [groupIndex]: '' }))
    setConfirmingGroup(groupIndex)
    try {
      const memo = memos[groupIndex] || null
      await confirmSchedule(scheduleId, memo)
      setConfirmedGroups((prev) => new Set([...prev, groupIndex]))
    } catch (err) {
      const detail = err.response?.data?.detail
      setConfirmErrors((prev) => ({
        ...prev,
        [groupIndex]: typeof detail === 'object' ? detail.message : detail || '확정에 실패했습니다.',
      }))
    } finally {
      setConfirmingGroup(null)
    }
  }

  const handleAddSchedule = (group) => {
    const startTime = String(group.time).slice(0, 5)
    const [h, m] = startTime.split(':').map(Number)
    const endHour = String((h + 1) % 24).padStart(2, '0')
    const endTime = `${endHour}:${String(m).padStart(2, '0')}`

    const draft = {
      form: { title: '', date: group.date, start_time: startTime, end_time: endTime, memo: '' },
      selectedPeopleIds: [],
      selectedPlaceId: group.place_id ?? null,
    }
    sessionStorage.setItem('scheduleFormDraft', JSON.stringify(draft))
    navigate('/schedule/create')
  }

  const exactGroups = results?.filter((r) => r.match_type === 'exact') ?? []
  const allExactConfirmed =
    exactGroups.length > 0 && exactGroups.every((r) => confirmedGroups.has(r.group_index))

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/calendar')} className="text-gray-500 text-sm">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold">사진 업로드</h1>
      </div>

      {/* 파일 선택 */}
      <div className="border rounded p-4 space-y-3 mb-4">
        <p className="text-sm text-gray-500">EXIF 정보(GPS, 날짜)가 포함된 사진을 선택하세요. 최대 10장.</p>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="text-sm" />
        {files.length > 0 && <p className="text-xs text-gray-400">{files.length}장 선택됨</p>}
        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full bg-blue-500 text-white py-2 rounded text-sm disabled:opacity-50"
        >
          {uploading ? '분석 중...' : '분석 시작'}
        </button>
      </div>

      {/* 분석 결과 */}
      {results && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{results.length}개 그룹 분석 완료</p>
            {skippedCount > 0 && (
              <p className="text-xs text-gray-400">GPS 없는 사진 {skippedCount}장 건너뜀</p>
            )}
          </div>

          {results.map((group) => (
            <GroupCard
              key={group.group_index}
              group={group}
              confirmed={confirmedGroups.has(group.group_index)}
              confirming={confirmingGroup === group.group_index}
              error={confirmErrors[group.group_index]}
              memo={memos[group.group_index] ?? ''}
              onMemoChange={(val) => setMemos((prev) => ({ ...prev, [group.group_index]: val }))}
              selectedCandidateId={selectedCandidates[group.group_index] ?? null}
              onSelectCandidate={(scheduleId) =>
                setSelectedCandidates((prev) => ({ ...prev, [group.group_index]: scheduleId }))
              }
              onConfirm={(scheduleId) => handleConfirm(group.group_index, scheduleId)}
              onAddSchedule={() => handleAddSchedule(group)}
            />
          ))}

          <button
            onClick={() => navigate('/calendar')}
            className={`w-full py-2 rounded text-sm mt-2 ${
              allExactConfirmed ? 'bg-green-500 text-white' : 'border text-gray-600'
            }`}
          >
            {allExactConfirmed ? '완료' : '캘린더로 돌아가기'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 그룹 카드 ─────────────────────────────────────────────────
function GroupCard({
  group, confirmed, confirming, error,
  memo, onMemoChange,
  selectedCandidateId, onSelectCandidate,
  onConfirm, onAddSchedule,
}) {
  const dateStr = group.date ? group.date.replace(/-/g, ' - ') : ''
  const timeStr = String(group.time).slice(0, 5)

  const badgeStyle = {
    exact: 'bg-blue-100 text-blue-600',
    date_only: 'bg-yellow-100 text-yellow-600',
    none: 'bg-gray-100 text-gray-500',
  }[group.match_type] ?? 'bg-gray-100 text-gray-500'

  const badgeLabel = {
    exact: '일정 매칭',
    date_only: '날짜만 일치',
    none: '매칭 없음',
  }[group.match_type] ?? '매칭 없음'

  return (
    <div className={`border rounded p-4 space-y-2 ${confirmed ? 'opacity-60' : ''}`}>
      {/* 헤더: 날짜/시간 + 뱃지 */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">날짜 | {dateStr}</p>
          <p className="text-xs text-gray-500">시간 | {timeStr}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeStyle}`}>{badgeLabel}</span>
      </div>

      <p className="text-xs text-gray-400">사진 {group.photo_count}장</p>

      {/* ── exact: 매칭된 일정 정보 표시 + 메모 + 확정 ── */}
      {group.match_type === 'exact' && (
        <>
          <div className="space-y-1">
            <p className="text-sm font-medium">📅 {group.schedule_title}</p>
            {group.place_name && <p className="text-sm text-gray-600">📍 {group.place_name}</p>}
            {group.people?.length > 0 && (
              <p className="text-sm text-gray-600">👥 {group.people.map((p) => p.name).join(', ')}</p>
            )}
          </div>
          {!confirmed && (
            <textarea
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="메모 (선택)"
              rows={2}
              className="w-full border rounded px-2 py-1.5 text-sm resize-none"
            />
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {confirmed ? (
            <p className="text-green-600 text-sm font-medium">확정 완료</p>
          ) : (
            <button
              onClick={() => onConfirm(group.schedule_id)}
              disabled={confirming}
              className="w-full bg-blue-500 text-white py-1.5 rounded text-sm disabled:opacity-50"
            >
              {confirming ? '확정 중...' : '확정'}
            </button>
          )}
        </>
      )}

      {/* ── date_only: 후보 일정 목록 + 선택 + 신규 생성 ── */}
      {group.match_type === 'date_only' && (
        <>
          <p className="text-xs text-gray-500">같은 날짜의 일정 중 하나를 선택하거나 신규 생성하세요.</p>

          <div className="space-y-2">
            {group.candidates?.map((c) => {
              const isSelected = selectedCandidateId === c.schedule_id
              return (
                <button
                  key={c.schedule_id}
                  onClick={() => onSelectCandidate(isSelected ? null : c.schedule_id)}
                  className={`w-full text-left p-3 rounded border text-sm transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-medium">{c.title}</p>
                  {c.place_name && <p className="text-xs text-gray-500 mt-0.5">📍 {c.place_name}</p>}
                </button>
              )
            })}
          </div>

          {selectedCandidateId && !confirmed && (
            <>
              <textarea
                value={memo}
                onChange={(e) => onMemoChange(e.target.value)}
                placeholder="메모 (선택)"
                rows={2}
                className="w-full border rounded px-2 py-1.5 text-sm resize-none"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={() => onConfirm(selectedCandidateId)}
                disabled={confirming}
                className="w-full bg-blue-500 text-white py-1.5 rounded text-sm disabled:opacity-50"
              >
                {confirming ? '확정 중...' : '선택한 일정 확정'}
              </button>
            </>
          )}

          {confirmed && <p className="text-green-600 text-sm font-medium">확정 완료</p>}

          {!confirmed && (
            <button
              onClick={onAddSchedule}
              className="w-full border border-blue-400 text-blue-500 py-1.5 rounded text-sm"
            >
              + 신규 일정 생성
            </button>
          )}
        </>
      )}

      {/* ── none: 안내 문구 + 신규 생성 ── */}
      {group.match_type === 'none' && (
        <>
          <p className="text-sm text-gray-400">일치하는 일정이 없습니다.</p>
          {group.place_name && (
            <p className="text-sm text-gray-600">📍 {group.place_name} (자동 선택됨)</p>
          )}
          <button
            onClick={onAddSchedule}
            className="w-full border border-blue-400 text-blue-500 py-1.5 rounded text-sm"
          >
            + 신규 일정 생성
          </button>
        </>
      )}
    </div>
  )
}
