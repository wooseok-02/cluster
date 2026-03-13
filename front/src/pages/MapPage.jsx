// Map 탭 — 구글맵 마커 + 장소 텍스트 리스트 함께 표시
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlaceList } from '../api/place'
import TabBar from '../components/TabBar'

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }

const STATUS_COLOR = {
  new: '#9CA3AF',
  regular: '#3B82F6',
  best: '#EAB308',
  old: '#A855F7',
}

const STATUS_LABEL = {
  new: 'New',
  regular: 'Regular',
  best: 'Best',
  old: 'Old',
}

const getMarkerIcon = (status) => {
  const color = STATUS_COLOR[status] || STATUS_COLOR.new
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="9" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}` }
}

export default function MapPage() {
  const navigate = useNavigate()
  const [places, setPlaces] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  useEffect(() => {
    getPlaceList()
      .then((data) => setPlaces(data.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError('장소 목록을 불러오는 데 실패했습니다.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const mapCenter =
    places.length > 0
      ? { lat: places[0].latitude, lng: places[0].longitude }
      : MAP_CENTER

  return (
    <div className="flex flex-col h-screen pb-12">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Map</h1>
        <button
          onClick={() => navigate('/place/register')}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          + New
        </button>
      </div>

      {error && <p className="text-red-500 text-sm px-4 pt-2">{error}</p>}

      {/* 지도 영역 */}
      <div style={{ height: '300px', flexShrink: 0 }}>
        {!isLoaded ? (
          <p className="p-4 text-gray-500 text-sm">지도 로딩 중...</p>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={13}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                position={{ lat: place.latitude, lng: place.longitude }}
                icon={getMarkerIcon(place.status)}
                title={place.name}
                onClick={() => navigate(`/place/${place.id}`)}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      {/* 장소 텍스트 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        ) : places.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>등록된 장소가 없습니다.</p>
            <button
              onClick={() => navigate('/place/register')}
              className="mt-4 text-blue-500 underline text-sm"
            >
              첫 번째 장소 등록하기
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {places.map((place) => (
              <li
                key={place.id}
                onClick={() => navigate(`/place/${place.id}`)}
                className="border rounded p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{place.name}</p>
                  <p className="text-sm text-gray-400">방문 {place.visit_count}회</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: STATUS_COLOR[place.status] || STATUS_COLOR.new }}
                  />
                  <span className="text-sm text-gray-500">
                    {STATUS_LABEL[place.status] || place.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TabBar />
    </div>
  )
}
