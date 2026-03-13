// Calendar 탭 — 월별 일정 캘린더 뷰, 일정 클릭 시 상세 이동
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScheduleList } from '../api/schedule'
import TabBar from '../components/TabBar'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

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
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0=일
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = [
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

  return (
    <div className="flex flex-col h-screen pb-12">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">Calendar</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/photo/upload')}
              className="border px-3 py-1 rounded text-sm text-gray-600"
            >
              사진 업로드
            </button>
            <button
              onClick={() => navigate('/schedule/create')}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              + New
            </button>
          </div>
        </div>
        {/* 월 이동 */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={prevMonth} className="text-gray-500 px-2">{'<'}</button>
          <span className="font-medium">{year}년 {month}월</span>
          <button onClick={nextMonth} className="text-gray-500 px-2">{'>'}</button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm px-4 pt-2">{error}</p>}

      {/* 캘린더 그리드 */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>
        {/* 날짜 셀 */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, idx) => (
            <div
              key={idx}
              className="min-h-14 border rounded p-1 bg-white"
            >
              {day && (
                <>
                  <p className={`text-xs mb-1 ${
                    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
                      ? 'text-blue-500 font-bold'
                      : 'text-gray-600'
                  }`}>
                    {day}
                  </p>
                  {(schedulesByDay[day] || []).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/schedule/${s.id}`)}
                      className="w-full text-left text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 mb-0.5 truncate"
                    >
                      {s.title}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  )
}
