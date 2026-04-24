import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScheduleList } from '../api/schedule'
import BottomTabBar from '../components/BottomTabBar'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-12
  const [schedules, setSchedules] = useState([])
  const [error, setError] = useState('')
  // 바텀시트 상태: null이면 닫힘, 숫자면 선택된 날짜(day)
  const [selectedDay, setSelectedDay] = useState(null)

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
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelectedDay(null)
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

  const handleDayClick = (day) => {
    if (!day) return
    const daySchedules = schedulesByDay[day] || []
    if (daySchedules.length === 0) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`
      navigate(`/schedule/create?date=${dateStr}`)
    } else {
      setSelectedDay(day)
    }
  }

  const handleAddSchedule = () => {
    setSelectedDay(null)
    navigate(`/schedule/create?date=${selectedDateStr}`)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">cluster</h1>
        <button
          onClick={() => navigate('/photo/upload')}
          className="flex items-center gap-1 text-sm text-[#5B40E4] font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="7" width="18" height="14" rx="2" stroke="#5B40E4" strokeWidth="1.8" />
            <circle cx="12" cy="13" r="4" stroke="#5B40E4" strokeWidth="1.8" />
            <path d="M9 7L10.5 4H13.5L15 7" stroke="#5B40E4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          사진 업로드
        </button>
      </div>

      {error && <p className="text-red-500 text-sm px-4 mb-2">{error}</p>}

      {/* Month Navigation */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <button className="p-2" onClick={prevMonth}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {year}년 {MONTH_NAMES[month - 1]}
          </h2>
          <button className="p-2" onClick={nextMonth}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(day => (
              <div key={day} className="text-center text-sm text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                className={`aspect-square flex flex-col items-center justify-center relative rounded-xl transition-colors ${
                  day ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' : 'cursor-default'
                } ${selectedDay === day && day ? 'bg-[#EEE9FD]' : ''}`}
                onClick={() => handleDayClick(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <span className={`text-sm ${
                      isToday(day)
                        ? 'bg-[#5B40E4] text-white w-7 h-7 rounded-full flex items-center justify-center'
                        : selectedDay === day
                          ? 'text-[#5B40E4] font-semibold'
                          : 'text-gray-900'
                    }`}>
                      {day}
                    </span>
                    {schedulesByDay[day] && !isToday(day) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B40E4] mt-0.5" />
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Schedules */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">다가오는 일정</h3>
        {upcomingSchedules.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <p className="text-sm mb-2">다가오는 일정이 없습니다.</p>
            <button
              onClick={() => navigate('/schedule/create')}
              className="text-[#5B40E4] text-sm font-medium"
            >
              일정 추가하기 +
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSchedules.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/schedule/${s.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-12 bg-[#5B40E4] rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-500">{s.date}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />

      {/* 날짜 클릭 바텀시트 */}
      {selectedDay && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedDay(null)}
          />
          {/* 시트 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-safe">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {month}월 {selectedDay}일
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 p-1"
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 일정 목록 */}
            <div className="px-5 py-3 max-h-64 overflow-y-auto">
              {selectedSchedules.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">이 날 등록된 일정이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSchedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedDay(null); navigate(`/schedule/${s.id}`) }}
                      className="w-full flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-left hover:bg-[#EEE9FD] transition-colors"
                    >
                      <div className="w-1.5 h-8 bg-[#5B40E4] rounded-full flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-500">{s.date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 일정 추가 버튼 */}
            <div className="px-5 pb-8 pt-2">
              <button
                onClick={handleAddSchedule}
                className="w-full bg-[#5B40E4] hover:bg-[#4A32C3] text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                이 날 일정 추가
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
