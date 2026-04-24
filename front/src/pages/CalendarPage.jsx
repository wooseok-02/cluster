import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScheduleList } from '../api/schedule'
import BottomTabBar from '../components/BottomTabBar'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-12
  const [schedules, setSchedules] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    setSchedules([])
    setError('')
    getScheduleList(year, month)
      .then((data) => setSchedules(data))
      .catch((err) => {
        // 404 = 해당 월 일정 없음 — 빈 캘린더로 처리
        if (err.response?.status !== 404) {
          setError('일정을 불러오는 데 실패했습니다.')
        }
      })
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
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

  // 다가오는 일정 — 오늘 이후 순서대로
  const upcomingSchedules = schedules
    .filter((s) => new Date(s.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">cluster</h1>
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
              <div key={index} className="aspect-square flex flex-col items-center justify-center relative">
                {day && (
                  <>
                    <span className={`text-sm ${
                      isToday(day)
                        ? 'bg-[#5B40E4] text-white w-7 h-7 rounded-full flex items-center justify-center'
                        : 'text-gray-900'
                    }`}>
                      {day}
                    </span>
                    {schedulesByDay[day] && !isToday(day) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B40E4] mt-0.5" />
                    )}
                  </>
                )}
              </div>
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
    </div>
  )
}
