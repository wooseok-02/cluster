// 사진 업로드 페이지 — EXIF 기반 분석 후 match_type별 UI 처리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPhotos } from '../api/activity'

export default function PhotoUploadPage() {
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [results, setResults] = useState(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (selected.length > 10) {
      setUploadError('최대 10장까지 선택할 수 있습니다.')
      return
    }
    setFiles(selected)
    setUploadError('')
    setResults(null)
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

  // 기존 일정으로 이동
  const handleViewSchedule = (scheduleId) => {
    navigate(`/schedule/${scheduleId}`)
  }

  // 신규 일정 생성 — 사진의 날짜·위치·감지된 사람을 폼에 자동 입력
  const handleAddSchedule = (group) => {
    const startTime = group.time ? String(group.time).slice(0, 5) : '09:00'
    const [h, m] = startTime.split(':').map(Number)
    const endHour = String((h + 1) % 24).padStart(2, '0')
    const endTime = `${endHour}:${String(m).padStart(2, '0')}`

    const draft = {
      form: { title: '', date: group.date ?? '', start_time: startTime, end_time: endTime, memo: '' },
      selectedPeopleIds: group.matched_people_ids ?? [],   // 얼굴 매칭으로 감지된 사람 자동 입력
      selectedPlaceId: group.place_id ?? null,             // 사진 GPS로 매칭된 장소 자동 입력
    }
    sessionStorage.setItem('scheduleFormDraft', JSON.stringify(draft))

    // 이 그룹에 속하는 파일만 추출 — navigate state로 전달 (File 객체는 JSON 직렬화 불가)
    const pendingFiles = (group.photo_indices ?? [])
      .map((i) => files[i])
      .filter(Boolean)
    navigate('/schedule/create', { state: { pendingFiles } })
  }

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
              onViewSchedule={handleViewSchedule}
              onAddSchedule={() => handleAddSchedule(group)}
            />
          ))}

          <button
            onClick={() => navigate('/calendar')}
            className="w-full py-2 rounded text-sm mt-2 border text-gray-600"
          >
            캘린더로 돌아가기
          </button>
        </div>
      )}
    </div>
  )
}

// ── 그룹 카드 ─────────────────────────────────────────────────
function GroupCard({ group, onViewSchedule, onAddSchedule }) {
  const dateStr = group.date ? group.date.replace(/-/g, ' - ') : ''
  const timeStr = group.time ? String(group.time).slice(0, 5) : ''

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
    <div className="border rounded p-4 space-y-2">
      {/* 헤더: 날짜/시간 + 뱃지 */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          {dateStr && <p className="text-sm font-medium">날짜 | {dateStr}</p>}
          {timeStr && <p className="text-xs text-gray-500">시간 | {timeStr}</p>}
          {!dateStr && <p className="text-sm font-medium text-gray-400">날짜 정보 없음</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeStyle}`}>{badgeLabel}</span>
      </div>

      <p className="text-xs text-gray-400">사진 {group.photo_count}장</p>

      {/* ── exact: 매칭된 일정 정보 표시 → 일정으로 이동 ── */}
      {group.match_type === 'exact' && (
        <>
          <div className="space-y-1">
            <p className="text-sm font-medium">📅 {group.schedule_title}</p>
            {group.place_name && <p className="text-sm text-gray-600">📍 {group.place_name}</p>}
            {group.people?.length > 0 && (
              <p className="text-sm text-gray-600">👥 {group.people.map((p) => p.name).join(', ')}</p>
            )}
          </div>
          <button
            onClick={() => onViewSchedule(group.schedule_id)}
            className="w-full bg-blue-500 text-white py-1.5 rounded text-sm"
          >
            일정 보기
          </button>
        </>
      )}

      {/* ── date_only: 후보 일정 선택 → 일정으로 이동 or 신규 생성 ── */}
      {group.match_type === 'date_only' && (
        <>
          <p className="text-xs text-gray-500">같은 날짜의 일정 중 하나를 선택하거나 신규 생성하세요.</p>

          <div className="space-y-2">
            {group.candidates?.map((c) => (
              <button
                key={c.schedule_id}
                onClick={() => onViewSchedule(c.schedule_id)}
                className="w-full text-left p-3 rounded border text-sm border-gray-200 bg-white hover:border-blue-400 transition-colors"
              >
                <p className="font-medium">{c.title}</p>
                {c.place_name && <p className="text-xs text-gray-500 mt-0.5">📍 {c.place_name}</p>}
              </button>
            ))}
          </div>

          <button
            onClick={onAddSchedule}
            className="w-full border border-blue-400 text-blue-500 py-1.5 rounded text-sm"
          >
            + 신규 일정 생성
          </button>
        </>
      )}

      {/* ── none: 안내 문구 → 신규 생성 ── */}
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
