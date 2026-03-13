// 장소 상세 페이지 — 정보 표시, 구글맵 마커, 방문 기록 목록 (자세히 보기는 Activity 스프린트 연결 예정)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlace } from '../api/place'

const STATUS_LABEL = {
  new: 'New',
  regular: 'Regular',
  best: 'Best',
  old: 'Old',
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

  if (loading) return <p className="p-4">불러오는 중...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  return (
    <div className="p-4 max-w-lg mx-auto pb-6">
      <button onClick={() => navigate('/map')} className="text-gray-500 text-sm mb-4 block">
        ← 뒤로
      </button>

      <h1 className="text-2xl font-bold mb-1">{place.name}</h1>
      <p className="text-gray-500 text-sm mb-4">{STATUS_LABEL[place.status] || place.status}</p>

      {/* 구글맵 마커 */}
      <div className="mb-4">
        {!isLoaded ? (
          <p className="text-gray-400 text-sm">지도 로딩 중...</p>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '200px', borderRadius: '8px' }}
            center={{ lat: place.latitude, lng: place.longitude }}
            zoom={15}
          >
            <Marker position={{ lat: place.latitude, lng: place.longitude }} />
          </GoogleMap>
        )}
      </div>

      {/* 장소 정보 */}
      <div className="border rounded p-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">방문 횟수</span>
          <span>{place.visit_count}회</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">상태</span>
          <span>{STATUS_LABEL[place.status] || place.status}</span>
        </div>
      </div>

      {/* 방문 기록 */}
      <h2 className="font-semibold mb-2">방문 기록</h2>
      {place.logs.length === 0 ? (
        <p className="text-gray-400 text-sm">아직 방문 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {place.logs.map((log) => (
            <li key={log.log_id} className="border rounded px-3 py-2 flex justify-between items-center">
              <span className="text-sm">{log.date}</span>
              {/* TODO: Activity 스프린트에서 /schedule/:id 이동 연결 */}
              <button
                onClick={() => navigate(`/schedule/${log.log_id}`)}
                className="text-blue-500 text-xs border border-blue-500 rounded px-2 py-1"
              >
                자세히 보기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
