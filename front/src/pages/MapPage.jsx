import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlaceList } from '../api/place'
import BottomTabBar from '../components/BottomTabBar'

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

  const hasPlaces = places.length > 0

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">cluster</h1>
      </div>

      {error && <p className="text-red-500 text-sm px-4 mb-2">{error}</p>}

      {/* Map */}
      <div className="px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: '192px' }}>
          {!isLoaded ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400 text-sm">지도 로딩 중...</p>
            </div>
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
          {hasPlaces && (
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-[#FF4B8B] rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-400 text-sm px-4">불러오는 중...</p>
      ) : !hasPlaces ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-500 mb-2">등록된 장소가 없습니다.</p>
          <button
            onClick={() => navigate('/place/register')}
            className="text-[#5B40E4] font-medium"
          >
            첫 번째 장소 등록하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          {places.map(place => (
            <button
              key={place.id}
              onClick={() => navigate(`/place/${place.id}`)}
              className="bg-white rounded-xl border border-gray-200 flex flex-col justify-between shrink-0"
              style={{ width: '333px', height: '218px', marginLeft: '30px', marginRight: '30px', padding: '16px', gap: '10px' }}
            >
              <div className="flex items-center justify-between" style={{ gap: '10px' }}>
                <p className="font-medium text-gray-900 text-left">{place.name}</p>
                <span className="text-sm font-medium shrink-0" style={{ color: STATUS_COLOR[place.status] || STATUS_COLOR.new }}>
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: STATUS_COLOR[place.status] || STATUS_COLOR.new }}
                  />
                  {STATUS_LABEL[place.status] || place.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 text-left">방문 {place.visit_count}회</p>
            </button>
          ))}
        </div>
      )}

      <BottomTabBar />
    </div>
  )
}
