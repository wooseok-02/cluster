// 사진 업로드 페이지 — EXIF 기반 분석 후 일정/장소 매칭 결과 표시 및 확정
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPhotos, confirmSchedule } from '../api/activity'

export default function PhotoUploadPage() {
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [results, setResults] = useState(null)  // PhotoGroupResult[]
  const [skippedCount, setSkippedCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // 그룹별 확정 상태
  const [confirmedGroups, setConfirmedGroups] = useState(new Set())
  const [confirmingGroup, setConfirmingGroup] = useState(null)
  const [confirmErrors, setConfirmErrors] = useState({})

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
      console.log('upload response:', JSON.stringify(data.data))
      setResults(data.data)
      setSkippedCount(data.skipped_count)
    } catch (err) {
      setUploadError(err.response?.data?.detail || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async (group) => {
    const idx = group.group_index
    setConfirmErrors((prev) => ({ ...prev, [idx]: '' }))
    setConfirmingGroup(idx)
    try {
      await confirmSchedule(group.schedule_id)
      setConfirmedGroups((prev) => new Set([...prev, idx]))
    } catch (err) {
      const detail = err.response?.data?.detail
      setConfirmErrors((prev) => ({
        ...prev,
        [idx]: typeof detail === 'object' ? detail.message : detail || '확정에 실패했습니다.',
      }))
    } finally {
      setConfirmingGroup(null)
    }
  }

  // 사진 정보 pre-fill 후 일정 생성 페이지로 이동
  const handleAddSchedule = (group) => {
    const startTime = String(group.time).slice(0, 5) // "18:22"
    // 종료 시간: 시작 +1시간 (간단 계산)
    const [h, m] = startTime.split(':').map(Number)
    const endHour = String((h + 1) % 24).padStart(2, '0')
    const endTime = `${endHour}:${String(m).padStart(2, '0')}`

    const draft = {
      form: {
        title: '',
        date: group.date,
        start_time: startTime,
        end_time: endTime,
        memo: '',
      },
      selectedPeopleIds: [],
      selectedPlaceId: group.place_id ?? null,
    }
    sessionStorage.setItem('scheduleFormDraft', JSON.stringify(draft))
    navigate('/schedule/create')
  }

  const scheduleGroups = results?.filter((r) => r.match_type === 'schedule') ?? []
  const allConfirmed =
    scheduleGroups.length > 0 &&
    scheduleGroups.every((r) => confirmedGroups.has(r.group_index))

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
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="text-sm"
        />
        {files.length > 0 && (
          <p className="text-xs text-gray-400">{files.length}장 선택됨</p>
        )}
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
              onConfirm={() => handleConfirm(group)}
              onAddSchedule={() => handleAddSchedule(group)}
            />
          ))}

          {/* 완료 버튼 */}
          <button
            onClick={() => navigate('/calendar')}
            className={`w-full py-2 rounded text-sm mt-2 ${
              allConfirmed
                ? 'bg-green-500 text-white'
                : 'border text-gray-600'
            }`}
          >
            {allConfirmed ? '완료' : '캘린더로 돌아가기'}
          </button>
        </div>
      )}
    </div>
  )
}

// 그룹 카드 컴포넌트
function GroupCard({ group, confirmed, confirming, error, onConfirm, onAddSchedule }) {
  const dateStr = group.date ? group.date.replace(/-/g, ' - ') : ''
  const timeStr = String(group.time).slice(0, 5)

  return (
    <div className={`border rounded p-4 space-y-2 ${confirmed ? 'opacity-60' : ''}`}>
      {/* 그룹 기본 정보 */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">날짜 | {dateStr}</p>
          <p className="text-xs text-gray-500">시간 | {timeStr}</p>
          {group.latitude != null && group.longitude != null && (
            <>
              <p className="text-xs text-gray-500">위도 : {Number(group.latitude).toFixed(3)}</p>
              <p className="text-xs text-gray-500">경도 : {Number(group.longitude).toFixed(3)}</p>
            </>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          group.match_type === 'schedule'
            ? 'bg-blue-100 text-blue-600'
            : group.match_type === 'place'
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {group.match_type === 'schedule' ? '일정 매칭'
            : group.match_type === 'place' ? '장소 매칭'
            : '매칭 없음'}
        </span>
      </div>

      <p className="text-xs text-gray-400">사진 {group.photo_count}장</p>

      {/* match_type별 상세 */}
      {group.match_type === 'schedule' && (
        <div className="space-y-1">
          <p className="text-sm">📅 {group.schedule_title}</p>
          {group.place_name && (
            <p className="text-sm text-gray-600">📍 {group.place_name}</p>
          )}
          {group.people && group.people.length > 0 && (
            <p className="text-sm text-gray-600">
              👥 {group.people.map((p) => p.name).join(', ')}
            </p>
          )}
        </div>
      )}

      {group.match_type === 'place' && (
        <p className="text-sm text-gray-600">📍 {group.place_name}</p>
      )}

      {group.match_type === 'none' && (
        <p className="text-sm text-gray-400">매칭된 일정/장소가 없습니다.</p>
      )}

      {/* 일정 추가 버튼 — place/none 매칭일 때 */}
      {(group.match_type === 'place' || group.match_type === 'none') && (
        <button
          onClick={onAddSchedule}
          className="w-full border border-blue-400 text-blue-500 py-1.5 rounded text-sm"
        >
          + 일정 추가
        </button>
      )}

      {/* 확정 버튼 — schedule 매칭일 때만 */}
      {group.match_type === 'schedule' && (
        <>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {confirmed ? (
            <p className="text-green-600 text-sm font-medium">확정 완료</p>
          ) : (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="w-full bg-blue-500 text-white py-1.5 rounded text-sm disabled:opacity-50"
            >
              {confirming ? '확정 중...' : '확정'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
