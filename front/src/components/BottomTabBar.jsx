import { useNavigate, useLocation } from 'react-router-dom'

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="10.5" x2="6.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="10.5" x2="17.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.686 2 6 4.686 6 8C6 12.5 12 20 12 20C12 20 18 12.5 18 8C18 4.686 15.314 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MypageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

  const handleAdd = () => {
    if (isMap) navigate('/place/register')
    else if (isCalendar) navigate('/photo/upload')
    else navigate('/people/register')
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] bg-white flex items-end justify-between px-[30px] pt-[10px] pb-[30px] z-50"
      style={{ boxShadow: '0 3px 18px rgba(0,0,0,0.18)' }}
    >
      {/* People */}
      <button
        onClick={() => navigate('/people')}
        className={`flex flex-col items-center min-w-[42px] ${isPeople ? 'text-primary' : 'text-gray-300'}`}
        aria-label="People"
      >
        <PeopleIcon />
        <span className="text-[10px] font-medium leading-4">People</span>
      </button>

      {/* Map */}
      <button
        onClick={() => navigate('/map')}
        className={`flex flex-col items-center min-w-[42px] ${isMap ? 'text-primary' : 'text-gray-300'}`}
        aria-label="Map"
      >
        <MapIcon />
        <span className="text-[10px] font-medium leading-4">Map</span>
      </button>

      {/* 중앙 + 버튼 */}
      <button
        onClick={handleAdd}
        className="flex items-center justify-center w-[45px] h-[45px] rounded-full bg-primary"
        aria-label="Add"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="8" y1="2" x2="8" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="8" x2="14" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Calendar */}
      <button
        onClick={() => navigate('/calendar')}
        className={`flex flex-col items-center min-w-[42px] ${isCalendar ? 'text-primary' : 'text-gray-300'}`}
        aria-label="Calendar"
      >
        <CalendarIcon />
        <span className="text-[10px] font-medium leading-4">Calendar</span>
      </button>

      {/* Mypage */}
      <button
        onClick={() => navigate('/map')}
        className="flex flex-col items-center min-w-[42px] text-gray-300"
        aria-label="Mypage"
      >
        <MypageIcon />
        <span className="text-[10px] font-medium leading-4">Mypage</span>
      </button>
    </nav>
  )
}
