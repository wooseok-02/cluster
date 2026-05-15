import { useNavigate, useLocation } from 'react-router-dom'

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 11C14.7614 11 17 13.2386 17 16V22H15V16C15 14.3431 13.6569 13 12 13C10.3431 13 9 14.3431 9 16V22H7V16C7 13.2386 9.23858 11 12 11ZM5.5 14C5.77885 14 6.05009 14.0326 6.3101 14.0942C6.14202 14.594 6.03873 15.122 6.00839 15.6693L6 16V16.0856C5.84361 16.0302 5.67558 16 5.5 16C4.67157 16 4 16.6716 4 17.5V22H2V17.5C2 15.567 3.567 14 5.5 14ZM18.5 14C20.433 14 22 15.567 22 17.5V22H20V17.5C20 16.6716 19.3284 16 18.5 16C18.3244 16 18.1564 16.0302 18 16.0856V16C18 15.3343 17.8916 14.694 17.6915 14.0956C17.9499 14.0326 18.2211 14 18.5 14ZM5.5 8C6.88071 8 8 9.11929 8 10.5C8 11.8807 6.88071 13 5.5 13C4.11929 13 3 11.8807 3 10.5C3 9.11929 4.11929 8 5.5 8ZM18.5 8C19.8807 8 21 9.11929 21 10.5C21 11.8807 19.8807 13 18.5 13C17.1193 13 16 11.8807 16 10.5C16 9.11929 17.1193 8 18.5 8ZM5.5 10C5.22386 10 5 10.2239 5 10.5C5 10.7761 5.22386 11 5.5 11C5.77614 11 6 10.7761 6 10.5C6 10.2239 5.77614 10 5.5 10ZM18.5 10C18.2239 10 18 10.2239 18 10.5C18 10.7761 18.2239 11 18.5 11C18.7761 11 19 10.7761 19 10.5C19 10.2239 18.7761 10 18.5 10ZM12 2C14.2091 2 16 3.79086 16 6C16 8.20914 14.2091 10 12 10C9.79086 10 8 8.20914 8 6C8 3.79086 9.79086 2 12 2ZM12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4Z" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 23.728L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364L12 23.728ZM16.9497 15.9497C19.6834 13.2161 19.6834 8.78392 16.9497 6.05025C14.2161 3.31658 9.78392 3.31658 7.05025 6.05025C4.31658 8.78392 4.31658 13.2161 7.05025 15.9497L12 20.8995L16.9497 15.9497ZM12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13ZM12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM15 5H9V7H7V5H4V9H20V5H17V7H15V5ZM20 11H4V19H20V11Z" />
    </svg>
  )
}

function MypageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H18C18 18.6863 15.3137 16 12 16C8.68629 16 6 18.6863 6 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11Z" />
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex h-[85px] w-full max-w-[448px] items-end justify-between rounded-t-[20px] bg-white !px-[30px] !pb-[30px] !pt-[10px] shadow-[0_3px_9px_rgba(0,0,0,0.18)]"
    >
      {/* People */}
      <button
        onClick={() => navigate('/people')}
        className={`flex min-w-[42px] flex-col items-center justify-center ${isPeople ? 'text-primary' : 'text-[#BBBBBB]'}`}
        aria-label="People"
      >
        <PeopleIcon />
        <span className="text-[10px] font-medium leading-4">People</span>
      </button>

      {/* Map */}
      <button
        onClick={() => navigate('/map')}
        className={`flex min-w-[42px] flex-col items-center justify-center ${isMap ? 'text-primary' : 'text-[#BBBBBB]'}`}
        aria-label="Map"
      >
        <MapIcon />
        <span className="text-[10px] font-medium leading-4">Map</span>
      </button>

      {/* 중앙 + 버튼 */}
      <button
        onClick={handleAdd}
        className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-primary text-white"
        aria-label="Add"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Calendar */}
      <button
        onClick={() => navigate('/calendar')}
        className={`flex min-w-[42px] flex-col items-center justify-center ${isCalendar ? 'text-primary' : 'text-[#BBBBBB]'}`}
        aria-label="Calendar"
      >
        <CalendarIcon />
        <span className="text-[10px] font-medium leading-4">Calendar</span>
      </button>

      {/* Mypage */}
      <button
        onClick={() => navigate('/map')}
        className="flex min-w-[42px] flex-col items-center justify-center text-[#BBBBBB]"
        aria-label="Mypage"
      >
        <MypageIcon />
        <span className="text-[10px] font-medium leading-4">Mypage</span>
      </button>
    </nav>
  )
}
