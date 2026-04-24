import { useNavigate, useLocation } from 'react-router-dom'

function PeopleIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" />
      <circle cx="6" cy="16" r="2.2" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.5" />
      <circle cx="18" cy="16" r="2.2" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.5" />
      <line x1="9" y1="10.5" x2="6.5" y2="13.5" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="10.5" x2="17.5" y2="13.5" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MapIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.686 2 6 4.686 6 8C6 12.5 12 20 12 20C12 20 18 12.5 18 8C18 4.686 15.314 2 12 2Z"
        stroke={active ? '#5B40E4' : '#9CA3AF'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="2" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.5" />
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="7" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MypageIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" />
      <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={active ? '#5B40E4' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname.startsWith(path)
  const isPeople = isActive('/people')
  const isMap = isActive('/map')
  const isCalendar = isActive('/calendar')

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] bg-white border-t border-gray-100 flex items-end justify-around px-4 pt-3 pb-6 z-50"
      style={{ boxShadow: '0 -1px 6px rgba(0,0,0,0.06)' }}
    >
      {/* People */}
      <button
        onClick={() => navigate('/people')}
        className="flex flex-col items-center gap-1 min-w-[56px]"
        aria-label="People"
      >
        <PeopleIcon active={isPeople} />
        <span className={`text-[11px] font-medium ${isPeople ? 'text-[#5B40E4]' : 'text-gray-400'}`}>People</span>
      </button>

      {/* Map */}
      <button
        onClick={() => navigate('/map')}
        className="flex flex-col items-center gap-1 min-w-[56px]"
        aria-label="Map"
      >
        <MapIcon active={isMap} />
        <span className={`text-[11px] font-medium ${isMap ? 'text-[#5B40E4]' : 'text-gray-400'}`}>Map</span>
      </button>

      {/* 중앙 + 버튼 */}
      <button
        onClick={() => navigate('/people/register')}
        className="flex flex-col items-center -mt-6 min-w-[56px]"
        aria-label="Add"
      >
        <div className="w-14 h-14 rounded-full bg-[#5B40E4] flex items-center justify-center shadow-lg">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <line x1="14" y1="6" x2="14" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="6" y1="14" x2="22" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Calendar */}
      <button
        onClick={() => navigate('/calendar')}
        className="flex flex-col items-center gap-1 min-w-[56px]"
        aria-label="Calendar"
      >
        <CalendarIcon active={isCalendar} />
        <span className={`text-[11px] font-medium ${isCalendar ? 'text-[#5B40E4]' : 'text-gray-400'}`}>Calendar</span>
      </button>

      {/* Mypage (빈 자리 균형용) */}
      <button
        onClick={() => navigate('/map')}
        className="flex flex-col items-center gap-1 min-w-[56px]"
        aria-label="Mypage"
      >
        <MypageIcon active={false} />
        <span className="text-[11px] font-medium text-gray-400">Mypage</span>
      </button>
    </nav>
  )
}
