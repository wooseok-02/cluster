import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlace } from '../api/place'
import StatusBadge from '../components/StatusBadge'

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

  if (loading) return <p className="p-4">불러오는 중...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-center font-medium text-gray-900">{place.name}</h1>
        <div className="w-10" />
      </div>

      {/* Map */}
      <div className="px-4 py-4">
        <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: '160px' }}>
          {!isLoaded ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400 text-sm">지도 로딩 중...</p>
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
      </div>

      {/* Stats Card */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">방문 횟수</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{place.visit_count}회</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">상태</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={place.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">최근 방문</p>
              <p className="font-medium text-gray-900">
                {place.logs?.[0]?.date || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">최근 방문</h2>
        </div>
        {place.logs.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 방문 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {place.logs.slice(0, 3).map((log, index) => (
              <div key={log.log_id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-[#5B40E4]' : 'bg-[#5B40E4]/40'}`} />
                {log.schedule_id ? (
                  <button
                    onClick={() => navigate(`/schedule/${log.schedule_id}`)}
                    className="text-gray-900 text-sm"
                  >
                    {log.date}
                  </button>
                ) : (
                  <span className="text-gray-900 text-sm">{log.date}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
