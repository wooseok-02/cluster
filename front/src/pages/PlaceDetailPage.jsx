import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlace } from '../api/place'

const STATUS_LABELS = {
  new: 'New',
  normal: 'Normal',
  regular: 'Normal',
  best: 'Best',
  old: 'Old',
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '-'
}

function getCompanions(place) {
  return place.people || place.companions || place.visitors || []
}

function getCompanionCount(person) {
  return Number(person.count ?? person.visit_count ?? person.meeting_count ?? 0) || 0
}

export default function PlaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [place, setPlace] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  useEffect(() => {
    getPlace(id)
      .then((data) => setPlace(data.data))
      .catch(() => setError('장소 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="!p-4">불러오는 중...</p>
  if (error) return <p className="!p-4 text-red-500">{error}</p>

  const companions = getCompanions(place)

  return (
    <div className="mx-auto min-h-screen w-full max-w-[448px] bg-white !pb-[48px]">
      <header className="flex items-end !px-[23px] !pt-[70px] !pb-[10px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[30px] w-[30px] items-center justify-center text-black"
          aria-label="Go back"
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M18.75 22.5L11.25 15L18.75 7.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold leading-4 text-black">{place.name}</h1>
        <div className="h-[30px] w-[30px]" />
      </header>

      <main>
        <section className="!px-[30px] !pt-1">
        <div className="h-[167px] overflow-hidden rounded-[15px] bg-gray-100">
          {!isLoaded ? (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-gray-400">지도 로딩 중...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={{ lat: place.latitude, lng: place.longitude }}
              zoom={15}
            >
              <Marker position={{ lat: place.latitude, lng: place.longitude }} />
            </GoogleMap>
          )}
        </div>
      </section>

      <section className="!mx-[30px] !mt-[19px] rounded-[15px] border border-gray-200 bg-white !px-[40px] !py-[22px] shadow-[0_3px_7px_rgba(235,235,235,0.3)]">
        <div className="grid grid-cols-2">
          <div className="flex flex-col gap-[10px] border-r border-gray-200">
            <p className="text-xs leading-4 text-gray-500">방문 횟수</p>
            <div className="flex items-center gap-[30px]">
              <p className="text-lg font-medium leading-4 text-black">{place.visit_count}회</p>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary" aria-hidden="true">
                <path d="M7 3V6M17 3V6M4 9H20M6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7C4 5.89543 4.89543 5 6 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-[10px] !pl-[34px]">
            <p className="text-xs leading-4 text-gray-500">상태</p>
            <div className="flex items-center gap-[10px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary" aria-hidden="true">
                <path d="M8 14C8.91221 15.2144 10.3645 16 12 16C13.6355 16 15.0878 15.2144 16 14M9 9H9.01M15 9H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-lg font-medium leading-4 text-primary">{getStatusLabel(place.status)}</p>
            </div>
          </div>
        </div>
        <div className="!mt-[22px] border-t border-gray-200 !pt-[20px]">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-[10px]">
              <p className="text-xs leading-4 text-gray-500">최근 방문</p>
              <p className="text-lg font-medium leading-4 text-black">{place.logs?.[0]?.date || '-'}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/place/${id}/visits`)}
              className="flex items-center text-xs font-medium leading-4 text-gray-500"
            >
              <span>방문 기록 보기</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section className="!px-[30px] !pt-[30px]">
        <div className="flex items-center justify-between !mb-4">
          <h2 className="text-lg font-bold leading-4 text-black">함께 온 사람</h2>
          <button
            type="button"
            className="flex items-center text-xs font-medium leading-4 text-gray-500"
          >
            <span>전체보기</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {companions.length === 0 ? (
          <p className="text-sm text-gray-400">아직 함께 온 사람이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {companions.slice(0, 1).map((person) => (
              <div
                key={person.id}
                className="flex w-full items-center gap-5 rounded-[15px] border border-gray-200 bg-white !p-[15px] text-left shadow-[0_3px_3.5px_rgba(210,210,210,0.3)]"
              >
                <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xl font-bold text-primary">
                  {person.photo_url ? (
                    <img src={person.photo_url} alt={person.name} className="h-full w-full object-cover" />
                  ) : (
                    person.name?.[0] || '?'
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-[5px]">
                    <span className="truncate text-lg font-bold leading-4 text-black">{person.name}</span>
                    <span className="rounded-full bg-primary-light !px-[10px] text-xs font-medium leading-4 text-primary">
                      {getStatusLabel(person.status)}
                    </span>
                  </span>
                  <span className="!mt-[10px] block truncate text-sm leading-4 text-gray-500">
                    같이 {getCompanionCount(person)}번 방문했어요
                  </span>
                </span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-500" aria-hidden="true">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="!px-[30px] !pt-[34px]">
        <div className="flex items-center justify-between !mb-4">
          <h2 className="text-lg font-bold leading-4 text-black">최근 방문</h2>
          <button
            type="button"
            onClick={() => navigate(`/place/${id}/visits`)}
            className="flex items-center text-xs font-medium leading-4 text-gray-500"
          >
            <span>전체보기</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {place.logs.length === 0 ? (
          <p className="text-sm text-gray-400">아직 방문 기록이 없습니다.</p>
        ) : (
          <div className="rounded-[15px] border border-gray-200 bg-white !px-[24px] !py-[20px]">
            {place.logs.slice(0, 3).map((log, index) => (
              <div key={log.log_id} className="grid grid-cols-[18px_1fr] gap-[13px]">
                <div className="relative flex justify-center">
                  {index < Math.min(place.logs.length, 3) - 1 && (
                    <span className="absolute top-[8px] h-full w-px bg-primary-light" />
                  )}
                  <span className={`relative z-10 h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-primary-light'}`} />
                </div>
                <div className={`${index < Math.min(place.logs.length, 3) - 1 ? 'border-b border-gray-200 !pb-[18px] !mb-[18px]' : ''}`}>
                  {log.schedule_id ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/schedule/${log.schedule_id}`)}
                      className="text-sm font-medium leading-4 text-black"
                    >
                      {log.date}
                    </button>
                  ) : (
                    <span className="text-sm font-medium leading-4 text-black">{log.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </main>
    </div>
  )
}
