import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScheduleList } from '../api/schedule'
import BottomTabBar from '../components/BottomTabBar'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const SELECTED_SHEET_HEADER_HEIGHT = 78
const SELECTED_SHEET_ITEM_HEIGHT = 82
const SELECTED_SHEET_ITEM_GAP = 10
const SELECTED_SHEET_BOTTOM_PADDING = 34
const STATUS_META = {
  planning: {
    label: 'Planning',
    dot: 'bg-calendar-planning',
    bg: 'bg-calendar-planning-bg',
    text: 'text-calendar-planning',
    border: 'border-calendar-planning',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-calendar-completed',
    bg: 'bg-calendar-completed-bg',
    text: 'text-calendar-completed',
    border: 'border-calendar-completed',
  },
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function getScheduleStatus(schedule) {
  const status = String(schedule?.status || schedule?.category || '').toLowerCase()
  if (status.includes('complete') || status.includes('완료')) return 'completed'
  return 'planning'
}

function formatTimeValue(value) {
  if (!value) return ''
  const text = String(value)
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`

  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return text
}

function getScheduleTime(schedule) {
  const start = formatTimeValue(
    schedule?.time ||
    schedule?.start_time ||
    schedule?.startTime ||
    schedule?.start_at ||
    schedule?.startAt ||
    schedule?.started_at ||
    schedule?.startedAt ||
    schedule?.start_datetime ||
    schedule?.startDateTime,
  )
  const end = formatTimeValue(
    schedule?.end_time ||
    schedule?.endTime ||
    schedule?.end_at ||
    schedule?.endAt ||
    schedule?.ended_at ||
    schedule?.endedAt ||
    schedule?.end_datetime ||
    schedule?.endDateTime,
  )

  if (start && end) return `${start} ~ ${end}`
  return start || '시간 미정'
}

function getPhotoUrl(photo) {
  if (!photo) return ''
  if (typeof photo === 'string') return photo
  return (
    photo.photo_url ||
    photo.photoUrl ||
    photo.image_url ||
    photo.imageUrl ||
    photo.url ||
    photo.file_url ||
    photo.fileUrl ||
    photo.thumbnail_url ||
    photo.thumbnailUrl ||
    ''
  )
}

function getSchedulePhotos(schedule) {
  const candidates = [
    schedule?.photos,
    schedule?.images,
    schedule?.photo_urls,
    schedule?.photoUrls,
    schedule?.image_urls,
    schedule?.imageUrls,
    schedule?.activity_photos,
    schedule?.activityPhotos,
  ]

  const nestedLogs = schedule?.activity_logs || schedule?.activityLogs || schedule?.logs
  if (Array.isArray(nestedLogs)) {
    nestedLogs.forEach((log) => {
      candidates.push(log.photos, log.images, log.photo_urls, log.photoUrls)
    })
  }

  const photos = candidates
    .flatMap((candidate) => Array.isArray(candidate) ? candidate : candidate ? [candidate] : [])
    .map(getPhotoUrl)
    .filter(Boolean)

  return [...new Set(photos)]
}

function getSchedulePhotoCount(schedule) {
  const photos = getSchedulePhotos(schedule)
  if (photos.length > 0) return photos.length
  return (
    Number(
      schedule?.photo_count ??
      schedule?.photoCount ??
      schedule?.photos_count ??
      schedule?.photosCount ??
      schedule?.image_count ??
      schedule?.imageCount ??
      0,
    ) || 0
  )
}

function getWeekdayLabel(year, month, day) {
  return DAY_LABELS[new Date(year, month - 1, day).getDay()]
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.planning
  return (
    <span className={`inline-flex items-center rounded-[3px] ${meta.bg} ${meta.text} !px-[6px] text-[8px] font-medium leading-4`}>
      {meta.label}
    </span>
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

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M7 17L11 13.5L13.5 15.5L16 13L20 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-12
  const [schedules, setSchedules] = useState([])
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [isSelectedSheetOpen, setIsSelectedSheetOpen] = useState(false)
  const [sheetDragStartY, setSheetDragStartY] = useState(null)

  useEffect(() => {
    setSchedules([])
    setError('')
    getScheduleList(year, month)
      .then((data) => setSchedules(data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError('일정을 불러오는 데 실패했습니다.')
        }
      })
  }, [year, month])

  const prevMonth = () => {
    setSelectedDay(null)
    setIsSelectedSheetOpen(false)
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelectedDay(null)
    setIsSelectedSheetOpen(false)
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // 캘린더 그리드 계산
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // 날짜별 일정 매핑
  const schedulesByDay = {}
  schedules.forEach((s) => {
    const day = new Date(s.date).getDate()
    if (!schedulesByDay[day]) schedulesByDay[day] = []
    schedulesByDay[day].push(s)
  })

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear()

  // 다가오는 일정 — 오늘 이후 Planned 상태만, 날짜 순
  const upcomingSchedules = schedules
    .filter((s) => s.status === 'Planned' && new Date(s.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  // 선택된 날짜의 일정 목록
  const selectedDateStr = selectedDay
    ? `${year}-${pad(month)}-${pad(selectedDay)}`
    : null
  const selectedSchedules = selectedDay ? (schedulesByDay[selectedDay] || []) : []
  const selectedSheetListHeight = selectedSchedules.length > 0
    ? (selectedSchedules.length * SELECTED_SHEET_ITEM_HEIGHT) + ((selectedSchedules.length - 1) * SELECTED_SHEET_ITEM_GAP)
    : 44
  const selectedSheetHeight = isSelectedSheetOpen
    ? SELECTED_SHEET_HEADER_HEIGHT + selectedSheetListHeight + SELECTED_SHEET_BOTTOM_PADDING
    : SELECTED_SHEET_HEADER_HEIGHT

  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(day)
    setIsSelectedSheetOpen(false)
  }

  const handleAddSchedule = () => {
    setSelectedDay(null)
    setIsSelectedSheetOpen(false)
    navigate(`/schedule/create?date=${selectedDateStr}`)
  }

  const handleSelectedSheetPointerUp = (event) => {
    if (sheetDragStartY === null) return
    const dragDistance = event.clientY - sheetDragStartY
    if (dragDistance < -18) setIsSelectedSheetOpen(true)
    if (dragDistance > 18) setIsSelectedSheetOpen(false)
    setSheetDragStartY(null)
  }

  return (
    <div
      className="min-h-screen w-full max-w-[448px] mx-auto overflow-y-auto bg-white"
      style={{ paddingBottom: selectedDay ? selectedSheetHeight + 125 : 118 }}
    >
      {/* Header */}
      <div className="!px-[30px] !pt-5 !pb-[22px] flex items-center justify-between">
        <h1 className="text-[26px] font-bold leading-none text-text-main">cluster</h1>
        <button
          onClick={() => navigate('/photo/upload')}
          className="flex items-center gap-[5px] text-xs font-semibold text-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 7L10.5 4H13.5L15 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          사진 업로드
        </button>
      </div>

      {error && <p className="text-red-500 text-sm !px-[30px] !mb-3">{error}</p>}

      {/* Month Navigation */}
      <div className="!px-[22px]">
        <div className="relative overflow-hidden rounded-[22px] border border-gray-border bg-white shadow-sm">
          <div className="flex items-center justify-between !px-3 !pt-4 !pb-3">
          <button className="!p-2 text-text-main" onClick={prevMonth} aria-label="이전 달">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-text-main">
            {year}년 {MONTH_NAMES[month - 1]}
          </h2>
          <button className="!p-2 text-text-main" onClick={nextMonth} aria-label="다음 달">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

          <div className="flex items-center gap-[10px] !px-[15px] !py-[5px] !mx-4 !mb-3 rounded-full bg-gray-50 w-fit">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-[5px]">
                <span className={`block size-[7px] rounded-full ${meta.dot}`} />
                <span className="text-xs leading-4 text-text-main">{meta.label}</span>
              </div>
            ))}
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 !px-3 !mb-2">
            {DAY_LABELS.map(day => (
              <div key={day} className="text-center text-xs text-text-sub !py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-y-2 !px-3 !pb-4">
            {days.map((day, index) => (
              <button
                key={index}
                className={`aspect-square min-h-[42px] flex flex-col items-center justify-center relative rounded-xl transition-colors ${
                  day ? 'active:bg-gray-50 cursor-pointer' : 'cursor-default'
                } ${selectedDay === day && day ? 'bg-primary-light' : ''}`}
                onClick={() => handleDayClick(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <span className={`text-sm ${
                      isToday(day)
                        ? 'bg-primary text-white size-[28px] rounded-full flex items-center justify-center'
                        : selectedDay === day
                          ? 'text-primary font-semibold'
                          : 'text-text-main'
                    }`}>
                      {day}
                    </span>
                    {schedulesByDay[day] && (
                      <div className="flex items-center justify-center gap-0.5 !mt-1">
                        {schedulesByDay[day].slice(0, 2).map((schedule, scheduleIndex) => {
                          const meta = STATUS_META[getScheduleStatus(schedule)]
                          return <span key={schedule.id || `${day}-${scheduleIndex}`} className={`block size-[4px] rounded-full ${meta.dot}`} />
                        })}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Schedules */}
      <div className="!px-[30px] !mt-6">
        <h3 className="text-lg font-bold text-text-main !mb-4">다가오는 일정</h3>
        {upcomingSchedules.length === 0 ? (
          <div className="flex flex-col items-center rounded-[16px] border border-gray-border bg-gray-50 !py-8 text-text-sub">
            <p className="text-sm !mb-2">다가오는 일정이 없습니다.</p>
            <button
              onClick={() => navigate('/schedule/create')}
              className="text-primary text-sm font-semibold"
            >
              일정 추가하기 +
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {upcomingSchedules.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/schedule/${s.id}`)}
                className="w-full rounded-[10px] border border-gray-border bg-white !p-[10px] text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`h-[52px] w-[4px] rounded-full ${STATUS_META[getScheduleStatus(s)].dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold leading-5 text-text-main">{s.title}</p>
                      <p className="!mt-1 text-xs leading-4 text-text-sub">{s.date}</p>
                    </div>
                  </div>
                  <StatusPill status={getScheduleStatus(s)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />

      {/* 날짜 선택 슬라이드 패널 */}
      {selectedDay && (
        <div
          className="fixed bottom-[85px] left-1/2 z-40 w-full max-w-[448px] -translate-x-1/2 overflow-hidden rounded-t-[20px] bg-white shadow-[0px_-2px_5px_0px_rgba(164,164,164,0.4)] transition-[height] duration-200 ease-out"
          style={{ height: selectedSheetHeight }}
        >
          <div
            className="touch-none"
            onPointerDown={(event) => setSheetDragStartY(event.clientY)}
            onPointerUp={handleSelectedSheetPointerUp}
            onPointerCancel={() => setSheetDragStartY(null)}
          >
            <button
              type="button"
              className="flex w-full justify-center !pt-3 !pb-1"
              aria-label="선택 날짜 일정 패널 열기"
            >
              <span className="h-[5px] w-[61px] rounded-full bg-gray-200" />
            </button>

            <div className="flex items-center justify-between gap-3 !px-[30px] !pt-2 !pb-4">
              <h3 className="text-[15px] font-semibold leading-4 text-text-main">
                {month}월 {selectedDay}일 ({getWeekdayLabel(year, month, selectedDay)})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddSchedule}
                  className="flex size-8 items-center justify-center rounded-[6px] bg-black text-white"
                  aria-label="일정 추가"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  onClick={() => { setSelectedDay(null); setIsSelectedSheetOpen(false) }}
                  className="!p-1 text-text-sub"
                  aria-label="닫기"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isSelectedSheetOpen && (
            <div className="!px-[30px] !pb-[34px]">
                {selectedSchedules.length === 0 ? (
                  <p className="text-sm text-text-sub !py-3 text-center">이 날 등록된 일정이 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-[10px]">
                    {selectedSchedules.map((s) => {
                      const photos = getSchedulePhotos(s)
                      const firstPhoto = photos[0]
                      const photoCount = getSchedulePhotoCount(s)

                      return (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedDay(null); setIsSelectedSheetOpen(false); navigate(`/schedule/${s.id}`) }}
                          className="w-full rounded-[10px] border border-gray-border bg-white !p-[10px] text-left transition-colors active:bg-primary-light"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-[60px] w-[90px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-gray-100 text-gray-400">
                                {firstPhoto ? (
                                  <img src={firstPhoto} alt={s.title || '일정 사진'} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon />
                                )}
                              </div>
                              <div className="flex min-w-0 flex-col gap-[10px]">
                                <p className="truncate text-base font-semibold leading-4 text-text-main">{s.title}</p>
                                <div className="flex flex-col gap-[2px] text-[10px] font-medium leading-4 text-text-sub">
                                  <div className="flex items-center gap-1">
                                    <ClockIcon />
                                    <span>시간 |</span>
                                    <span>{getScheduleTime(s)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ImageIcon />
                                    <span>사진 |</span>
                                    <span>{photoCount}장</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <StatusPill status={getScheduleStatus(s)} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
