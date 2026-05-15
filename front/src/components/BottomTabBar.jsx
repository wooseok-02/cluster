import { useNavigate, useLocation } from 'react-router-dom'

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.6123 15.9242C16.9979 18.415 14.1927 20.0667 11 20.0667C7.80718 20.0667 5.00096 18.4153 3.38672 15.9242L4.76855 15.0501C6.09585 17.0878 8.39035 18.4329 11 18.4329C13.6095 18.4329 15.903 17.0875 17.2305 15.0501L18.6123 15.9242ZM11 12.0169C12.9365 12.0169 14.5117 13.56 14.5645 15.4837H12.9287C12.8768 14.4623 12.0343 13.6497 11 13.6497C9.96567 13.6497 9.12318 14.4623 9.07129 15.4837H7.43555C7.48831 13.56 9.0635 12.0169 11 12.0169ZM2.75 8.34993C4.21355 8.34993 5.40039 9.53673 5.40039 11.0003C5.40021 12.4638 4.21344 13.6497 2.75 13.6497C1.28656 13.6497 0.0997851 12.4638 0.0996094 11.0003C0.0996094 9.53673 1.28645 8.34993 2.75 8.34993ZM19.25 8.34993C20.7136 8.34993 21.9004 9.53673 21.9004 11.0003C21.9002 12.4638 20.7135 13.6497 19.25 13.6497C17.7865 13.6497 16.5998 12.4638 16.5996 11.0003C16.5996 9.53673 17.7864 8.34994 19.25 8.34993ZM2.75 9.98372C2.18852 9.98372 1.7334 10.4388 1.7334 11.0003C1.73357 11.5617 2.18862 12.0169 2.75 12.0169C3.31138 12.0169 3.76643 11.5617 3.7666 11.0003C3.7666 10.4388 3.31148 9.98372 2.75 9.98372ZM19.25 9.98372C18.6885 9.98372 18.2334 10.4388 18.2334 11.0003C18.2336 11.5617 18.6886 12.0169 19.25 12.0169C19.8114 12.0169 20.2664 11.5617 20.2666 11.0003C20.2666 10.4388 19.8115 9.98372 19.25 9.98372ZM11 5.59993C12.4636 5.59993 13.6504 6.78677 13.6504 8.25033C13.6502 9.71377 12.4635 10.8997 11 10.8997C9.53651 10.8997 8.34979 9.71377 8.34961 8.25033C8.34961 6.78677 9.5364 5.59994 11 5.59993ZM11 7.23372C10.4385 7.23372 9.9834 7.68884 9.9834 8.25033C9.98357 8.81166 10.4386 9.26693 11 9.26693C11.5614 9.26693 12.0164 8.81166 12.0166 8.25033C12.0166 7.68884 11.5615 7.23372 11 7.23372ZM11 1.93294C14.1923 1.93294 16.9978 3.58423 18.6123 6.07454L17.2305 6.94954C15.903 4.91233 13.6094 3.56673 11 3.56673C8.39074 3.56679 6.09594 4.91142 4.76855 6.94857L3.3877 6.07454C5.00208 3.58417 7.80777 1.93301 11 1.93294Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="0.2"
      />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.27246 4.35579C8.4357 1.19255 13.5642 1.19256 16.7275 4.35579C19.8908 7.51904 19.8908 12.6475 16.7275 15.8109L11 21.5384L5.27246 15.8109C2.10923 12.6475 2.10922 7.51904 5.27246 4.35579ZM15.6436 5.43978C13.0792 2.87533 8.92089 2.87534 6.35645 5.43978C3.792 8.00422 3.792 12.1625 6.35645 14.7269L11 19.3704L15.6436 14.7269C18.208 12.1625 18.208 8.00422 15.6436 5.43978ZM11 6.56673C12.9422 6.56673 14.5166 8.14113 14.5166 10.0833C14.5166 12.0255 12.9422 13.5999 11 13.5999C9.0578 13.5999 7.4834 12.0255 7.4834 10.0833C7.4834 8.14113 9.0578 6.56673 11 6.56673ZM11 8.09994C9.90461 8.09994 9.0166 8.98797 9.0166 10.0833C9.0166 11.1787 9.90461 12.0667 11 12.0667C12.0954 12.0667 12.9834 11.1787 12.9834 10.0833C12.9834 8.98797 12.0954 8.09994 11 8.09994Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="0.3"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.09993 1.06706V2.90007H13.8997V1.06706H15.4329V2.90007H19.2503C19.6736 2.90024 20.0169 3.24336 20.0169 3.66667V18.3337C20.0168 18.7568 19.6735 19.1001 19.2503 19.1003H2.75033C2.32702 19.1003 1.9839 18.7569 1.98372 18.3337V3.66667C1.98372 3.24325 2.32691 2.90007 2.75033 2.90007H6.56673V1.06706H8.09993ZM3.51693 17.5671H18.4837V9.93327H3.51693V17.5671ZM3.51693 8.40007H18.4837V4.43327H15.4329V6.26628H13.8997V4.43327H8.09993V6.26628H6.56673V4.43327H3.51693V8.40007Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="0.3"
      />
    </svg>
  )
}

function MypageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.9997 12.9831C14.9167 12.9831 18.0993 16.1185 18.1794 20.0163H16.6462C16.5664 16.9654 14.0698 14.5163 10.9997 14.5163C7.92972 14.5164 5.43392 16.9655 5.35417 20.0163H3.82096C3.90104 16.1186 7.08285 12.9832 10.9997 12.9831ZM10.9997 1.06706C13.9556 1.06706 16.3503 3.46076 16.3503 6.41667C16.3503 9.37257 13.9556 11.7663 10.9997 11.7663C8.04392 11.7661 5.65007 9.37247 5.65007 6.41667C5.65007 3.46087 8.04392 1.06723 10.9997 1.06706ZM10.9997 2.60026C8.89115 2.60044 7.18327 4.3081 7.18327 6.41667C7.18327 8.52523 8.89115 10.2329 10.9997 10.2331C13.1084 10.2331 14.8171 8.52534 14.8171 6.41667C14.8171 4.30799 13.1084 2.60026 10.9997 2.60026Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="0.3"
      />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3V15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TabButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-start gap-1 border-0 bg-transparent p-0 pt-1 ${
        active ? 'text-primary' : 'text-gray-300'
      }`}
      aria-label={label}
    >
      <span className="flex h-[22px] w-[22px] items-center justify-center">{children}</span>
      <span className="max-w-full truncate text-[10px] font-medium leading-4">{label}</span>
    </button>
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

  const tabs = [
    { label: 'People', active: isPeople, onClick: () => navigate('/people'), icon: <PeopleIcon /> },
    { label: 'Map', active: isMap, onClick: () => navigate('/map'), icon: <MapIcon /> },
    { label: 'Calendar', active: isCalendar, onClick: () => navigate('/calendar'), icon: <CalendarIcon /> },
    { label: 'Mypage', active: false, onClick: () => navigate('/map'), icon: <MypageIcon /> },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[448px] -translate-x-1/2 items-start justify-between gap-1 bg-white px-4 pt-3 pb-[calc(22px+env(safe-area-inset-bottom))] shadow-[0_3px_18px_rgba(0,0,0,0.18)]"
      aria-label="하단 탭 메뉴"
    >
      <TabButton {...tabs[0]}>{tabs[0].icon}</TabButton>
      <TabButton {...tabs[1]}>{tabs[1].icon}</TabButton>
      <button
        type="button"
        onClick={handleAdd}
        className="mx-1 flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border-0 bg-primary p-0 shadow-lg shadow-primary/30"
        aria-label="Add"
      >
        <AddIcon />
      </button>
      <TabButton {...tabs[2]}>{tabs[2].icon}</TabButton>
      <TabButton {...tabs[3]}>{tabs[3].icon}</TabButton>
    </nav>
  )
}
