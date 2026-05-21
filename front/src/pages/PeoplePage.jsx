// 등록된 사람 목록 페이지 — current user 중심 People map
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPeopleList } from '../api/people'
import { updateMyPhoto } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import PeopleMap from '../components/people/PeopleMap'
import BottomTabBar from '../components/BottomTabBar'

const RELATION_SETTINGS_KEY = 'cluster.peopleMap.relations.v1'

const DEFAULT_RELATIONS = [
  { name: '가족', color: '#FF8BB3' },
  { name: '친구', color: '#5A8DEE' },
  { name: '직장', color: '#37B778' },
  { name: '기타', color: '#9C8BFF' },
]

const RELATION_COLORS = [
  '#FF8BB3',
  '#5A8DEE',
  '#37B778',
  '#9C8BFF',
  '#F5C84B',
  '#FF9F6E',
  '#4BC3D3',
  '#7C89FF',
]

function normalizeRelationName(name) {
  return String(name || '').trim()
}

function loadRelationSettings() {
  if (typeof window === 'undefined') return DEFAULT_RELATIONS

  try {
    const stored = JSON.parse(window.localStorage.getItem(RELATION_SETTINGS_KEY) || '[]')
    if (!Array.isArray(stored)) return DEFAULT_RELATIONS

    const merged = [...DEFAULT_RELATIONS, ...stored].reduce((acc, relation) => {
      const name = normalizeRelationName(relation.name)
      if (!name) return acc
      const existingIndex = acc.findIndex((item) => item.name === name)
      if (existingIndex >= 0) {
        acc[existingIndex] = { name, color: relation.color || acc[existingIndex].color }
        return acc
      }
      acc.push({ name, color: relation.color || '#9C8BFF' })
      return acc
    }, [])

    return merged
  } catch {
    return DEFAULT_RELATIONS
  }
}

function saveRelationSettings(relations) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RELATION_SETTINGS_KEY, JSON.stringify(relations))
}

