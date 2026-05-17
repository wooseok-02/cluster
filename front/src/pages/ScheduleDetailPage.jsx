// 일정 상세 페이지 — 정보 표시, Planned 상태일 때 수정 및 확정 가능
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSchedule, confirmSchedule, updateSchedule } from '../api/schedule'
import { verifyPhoto } from '../api/activity'
import { getPeopleList } from '../api/people'
import { getPlaceList } from '../api/place'
import { takePendingFiles } from '../lib/pendingPhotos'

const formatDateTime = (isoString) => {
  const dt = new Date(isoString)
  const date = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
  const time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

// "2025-07-10T14:00:00" → "2025-07-10"
const toDateInput = (isoString) => new Date(isoString).toISOString().slice(0, 10)
// "2025-07-10T14:00:00" → "14:00"
const toTimeInput = (isoString) => {
  const dt = new Date(isoString)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

const getDateInput = (value) => {
  if (!value) return ''
  const text = String(value)
  const dateMatch = text.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/)
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
  }

  const dt = new Date(text)
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)

  return ''
}

const getTimeInput = (value) => {
  if (!value) return ''
  const text = String(value)
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`

  const dt = new Date(text)
  if (!Number.isNaN(dt.getTime())) {
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  return ''
}

const getEndTimeFromPhotoStart = (photoStartTime, scheduleStartTime, scheduleEndTime) => {
  if (!photoStartTime) return ''

  const [photoHour, photoMinute] = photoStartTime.split(':').map(Number)
  const [startHour, startMinute] = scheduleStartTime.split(':').map(Number)
  const [endHour, endMinute] = scheduleEndTime.split(':').map(Number)
  const currentStartMinutes = startHour * 60 + startMinute
  const currentEndMinutes = endHour * 60 + endMinute
  const duration = currentEndMinutes > currentStartMinutes ? currentEndMinutes - currentStartMinutes : 60
  const nextEndMinutes = photoHour * 60 + photoMinute + duration

  return `${String(Math.floor(nextEndMinutes / 60) % 24).padStart(2, '0')}:${String(nextEndMinutes % 60).padStart(2, '0')}`
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''
  if (typeof photo === 'string') return photo
  return photo.photo_url || photo.url || photo.image_url || photo.image || ''
}

const getSchedulePhotos = (schedule) => {
  if (!schedule) return []
  if (Array.isArray(schedule.photos)) return schedule.photos.map(getPhotoUrl).filter(Boolean)
  return [schedule.photo_url, schedule.photo, schedule.image_url, schedule.image].map(getPhotoUrl).filter(Boolean)
}

function BackIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon({ type }) {
  const paths = {
    calendar: <path d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    time: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>,
    user: <><path d="M20 21C20 17.6863 16.4183 15 12 15C7.58172 15 4 17.6863 4 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /></>,
    place: <><path d="M12 21S6 15.686 6 10.5C6 7.186 8.686 4.5 12 4.5S18 7.186 18 10.5C18 15.686 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.8" /></>,
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function AiIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5.5 14.5L6.4 17.1L9 18L6.4 18.9L5.5 21.5L4.6 18.9L2 18L4.6 17.1L5.5 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 15L18.7 17L20.7 17.7L18.7 18.4L18 20.4L17.3 18.4L15.3 17.7L17.3 17L18 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function ScheduleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [initialConfirmFiles] = useState(() => takePendingFiles())

  // 확정 관련 상태
  const confirmMemo = ''
  const [confirmPhotos, setConfirmPhotos] = useState([])
  const [confirmPhotoPreview, setConfirmPhotoPreview] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('')
  const confirmPhotoInputRef = useRef(null)

  // 사진 검증 팝업 상태
  const [verifyPopup, setVerifyPopup] = useState(null) // { type, photo_date, photo_place_name, schedule_date, schedule_place_name }

  // 수정 관련 상태
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editPeopleIds, setEditPeopleIds] = useState([])
  const [editPlaceId, setEditPlaceId] = useState(null)
  const [people, setPeople] = useState([])
  const [places, setPlaces] = useState([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [placeSearch, setPlaceSearch] = useState('')
  const [showPeopleMatches, setShowPeopleMatches] = useState(false)
  const [showPlaceMatches, setShowPlaceMatches] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getSchedule(id)
      .then((data) => setSchedule(data.data))
      .catch(() => setError('일정 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => {
      if (confirmPhotoPreview) URL.revokeObjectURL(confirmPhotoPreview)
    }
  }, [confirmPhotoPreview])

  useEffect(() => {
    if (initialConfirmFiles.length === 0) return
    const file = initialConfirmFiles[0]
    setConfirmPhotos([file])
    setConfirmPhotoPreview(URL.createObjectURL(file))
  }, [initialConfirmFiles])

  // 수정 모드 진입 시 people/place 목록 로드
  const handleEditStart = () => {
    setEditForm({
      title: schedule.title,
      date: toDateInput(schedule.start_time),
      start_time: toTimeInput(schedule.start_time),
      end_time: toTimeInput(schedule.end_time),
      memo: schedule.memo || '',
    })
    setEditPeopleIds(schedule.people.map((p) => p.id))
    setEditPlaceId(schedule.place?.id || null)
    setSaveError('')

    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })
    getPlaceList()
      .then((data) => setPlaces(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })

    setEditing(true)
  }

  const handleEditCancel = () => {
    setEditing(false)
    setPeopleSearch('')
    setPlaceSearch('')
    setShowPeopleMatches(false)
    setShowPlaceMatches(false)
  }

  const toggleEditPerson = (pid) => {
    setEditPeopleIds((prev) =>
      prev.includes(pid) ? prev.filter((i) => i !== pid) : [...prev, pid]
    )
    setPeopleSearch('')
    setShowPeopleMatches(false)
  }

  const handleSave = async (event) => {
    event?.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      const updated = await updateSchedule(id, {
        title: editForm.title,
        date: editForm.date,
        start_time: editForm.start_time + ':00',
        end_time: editForm.end_time + ':00',
        memo: editForm.memo,
        place_id: editPlaceId ?? 0,
        people_ids: editPeopleIds,
      })
      setSchedule(updated.data)
      setEditing(false)
      setPeopleSearch('')
      setPlaceSearch('')
      setShowPeopleMatches(false)
      setShowPlaceMatches(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      setSaveError(typeof detail === 'object' ? detail.message : detail || '수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const doConfirm = async () => {
    setConfirmError('')
    setConfirming(true)
    try {
      await confirmSchedule(id, confirmMemo, confirmPhotos)
      navigate('/calendar')
    } catch (err) {
      setConfirmError(err.response?.data?.detail || '확정에 실패했습니다.')
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirmPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (confirmPhotoPreview) URL.revokeObjectURL(confirmPhotoPreview)
    setConfirmPhotos([file])
    setConfirmPhotoPreview(URL.createObjectURL(file))
    setConfirmError('')
  }

  const clearConfirmPhoto = () => {
    if (confirmPhotoPreview) URL.revokeObjectURL(confirmPhotoPreview)
    setConfirmPhotoPreview('')
    setConfirmPhotos([])
    setVerifyPopup(null)
    if (confirmPhotoInputRef.current) confirmPhotoInputRef.current.value = ''
  }

  const applyPhotoInfoToSchedule = async () => {
    if (!verifyPopup) return

    const photoDate = getDateInput(
      verifyPopup.photo_date ||
      verifyPopup.date ||
      verifyPopup.taken_date ||
      verifyPopup.takenDate,
    )
    const currentStartTime = toTimeInput(schedule.start_time)
    const currentEndTime = toTimeInput(schedule.end_time)
    const photoStartTime = getTimeInput(
      verifyPopup.photo_start_time ||
      verifyPopup.start_time ||
      verifyPopup.startTime ||
      verifyPopup.photo_time ||
      verifyPopup.time,
    )
    const photoEndTime = getTimeInput(
      verifyPopup.photo_end_time ||
      verifyPopup.end_time ||
      verifyPopup.endTime,
    )
    const nextEndTime = photoEndTime || getEndTimeFromPhotoStart(photoStartTime, currentStartTime, currentEndTime)
    const photoPlaceId =
      verifyPopup.photo_place_id ??
      verifyPopup.place_id ??
      verifyPopup.place?.id ??
      schedule.place?.id ??
      0
    const photoPeopleIds =
      verifyPopup.photo_people_ids ||
      verifyPopup.people_ids ||
      verifyPopup.detected_people_ids ||
      verifyPopup.people?.map?.((person) => person.id) ||
      schedule.people?.map((person) => person.id) ||
      []

    const updated = await updateSchedule(id, {
      title: schedule.title,
      date: photoDate || toDateInput(schedule.start_time),
      start_time: photoStartTime || currentStartTime,
      end_time: nextEndTime || currentEndTime,
      memo: schedule.memo || '',
      place_id: photoPlaceId,
      people_ids: photoPeopleIds,
    })
    setSchedule(updated.data)
  }

  const handleMismatchConfirm = async () => {
    setConfirmError('')
    setConfirming(true)
    try {
      if (verifyPopup?.type !== 'missing-exif') {
        await applyPhotoInfoToSchedule()
      }
      setVerifyPopup(null)
      await doConfirm()
    } catch (err) {
      const detail = err.response?.data?.detail
      setConfirmError(typeof detail === 'object' ? detail.message : detail || '사진 정보 반영에 실패했습니다.')
      setConfirming(false)
    }
  }

  const handleConfirm = async () => {
    // 사진이 있으면 첫 번째 사진으로 검증 먼저 수행
    if (confirmPhotos.length > 0) {
      setConfirming(true)
      try {
        const result = await verifyPhoto(id, confirmPhotos[0])
        if (result.match) {
          await doConfirm()
        } else {
          setVerifyPopup({ ...result, type: result.type || 'mismatch' })
          setConfirming(false)
        }
      } catch (err) {
        const detail = err.response?.data?.detail
        const message = typeof detail === 'object'
          ? detail.message
          : detail || '사진에 GPS/EXIF 정보가 없어 일정과 비교할 수 없습니다.'
        setVerifyPopup({
          type: 'missing-exif',
          message,
          schedule_date: start.date,
          schedule_place_name: schedule.place?.name || '-',
        })
        setConfirming(false)
      }
    } else {
      await doConfirm()
    }
  }

  if (loading) return <p className="!p-4">불러오는 중...</p>
  if (error) return <p className="!p-4 text-red-500">{error}</p>

  const start = formatDateTime(schedule.start_time)
  const end = formatDateTime(schedule.end_time)
  const schedulePhotos = getSchedulePhotos(schedule)

  const selectedPeopleNames = people.length > 0
    ? people.filter((p) => editPeopleIds.includes(p.id)).map((p) => p.name)
    : schedule.people?.filter((p) => editPeopleIds.includes(p.id)).map((p) => p.name) || []
  const selectedPlaceName = places.find((pl) => pl.id === editPlaceId)?.name || schedule.place?.name
  const trimmedPeopleSearch = peopleSearch.trim().toLowerCase()
  const trimmedPlaceSearch = placeSearch.trim().toLowerCase()
  const matchingPeople = showPeopleMatches && trimmedPeopleSearch
    ? people.filter((p) => p.name.toLowerCase().startsWith(trimmedPeopleSearch))
    : []
  const matchingPlaces = showPlaceMatches && trimmedPlaceSearch
    ? places.filter((pl) => pl.name.toLowerCase().startsWith(trimmedPlaceSearch))
    : []

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-white !pb-[110px]">
      {/* 사진 검증 불일치 팝업 */}
      {verifyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[340px] rounded-[16px] bg-white !mx-4 !p-6 shadow-lg">
            <p className="text-base font-bold leading-5 text-text-main">
              {verifyPopup.type === 'missing-exif'
                ? '사진 정보를 확인할 수 없습니다.'
                : '현재 계획된 일정과 다릅니다.'}
            </p>
            {verifyPopup.type === 'missing-exif' ? (
              <p className="!mt-4 text-sm leading-5 text-text-sub">
                {verifyPopup.message}
              </p>
            ) : (
              <div className="!mt-4 space-y-1 text-sm leading-5 text-text-sub">
                <p>사진: {verifyPopup.photo_date ?? '-'} / {verifyPopup.photo_place_name ?? '-'}</p>
                <p>일정: {verifyPopup.schedule_date ?? '-'} / {verifyPopup.schedule_place_name ?? '-'}</p>
              </div>
            )}
            <p className="!mt-4 text-sm font-medium leading-5 text-text-main">
              그래도 사진을 넣겠습니까?
            </p>
            <div className="!mt-5 flex gap-2">
              <button
                type="button"
                onClick={clearConfirmPhoto}
                className="flex-1 rounded-[10px] border border-gray-border !py-3 text-sm font-semibold text-text-sub"
              >
                아니오
              </button>
              <button
                type="button"
                onClick={handleMismatchConfirm}
                disabled={confirming}
                className="flex-1 rounded-[10px] bg-primary !py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 !px-4"
          onClick={() => setSelectedPhotoUrl('')}
        >
          <button
            type="button"
            onClick={() => setSelectedPhotoUrl('')}
            className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="사진 닫기"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={selectedPhotoUrl}
            alt="확대된 일정 사진"
            className="max-h-[82vh] max-w-full rounded-[10px] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <header className="sticky top-0 z-10 flex items-center justify-center bg-white !px-[23px] !pt-5 !pb-[10px]">
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="absolute left-[23px] top-3 flex size-[30px] items-center justify-center text-text-main"
          aria-label="뒤로"
        >
          <BackIcon />
        </button>
        <h1 className="text-base font-semibold leading-4 text-text-main">일정 확정</h1>
      </header>

      <main className="!px-[30px] !pt-[28px]">
        <div className="flex items-center justify-between !mb-4">
          <h2 className="text-xl font-bold leading-6 text-text-main">{schedule.title}</h2>
          <div className="flex items-center gap-2">
            <span className={`rounded-[3px] !px-[6px] text-[8px] leading-4 ${
              schedule.status === 'Planned' ? 'bg-calendar-planning-bg text-calendar-planning' : 'bg-calendar-completed-bg text-calendar-completed'
            }`}>
              {schedule.status}
            </span>
          {schedule.status === 'Planned' && !editing && (
            <button
              onClick={handleEditStart}
                className="rounded-[3px] border border-gray-border !px-[6px] text-[8px] leading-4 text-text-sub"
            >
              수정
            </button>
          )}
          </div>
        </div>

      {/* 수정 폼 */}
      {editing && editForm ? (
        <form onSubmit={handleSave} className="flex flex-col gap-[15px] !mb-6">
          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-text-main">일정 이름</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
              className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-sm text-text-main outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-text-main">날짜</label>
            <div className="relative w-full min-w-0">
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                required
                className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] !pr-10 text-xs text-text-main outline-none focus:border-primary"
              />
              <svg className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-text-sub" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] items-end gap-[10px]">
            <div className="flex min-w-0 flex-col gap-[10px]">
              <label className="text-sm font-medium leading-4 text-text-main">시작 시간</label>
              <input
                type="time"
                value={editForm.start_time}
                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                required
                className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none focus:border-primary"
              />
            </div>
            <span className="flex h-10 items-center justify-center text-xl leading-4 text-gray-400">~</span>
            <div className="flex min-w-0 flex-col gap-[10px]">
              <label className="text-sm font-medium leading-4 text-text-main">종료 시간</label>
              <input
                type="time"
                value={editForm.end_time}
                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                required
                className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-4 text-text-main">
                  동행인
                  {selectedPeopleNames.length > 0 && (
                    <span className="!ml-2 text-xs font-normal text-primary">{selectedPeopleNames.join(', ')}</span>
                  )}
                </label>
              </div>
              <input
                type="text"
                value={peopleSearch}
                onChange={(e) => {
                  setPeopleSearch(e.target.value)
                  setShowPeopleMatches(true)
                }}
                placeholder="이름으로 검색"
                className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none placeholder:text-gray-400 focus:border-primary"
              />
            </div>
            {matchingPeople.length > 0 && (
              <div className="flex flex-col overflow-hidden rounded-[10px] border border-gray-border bg-white">
                {matchingPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleEditPerson(person.id)}
                    className={`w-full !px-[10px] !py-2 text-left text-xs leading-4 ${
                      editPeopleIds.includes(person.id)
                        ? 'bg-primary-light text-primary'
                        : 'text-text-main active:bg-gray-50'
                    }`}
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-4 text-text-main">
                  장소
                  {selectedPlaceName && (
                    <span className="!ml-2 text-xs font-normal text-primary">{selectedPlaceName}</span>
                  )}
                </label>
              </div>
              <input
                type="text"
                value={placeSearch}
                onChange={(e) => {
                  setPlaceSearch(e.target.value)
                  setShowPlaceMatches(true)
                }}
                placeholder="장소명으로 검색"
                className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none placeholder:text-gray-400 focus:border-primary"
              />
            </div>
            {matchingPlaces.length > 0 && (
              <div className="flex flex-col overflow-hidden rounded-[10px] border border-gray-border bg-white">
                {matchingPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      setEditPlaceId(place.id)
                      setPlaceSearch('')
                      setShowPlaceMatches(false)
                    }}
                    className={`w-full !px-[10px] !py-2 text-left text-xs leading-4 ${
                      editPlaceId === place.id
                        ? 'bg-primary-light text-primary'
                        : 'text-text-main active:bg-gray-50'
                    }`}
                  >
                    {place.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-text-main">메모</label>
            <textarea
              value={editForm.memo}
              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
              rows={3}
              className="min-h-[50px] w-full resize-none rounded-[10px] border border-gray-400 bg-white !px-[10px] !py-2 text-sm text-text-main outline-none focus:border-primary"
            />
          </div>

          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="!mt-[3px] flex w-full items-center justify-center rounded-[10px] bg-primary !px-[10px] !py-[15px] text-base font-semibold leading-4 text-white disabled:opacity-50"
          >
            {saving ? '저장 중...' : '확인'}
          </button>

          <button
            type="button"
            onClick={handleEditCancel}
            className="flex w-full items-center justify-center rounded-[10px] border border-gray-border !px-[10px] !py-[13px] text-sm font-semibold leading-4 text-text-sub"
          >
            취소
          </button>
        </form>
      ) : (
        /* 일정 정보 표시 */
          <section className="rounded-[10px] border border-text-sub !py-[10px] !pl-[20px] !pr-[10px]">
            <div className="flex flex-col gap-[10px] !pl-[10px] !py-[10px]">
              <div className="flex flex-col gap-[4px] text-[10px] font-medium leading-4 text-text-sub">
                <div className="flex items-center gap-1">
                  <InfoIcon type="calendar" />
                  <span>날짜 |</span>
                  <span>{start.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <InfoIcon type="time" />
                  <span>시간 |</span>
                  <span>{start.time}</span>
                  <span>~</span>
                  <span>{end.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <InfoIcon type="user" />
                  <span>동행인 |</span>
                  <span>{schedule.people?.length > 0 ? schedule.people.map((p) => p.name).join(', ') : '없음'}</span>
                </div>
                <p className="font-normal">{schedule.memo || '메모'}</p>
                <div className="flex items-center gap-1">
                  <InfoIcon type="place" />
                  <span>{schedule.place?.name || '없음'}</span>
                </div>
              </div>

          {/* 사진 목록 */}
              {schedulePhotos.length > 0 && (
                <div className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto !pt-[10px]">
                  {schedulePhotos.map((photoUrl, index) => (
                    <button
                      key={`${photoUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedPhotoUrl(photoUrl)}
                      className="h-[75px] w-[90px] shrink-0 snap-start overflow-hidden rounded-[5px] bg-gray-100"
                    >
                      <img
                        src={photoUrl}
                        alt="일정 사진"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
      )}

      {/* 확정 섹션 — Planned 상태이고 수정 모드가 아닐 때만 표시 */}
      {schedule.status === 'Planned' && !editing && (
        <section className="!mt-5 rounded-[10px] border border-gray-400 !px-[10px] !py-[15px]">
          <div className="flex gap-[18px]">
            <div className="flex size-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-primary-light text-primary">
              {confirmPhotoPreview ? (
                <img src={confirmPhotoPreview} alt="분석할 사진" className="h-full w-full object-cover" />
              ) : (
                <AiIcon />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium leading-4 text-text-main">일정과 비교할 사진을 1장 선택하세요.</p>
              <p className="text-[8px] leading-4 text-people-status-old">날짜, 시간, 장소, 인물이 다르면 확인 후 반영할 수 있어요.</p>
              <div className="!mt-1 flex items-center gap-[6px]">
                <button
                  type="button"
                  onClick={() => confirmPhotoInputRef.current?.click()}
                  className="text-[10px] font-medium leading-4 text-primary underline"
                >
                  파일 선택
                </button>
                <span className="text-xs text-text-sub">◆</span>
                <span className="text-[10px] font-medium leading-4 text-text-main">
                  {confirmPhotos.length > 0 ? '1장의 사진' : '0장의 사진'}
                </span>
              </div>
              <p className="text-[8px] leading-4 text-text-sub">
                {confirmPhotos.length > 0 ? '1장 선택됨' : '사진 없음'}
              </p>
            </div>
          </div>

          <input
            ref={confirmPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleConfirmPhotoChange}
            className="hidden"
          />

          {confirmError && <p className="!mt-2 text-xs text-red-500">{confirmError}</p>}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="!mt-[14px] flex w-full items-center justify-center rounded-[10px] bg-primary !px-[10px] !py-[15px] text-base font-semibold leading-4 text-white disabled:opacity-50"
          >
            {confirming ? '확정 중...' : '확정'}
          </button>
        </section>
      )}
      </main>
    </div>
  )
}
