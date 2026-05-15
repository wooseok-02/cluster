// 등록된 사람 목록 페이지 — current user 중심 People map
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPeopleList } from '../api/people'
import { updateMyPhoto } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import PeopleMap from '../components/people/PeopleMap'
import BottomTabBar from '../components/BottomTabBar'

export default function PeoplePage() {
  const navigate = useNavigate()
  const { user, updateUserPhoto } = useAuth()
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
      updateUserPhoto(res.photo_url)
    } catch {
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return <p className="!p-4">불러오는 중...</p>

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white !pb-[85px]">
      <header className="relative z-20 shrink-0 bg-white !px-[30px] !pt-[64px] !pb-[14px]">
        <h1 className="text-3xl font-bold leading-none text-text-main">cluster</h1>
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

      <BottomTabBar />
    </div>
  )
}