function RelationSettingsModal({ relations, onClose, onAddRelation, onColorChange }) {
  const [newRelationName, setNewRelationName] = useState('')

  const handleAdd = (event) => {
    event.preventDefault()
    const name = normalizeRelationName(newRelationName)
    if (!name) return
    onAddRelation(name)
    setNewRelationName('')
  }

  return (
    <div className="absolute inset-0 z-[60] flex items-end bg-black/20">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="관계 설정 닫기"
        onClick={onClose}
      />
      <section className="relative max-h-[calc(100vh-24px)] w-full rounded-t-[28px] border border-white/80 bg-white/88 !px-6 !pt-5 !pb-[108px] shadow-[0_-24px_60px_rgba(37,29,83,0.18)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#17112f]">관계 설정</h2>
            <p className="!mt-1 text-[11px] leading-4 text-text-sub">관계별로 클러스터 분위기 색을 지정합니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-black text-primary"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAdd} className="!mt-5 flex gap-2">
          <input
            value={newRelationName}
            onChange={(event) => setNewRelationName(event.target.value)}
            placeholder="예: 대학 친구"
            className="h-10 min-w-0 flex-1 rounded-full border border-gray-border bg-white/90 !px-4 text-sm text-text-main outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-full bg-primary !px-4 text-sm font-bold text-white"
          >
            추가
          </button>
        </form>

        <div className="!mt-5 max-h-[calc(100vh-285px)] overflow-y-auto !pr-1">
          {relations.map((relation) => (
            <div key={relation.name} className="!mb-4 rounded-[20px] border border-white/80 bg-white/68 !p-4 shadow-[0_12px_30px_rgba(47,36,108,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-7 w-7 shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${relation.color} 0%, ${relation.color}88 45%, ${relation.color}22 72%)`,
                      boxShadow: `0 0 22px ${relation.color}66`,
                    }}
                  />
                  <span className="truncate text-sm font-black text-[#241d46]">{relation.name}</span>
                </div>
              </div>
              <div className="!mt-3 grid grid-cols-8 gap-2">
                {RELATION_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onColorChange(relation.name, color)}
                    className="h-7 rounded-full border transition-transform active:scale-95"
                    style={{
                      background: `radial-gradient(circle, ${color} 0%, ${color}99 52%, ${color}30 100%)`,
                      borderColor: relation.color === color ? '#241d46' : 'rgba(255,255,255,0.9)',
                      boxShadow: relation.color === color ? `0 0 0 2px ${color}55, 0 0 18px ${color}77` : `0 0 12px ${color}44`,
                    }}
                    aria-label={`${relation.name} 색상 변경`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function PeoplePage() {
  const navigate = useNavigate()
  const { user, updateUserPhoto, logoutAction } = useAuth()
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [myPhotoUrl, setMyPhotoUrl] = useState(user?.photo_url ?? null)
  const [relationSettingsOpen, setRelationSettingsOpen] = useState(false)
  const [relations, setRelations] = useState(loadRelationSettings)
  const fileInputRef = useRef(null)

  const relationSettings = useMemo(() => {
    const peopleRelations = people
      .map((person) => normalizeRelationName(person.relation))
      .filter(Boolean)

    return [...relations, ...peopleRelations.map((name) => ({ name, color: '#9C8BFF' }))].reduce((acc, relation) => {
      if (!acc.some((item) => item.name === relation.name)) acc.push(relation)
      return acc
    }, [])
  }, [people, relations])

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

  useEffect(() => {
    saveRelationSettings(relations)
  }, [relations])

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await updateMyPhoto(file)
      setMyPhotoUrl(res.photo_url)
      updateUserPhoto(res.photo_url)
    } catch {
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAction()
    setLoggingOut(false)
    navigate('/', { replace: true })
  }

  const handleAddRelation = (name) => {
    setRelations((current) => {
      if (current.some((relation) => relation.name === name)) return current
      return [...current, { name, color: RELATION_COLORS[current.length % RELATION_COLORS.length] }]
    })
  }

  const handleRelationColorChange = (name, color) => {
    setRelations((current) => {
      const exists = current.some((relation) => relation.name === name)
      if (!exists) return [...current, { name, color }]
      return current.map((relation) => (
        relation.name === name ? { ...relation, color } : relation
      ))
    })
  }

  if (loading) return <p className="!p-4">불러오는 중...</p>

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white !pb-[85px]">
      <header className="relative z-20 flex shrink-0 items-center justify-between bg-white !px-[30px] !pt-5 !pb-[14px]">
        <h1 className="text-3xl font-bold leading-none text-text-main">cluster</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRelationSettingsOpen(true)}
            className="flex h-9 items-center justify-center rounded-full border border-primary/20 bg-primary-light !px-3 text-xs font-bold text-primary"
          >
            관계 만들기
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-9 items-center justify-center rounded-full border border-gray-border bg-white !px-4 text-sm font-semibold text-text-sub transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? '처리 중' : '로그아웃'}
          </button>
        </div>
      </header>

      {error && <p className="relative z-20 !px-[30px] text-sm text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <PeopleMap
        people={people}
        currentUser={user}
        myPhotoUrl={myPhotoUrl}
        onPhotoClick={() => fileInputRef.current?.click()}
        uploading={uploading}
        relationSettings={relationSettings}
      />

      {people.length === 0 && (
        <div className="pointer-events-none absolute left-0 right-0 top-[190px] z-20 flex flex-col items-center text-center">
          <p className="text-base text-text-sub">등록된 사람이 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/people/register')}
            className="pointer-events-auto !mt-4 text-sm font-semibold text-primary"
          >
            첫 번째 사람 등록하기
          </button>
        </div>
      )}

      {relationSettingsOpen && (
        <RelationSettingsModal
          relations={relationSettings}
          onClose={() => setRelationSettingsOpen(false)}
          onAddRelation={handleAddRelation}
          onColorChange={handleRelationColorChange}
        />
      )}

      <BottomTabBar />
    </div>
  )
}
