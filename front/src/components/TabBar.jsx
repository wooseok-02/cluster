// 하단 탭 네비게이션 — /people, /map, /calendar 에서만 표시
import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { label: 'People', path: '/people' },
  { label: 'Map', path: '/map' },
  { label: 'Calendar', path: '/calendar' },
]

export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
      {TABS.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex-1 py-3 text-sm font-medium ${
            pathname === tab.path ? 'text-blue-500' : 'text-gray-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
