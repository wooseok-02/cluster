// 사진 업로드 페이지 — EXIF 기반 분석 후 match_type별 UI 처리
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPhotos } from '../api/activity'
import { getPhotoUploadSession, setPendingFiles, setPendingPhotoUploadGroup, setPhotoUploadSession } from '../lib/pendingPhotos'

const DRAFT_KEY = 'scheduleFormDraft'
const STATUS_META = {
  exact: {
    label: '일정 매칭',
    bg: 'bg-calendar-planning-bg',
    text: 'text-calendar-planning',
    action: 'bg-primary text-white',
  },
  date_only: {
    label: '날짜만 일치',
    bg: 'bg-calendar-completed-bg',
    text: 'text-calendar-completed',
    action: 'bg-primary text-white',
  },
  none: {
    label: '매칭 없음',
    bg: 'bg-gray-100',
    text: 'text-text-sub',
    action: 'border border-primary bg-white text-primary',
  },
}

function formatDate(date) {
  return date ? String(date).replace(/-/g, '.') : '날짜 정보 없음'
}

function formatTime(time) {
  return time ? String(time).slice(0, 5) : ''
}

function getEndTime(startTime) {
  const fallback = startTime || '09:00'
  const [hour, minute] = fallback.split(':').map(Number)
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`
}

function getGroupFiles(group, files) {
  return (group.photo_indices ?? [])
    .map((index) => files[index])
    .filter(Boolean)
}

function getPrefillDraft(group, schedule = {}) {
  const startTime = formatTime(schedule.start_time || schedule.startTime || group.time) || '09:00'
  const peopleIds = schedule.people_ids || schedule.peopleIds || group.matched_people_ids || group.people?.map((person) => person.id).filter(Boolean) || []
  const placeId = schedule.place_id || schedule.placeId || schedule.place?.id || group.place_id || group.place?.id || null

  return {
    form: {
      title: schedule.title || group.schedule_title || '',
      date: schedule.date || group.date || '',
      start_time: startTime,
      end_time: formatTime(schedule.end_time || schedule.endTime) || getEndTime(startTime),
      memo: schedule.memo || '',
    },
    selectedPeopleIds: peopleIds,
    selectedPlaceId: placeId,
  }
}

function BackIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AiIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5C4 6.567 5.567 5 7.5 5H16.5C18.433 5 20 6.567 20 8.5V15.5C20 17.433 18.433 19 16.5 19H7.5C5.567 19 4 17.433 4 15.5V8.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 10.5V13.5M15 10.5V13.5M9 16H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 3V5M12 19V21M2.5 12H4M20 12H21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M7 17L11 13.5L13.5 15.5L16 13L20 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlaceIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21S6 15.686 6 10.5C6 7.186 8.686 4.5 12 4.5S18 7.186 18 10.5C18 15.686 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function PhotoUploadPage() {
  const navigate = useNavigate()
  const savedSession = getPhotoUploadSession()

  const [files, setFiles] = useState(savedSession?.files || [])
  const [previewUrls, setPreviewUrls] = useState([])
  const [results, setResults] = useState(savedSession?.results || null)
  const [skippedCount, setSkippedCount] = useState(savedSession?.skippedCount || 0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (selected.length > 10) {
      setUploadError('최대 10장까지 선택할 수 있습니다.')
      return
    }
    setFiles(selected)
    setUploadError('')
    setResults(null)
    setSkippedCount(0)
    setPhotoUploadSession(null)
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
      setPhotoUploadSession({ files, results: data.data, skippedCount: data.skipped_count })
    } catch (err) {
      setUploadError(err.response?.data?.detail || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const navigateToScheduleForm = (group, schedule = {}) => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(getPrefillDraft(group, schedule)))
    setPendingFiles(getGroupFiles(group, files))
    setPendingPhotoUploadGroup({
      groupIndex: group.group_index,
      matchedPeopleIds: group.matched_people_ids || [],
    })
    setPhotoUploadSession({ files, results, skippedCount })
    navigate('/schedule/create?from=photo-upload')
  }

  const handleFileSelectClick = () => {
    document.getElementById('photo-upload-input')?.click()
  }

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-white !pb-[110px]">
      <header className="sticky top-0 z-10 flex items-center justify-center bg-white !px-[23px] !pt-5 !pb-[10px]">
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="absolute left-[23px] top-3 flex size-[30px] items-center justify-center text-text-main"
          aria-label="뒤로"
        >
          <BackIcon />
        </button>
        <h1 className="text-base font-semibold leading-4 text-text-main">사진 업로드</h1>
      </header>

      {/* 파일 선택 */}
      <main className="!px-[30px] !pt-[28px]">
        <section className="rounded-[10px] border border-gray-400 !px-[10px] !py-[15px]">
          <div className="flex gap-[18px]">
            <div className="flex size-[54px] shrink-0 items-center justify-center rounded-[10px] bg-primary-light text-primary">
              <AiIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium leading-4 text-text-main">EXIF 정보(GPS, 날짜)가 포함된 사진을 선택하세요.</p>
              <p className="text-[8px] leading-4 text-people-status-old">최대 10장까지 선택할 수 있어요</p>
              <div className="!mt-1 flex items-center gap-[6px]">
                <button
                  type="button"
                  onClick={handleFileSelectClick}
                  className="text-[10px] font-medium leading-4 text-primary underline"
                >
                  파일 선택
                </button>
                <span className="text-xs text-text-sub">◆</span>
                <span className="text-[10px] font-medium leading-4 text-text-main">{files.length}장의 사진</span>
              </div>
              <p className="text-[8px] leading-4 text-text-sub">{files.length}장 선택됨</p>
            </div>
          </div>

          <input id="photo-upload-input" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

          {previewUrls.length > 0 && (
            <div className="!mt-3 grid grid-cols-4 gap-2">
              {previewUrls.slice(0, 4).map((url) => (
                <img key={url} src={url} alt="선택한 사진" className="h-[45px] w-full rounded-[5px] object-cover" />
              ))}
            </div>
          )}

          {uploadError && <p className="!mt-2 text-xs text-red-500">{uploadError}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
            className="!mt-[10px] flex w-full items-center justify-center rounded-[5px] bg-primary !px-[10px] !py-[6px] text-[10px] font-semibold leading-4 text-white disabled:opacity-50"
        >
          {uploading ? '분석 중...' : '분석 시작'}
        </button>
        </section>

      {/* 분석 결과 */}
      {results && (
          <section className="!mt-[24px]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold leading-4 text-text-main">{results.length}개 그룹 분석 완료</p>
            {skippedCount > 0 && (
                <p className="text-[10px] leading-4 text-text-sub">GPS없는 사진 {skippedCount}장 건너뜀</p>
            )}
          </div>

            <div className="!mt-3 flex flex-col gap-[15px]">
              {results.map((group) => (
                <GroupCard
                  key={group.group_index}
                  group={group}
                  files={files}
                  onSyncSchedule={(schedule) => navigateToScheduleForm(group, schedule)}
                  onCreateSchedule={() => navigateToScheduleForm(group)}
                />
              ))}
            </div>

          <button
            onClick={() => navigate('/calendar')}
              className="!mt-[15px] w-full rounded-[5px] border border-gray-border !py-2 text-xs text-text-sub"
          >
            캘린더로 돌아가기
          </button>
          </section>
      )}
      </main>
    </div>
  )
}

// ── 그룹 카드 ─────────────────────────────────────────────────
function GroupCard({ group, files, onSyncSchedule, onCreateSchedule }) {
  const dateStr = formatDate(group.date)
  const timeStr = formatTime(group.time)
  const meta = STATUS_META[group.match_type] || STATUS_META.none
  const groupFiles = getGroupFiles(group, files)
  const previewFile = groupFiles[0]
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(previewFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [previewFile])

  return (
    <article className="rounded-[10px] border border-text-sub !p-[10px]">
      {/* 헤더: 날짜/시간 + 뱃지 */}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-[9px]">
          <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[5px] bg-primary text-xs font-bold leading-4 text-white">
            {(group.group_index ?? 0) + 1}
          </div>
          <p className="truncate text-sm font-bold leading-4 text-text-main">날짜 | {dateStr}</p>
        </div>
        <span className={`shrink-0 rounded-[3px] ${meta.bg} ${meta.text} !px-[6px] text-[8px] leading-4`}>
          {meta.label}
        </span>
      </div>

      <div className="!py-[10px] !pl-[36px]">
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-sub">
            <ClockIcon />
            <span>시간 |</span>
            <span>{timeStr || '시간 정보 없음'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-sub">
            <PhotoIcon />
            <span>사진 |</span>
            <span>{group.photo_count || groupFiles.length || 0}장</span>
          </div>

          {group.match_type === 'exact' && (
            <MatchedSchedule group={group} />
          )}

          {group.match_type === 'date_only' && (
            <>
              <p className="text-[10px] leading-4 text-text-sub">같은 날짜의 일정 중 하나를 선택하거나 신규 생성하세요.</p>
            {group.candidates?.map((c) => (
              <button
                key={c.schedule_id}
                    onClick={() => onSyncSchedule({
                      id: c.schedule_id,
                      title: c.title,
                      date: c.date || group.date,
                      start_time: c.start_time,
                      end_time: c.end_time,
                      place_id: c.place_id,
                      place_name: c.place_name,
                      people_ids: c.people_ids,
                      people: c.people,
                    })}
                    className="w-full text-left"
              >
                    <p className="text-xs font-semibold leading-4 text-text-main">{c.title}</p>
                    {c.place_name && (
                      <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-sub">
                        <PlaceIcon />
                        <span>{c.place_name}</span>
                      </div>
                    )}
              </button>
            ))}
            </>
          )}

          {group.match_type === 'none' && (
            <>
              <p className="text-[10px] leading-4 text-text-sub">일치하는 일정이 없습니다.</p>
              {group.place_name && (
                <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-sub">
                  <PlaceIcon />
                  <span>{group.place_name} (자동 선택됨)</span>
                </div>
              )}
            </>
          )}

          {previewUrl && (
            <img src={previewUrl} alt="분석된 사진" className="!mt-[10px] h-[45px] w-[60px] rounded-[5px] object-cover" />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => group.match_type === 'none' ? onCreateSchedule() : onSyncSchedule({
          id: group.schedule_id,
          title: group.schedule_title,
          date: group.date,
          start_time: group.start_time || group.time,
          end_time: group.end_time,
          place_id: group.place_id,
          place_name: group.place_name,
          people_ids: group.people_ids,
          people: group.people,
        })}
        className={`flex w-full items-center justify-center rounded-[5px] !px-[10px] !py-[6px] text-[10px] font-medium leading-4 ${group.match_type === 'none' ? STATUS_META.none.action : meta.action}`}
      >
        {group.match_type === 'none' ? '+ 신규 일정 생성' : '일정 바로가기'}
      </button>
    </article>
  )
}

function MatchedSchedule({ group }) {
  return (
    <div className="flex flex-col gap-[4px]">
      {group.schedule_title && (
        <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-main">
          <CalendarIcon />
          <span>{group.schedule_title}</span>
        </div>
      )}
      {group.place_name && (
        <div className="flex items-center gap-1 text-[10px] font-medium leading-4 text-text-sub">
          <PlaceIcon />
          <span>{group.place_name}</span>
        </div>
      )}
      {group.people?.length > 0 && (
        <p className="text-[10px] leading-4 text-text-sub">
          동행인 | {group.people.map((person) => person.name).join(', ')}
        </p>
      )}
    </div>
  )
}
