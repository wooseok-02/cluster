// 등록된 사람 목록 페이지 — ClusterView UI로 시각화
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPeopleList } from '../api/people'
import { updateMyPhoto } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import BottomTabBar from '../components/BottomTabBar'

function Avatar({ name, image, size = 52, status = null }) {
  const getStatusColor = (status) => {
    const colors = {
      new: 'from-blue-100 to-blue-50 ring-2 ring-blue-400',
      best: 'from-pink-100 to-pink-50 ring-2 ring-pink-400',
      old: 'from-gray-100 to-gray-50 ring-2 ring-gray-400',
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

const DECORATIVE_DOTS = [
  { left: '11%', top: '51%', color: '#4C6FFF', size: 6 },
  { left: '84%', top: '27%', color: '#FBBF24', size: 7 },
  { left: '63%', top: '45%', color: '#FF4B8B', size: 5 },
  { left: '53%', top: '79%', color: '#10B981', size: 6 },
  { left: '18%', top: '68%', color: '#06B6D4', size: 5 },
  { left: '27%', top: '26%', color: '#3B82F6', size: 4 },
]

// 인원 수에 상관없이 전체를 겹치지 않게 랜덤 배치
// 섹터 분할 방식: 원을 N등분 후 각 섹터 안에서 랜덤 jitter 적용
function generatePositions(count, containerW, containerH) {
  const cx = containerW / 2
  const cy = containerH * 0.47
  const minR = 95
  const maxR = 150

  return Array.from({ length: count }, (_, i) => {
    const sectorAngle = (2 * Math.PI) / count
    const baseAngle = i * sectorAngle - Math.PI / 2 // 12시 방향부터 시작
    const jitter = (Math.random() - 0.5) * sectorAngle * 0.65
    const angle = baseAngle + jitter
    const radius = minR + Math.random() * (maxR - minR)
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    return {
      left: `${(x / containerW) * 100}%`,
      top: `${(y / containerH) * 100}%`,
    }
  })
}

function ClusterView({ people, currentUser, myPhotoUrl, onPhotoClick, uploading }) {
  const navigate = useNavigate()

  const containerW = 393
  const containerH = 460

  const getAvatarSize = (status) => {
    if (status === 'best') return 72
    if (status === 'old') return 36
    return 52  // new / normal
  }

  // people 목록이 바뀔 때만 좌표 재생성 (전원 표시)
  const positions = useMemo(
    () => generatePositions(people.length, containerW, containerH),
    [people]
  )

  return (
    <div className="relative w-full" style={{ height: `${containerH}px` }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${containerW} ${containerH}`}
        preserveAspectRatio="none"
      >
        <circle cx={containerW / 2} cy={containerH * 0.47} r="100" fill="none" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx={containerW / 2} cy={containerH * 0.47} r="155" fill="none" stroke="#E5E7EB" strokeWidth="1.2" />
      </svg>

      {/* 중앙 — 로그인 사용자 (클릭 시 프로필 사진 업로드) */}
      <button
        onClick={onPhotoClick}
        disabled={uploading}
        className="absolute"
        style={{ left: '50%', top: '47%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative">
          <Avatar name={currentUser?.nick_name || currentUser?.email || '나'} image={myPhotoUrl ?? null} size={60} />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
            {uploading ? (
              <span className="text-white text-xs">업로드 중...</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="14" rx="2" stroke="white" strokeWidth="1.8" />
                <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
                <path d="M9 7L10.5 4H13.5L15 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* 사람 노드 — 전원 표시 */}
      {people.map((person, idx) => (
        <button
          key={person.id}
          onClick={() => navigate(`/people/${person.id}`)}
          className="absolute flex flex-col items-center gap-1 hover:scale-105 transition-transform"
          style={{
            left: positions[idx]?.left,
            top: positions[idx]?.top,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <Avatar
              name={person.name}
              image={person.photo_url ?? null}
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
  const [uploading, setUploading] = useState(false)
  const [myPhotoUrl, setMyPhotoUrl] = useState(user?.photo_url ?? null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError('목록을 불러오는 데 실패했습니다.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await updateMyPhoto(file)
      setMyPhotoUrl(res.photo_url)
    } catch {
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">cluster</h1>
      </header>

      {error && <p className="text-red-500 text-sm px-6 mb-4">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

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
        <ClusterView
          people={people}
          currentUser={user}
          myPhotoUrl={myPhotoUrl}
          onPhotoClick={() => fileInputRef.current?.click()}
          uploading={uploading}
        />
      )}

      <BottomTabBar />
    </div>
  )
}
