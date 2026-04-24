// 등록된 사람 목록 페이지 — ClusterView UI로 시각화
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPeopleList } from '../api/people'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import BottomTabBar from '../components/BottomTabBar'

function Avatar({ name, image, size = 52, status = null }) {
  const getStatusColor = (status) => {
    const colors = {
      New: 'from-blue-100 to-blue-50 ring-2 ring-blue-400',
      Best: 'from-pink-100 to-pink-50 ring-2 ring-pink-400',
      Old: 'from-gray-100 to-gray-50 ring-2 ring-gray-400',
    }
    return colors[status] || 'from-purple-100 to-pink-100'
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-gradient-to-br ${getStatusColor(status)} flex items-center justify-center text-gray-700 font-semibold shadow-md`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : name?.[0]}
    </div>
  )
}

// 최대 6명 지원 클러스터 배치 좌표
const POSITION_COORDS = [
  { left: '31%', top: '31%' },
  { left: '72%', top: '14%' },
  { left: '12%', top: '54%' },
  { left: '74%', top: '54%' },
  { left: '23%', top: '76%' },
  { left: '69%', top: '83%' },
]

const DECORATIVE_DOTS = [
  { left: '11%', top: '51%', color: '#4C6FFF', size: 6 },
  { left: '84%', top: '27%', color: '#FBBF24', size: 7 },
  { left: '63%', top: '45%', color: '#FF4B8B', size: 5 },
  { left: '53%', top: '79%', color: '#10B981', size: 6 },
  { left: '18%', top: '68%', color: '#06B6D4', size: 5 },
  { left: '27%', top: '26%', color: '#3B82F6', size: 4 },
]

function ClusterView({ people, currentUser }) {
  const navigate = useNavigate()

  const getAvatarSize = (status) => {
    if (status === 'Best') return 64
    if (status === 'Old') return 40
    return 52
  }

  const visiblePeople = people.slice(0, 6)

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: '400px', height: '420px' }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 380"
        preserveAspectRatio="none"
      >
        <circle cx="200" cy="180" r="100" fill="none" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="200" cy="180" r="155" fill="none" stroke="#E5E7EB" strokeWidth="1.2" />
      </svg>

      {/* 중앙 — 로그인 사용자 */}
      <button
        className="absolute"
        style={{ left: '50%', top: '47%', transform: 'translate(-50%, -50%)' }}
      >
        <Avatar name={currentUser?.nick_name || currentUser?.email || '나'} image={null} size={60} />
      </button>

      {/* 사람 노드 */}
      {visiblePeople.map((person, idx) => (
        <button
          key={person.id}
          onClick={() => navigate(`/people/${person.id}`)}
          className="absolute flex flex-col items-center gap-1 hover:scale-105 transition-transform"
          style={{
            left: POSITION_COORDS[idx].left,
            top: POSITION_COORDS[idx].top,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <Avatar
              name={person.name}
              image={person.image ?? null}
              size={getAvatarSize(person.status)}
              status={person.status}
            />
            {person.status && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <StatusBadge status={person.status} />
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-800 mt-1">{person.name}</span>
        </button>
      ))}

      {/* 장식 점 */}
      {DECORATIVE_DOTS.map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-60"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
          }}
        />
      ))}
    </div>
  )
}

export default function PeoplePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => {
        // 404는 빈 목록 — 에러가 아니라 빈 상태로 처리
        if (err.response?.status !== 404) {
          setError('목록을 불러오는 데 실패했습니다.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">cluster</h1>
      </header>

      {error && <p className="text-red-500 text-sm px-6 mb-4">{error}</p>}

      {people.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-gray-600 text-base mb-4">등록된 사람이 없습니다.</p>
          <button
            onClick={() => navigate('/people/register')}
            className="text-[#5B40E4] font-semibold text-sm hover:underline"
          >
            첫 번째 사람 등록하기
          </button>
        </div>
      ) : (
        <div className="px-6 py-8">
          <ClusterView people={people} currentUser={user} />
        </div>
      )}

      <BottomTabBar />
    </div>
  )
}
