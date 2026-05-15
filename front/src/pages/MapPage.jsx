import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getPlaceList } from '../api/place'
import BottomTabBar from '../components/BottomTabBar'

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }

const STATUS_META = {
  new: {
    label: 'New',
    dotClassName: 'bg-people-status-new',
    token: '--color-people-status-new',
    baseMarkerSize: 22,
    maxMarkerGrowth: 5,
  },
  normal: {
    label: 'Normal',
    dotClassName: 'bg-people-status-normal',
    token: '--color-people-status-normal',
    baseMarkerSize: 22,
    maxMarkerGrowth: 5,
  },
  regular: {
    label: 'Normal',
    dotClassName: 'bg-people-status-normal',
    token: '--color-people-status-normal',
    baseMarkerSize: 22,
    maxMarkerGrowth: 5,
  },
  best: {
    label: 'Best',
    dotClassName: 'bg-people-status-best',
    token: '--color-people-status-best',
    baseMarkerSize: 30,
    maxMarkerGrowth: 6,
  },
  old: {
    label: 'Old',
    dotClassName: 'bg-people-status-old',
    token: '--color-people-status-old',
    baseMarkerSize: 14,
    maxMarkerGrowth: 4,
  },
}

const getStatusMeta = (status) => {
  return STATUS_META[status] || STATUS_META.old
}

const getCssToken = (token) => {
  if (typeof document === 'undefined') return 'gray'
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || 'gray'
}

const getVisitCount = (place) => Number(place.visit_count ?? place.count ?? 0) || 0

const getMarkerSize = (place) => {
  const meta = getStatusMeta(place.status)
  const growth = Math.min(getVisitCount(place), 12) * (meta.maxMarkerGrowth / 12)
  return Math.round(meta.baseMarkerSize + growth)
}

const getMarkerIcon = (place) => {
  const color = getCssToken(getStatusMeta(place.status).token)
  const size = getMarkerSize(place)
  const center = size / 2
  const radius = Math.max(4, center - 3)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="2"/>
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
    <div className="mx-auto min-h-screen w-full max-w-[448px] bg-white !pb-[125px]">
      <header className="!px-[30px] !pt-[70px] !pb-[30px]">
        <h1 className="text-3xl font-bold leading-none text-text-main">cluster</h1>
      </header>

      {error && <p className="!px-[30px] !pb-3 text-sm text-red-500">{error}</p>}

      <section className="!px-[30px]">
        <div className="relative h-[248px] overflow-hidden rounded-[10px] bg-gray-100">
          {!isLoaded ? (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-gray-400">지도 로딩 중...</p>
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
                  icon={getMarkerIcon(place)}
                  title={place.name}
                  onClick={() => navigate(`/place/${place.id}`)}
                />
              ))}
            </GoogleMap>
          )}
        </div>
      </section>

      {loading ? (
        <p className="!px-[30px] !pt-5 text-sm text-gray-400">불러오는 중...</p>
      ) : !hasPlaces ? (
        <div className="flex flex-col items-center justify-center !px-[30px] !py-16 text-center">
          <p className="!mb-2 text-gray-500">등록된 장소가 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/place/register')}
            className="font-medium text-primary"
          >
            첫 번째 장소 등록하기
          </button>
        </div>
      ) : (
        <section className="flex flex-col gap-[10px] !px-[30px] !pt-5">
          {places.map(place => (
            <button
              key={place.id}
              type="button"
              onClick={() => navigate(`/place/${place.id}`)}
              className="flex w-full items-center justify-between rounded-[10px] border border-people-status-old bg-white !px-5 !py-[15px] text-left"
            >
              <div className="min-w-0 flex flex-col gap-[5px]">
                <p className="truncate text-sm font-semibold leading-normal text-black">{place.name}</p>
                <p className="text-xs leading-normal text-gray-500">방문 {getVisitCount(place)}회</p>
              </div>
              <div className="flex shrink-0 items-center gap-[5px] !pl-4">
                <span className={`h-[9px] w-[9px] rounded-full ${getStatusMeta(place.status).dotClassName}`} />
                <span className="min-w-[37px] text-xs leading-normal text-gray-500">
                  {getStatusMeta(place.status).label}
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      <BottomTabBar />
    </div>
  )
}
