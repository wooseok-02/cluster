import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { searchKakaoPlace, registerPlace } from '../api/place'

export default function PlaceRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearchLoading(true)
    setError('')
    setSelectedPlace(null)
    setResults([])
    try {
      const data = await searchKakaoPlace(query)
      setResults(data.data)
      setSearched(true)
    } catch {
      setError('검색에 실패했습니다.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleSave = async () => {
    if (!selectedPlace) return
    setSaveLoading(true)
    setError('')
    try {
      await registerPlace(selectedPlace)
      navigate(from === 'schedule' ? '/schedule/create' : '/map')
    } catch (err) {
      setError(err.response?.data?.detail || '저장에 실패했습니다.')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[448px] flex-col bg-white !px-[30px] !pt-5 !pb-[35px]">
      <header className="flex h-[30px] shrink-0 items-center">
        <button
          type="button"
          onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/map')}
          className="flex h-[30px] w-[30px] items-center justify-center text-black"
          aria-label="Go back"
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M18.75 22.5L11.25 15L18.75 7.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold leading-4 text-black">장소 등록</h1>
        <div className="h-[30px] w-[30px]" />
      </header>

      <main className="flex flex-1 flex-col">
        <section className="!mt-[50px] flex gap-[10px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="장소 검색"
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-gray-300 bg-white !px-[15px] text-sm leading-4 text-text-main placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searchLoading}
            className="flex h-10 w-[61px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-bold leading-4 text-white disabled:opacity-50"
          >
            {searchLoading ? '검색 중' : '검색'}
          </button>
        </section>

        {error && <p className="!mt-3 text-sm text-red-500">{error}</p>}

        {searched && results.length === 0 && (
          <p className="!mt-[30px] text-sm text-gray-400">검색 결과가 없습니다.</p>
        )}

        {results.length > 0 && (
          <section className="!mt-[29px] flex flex-col gap-[10px]">
            {results.map((place, idx) => {
              const isSelected = selectedPlace?.name === place.name

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPlace(place)}
                  className={`w-full rounded-[10px] border text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary-light !px-[15px] !py-[10px]'
                      : 'border-gray-300 bg-white !px-[15px] !py-[10px]'
                  }`}
                >
                  <p className="truncate text-sm leading-4 text-black">{place.name}</p>
                  {place.category_name && (
                    <p className="!mt-[2px] truncate text-[10px] leading-4 text-primary">{place.category_name}</p>
                  )}
                </button>
              )
            })}
          </section>
        )}

        {selectedPlace && (
          <section className="!mt-[27px]">
            <p className="text-xs leading-4 text-gray-500">선택된 장소: {selectedPlace.name}</p>
            <div className="!mt-2 h-[124px] overflow-hidden rounded-[10px] bg-gray-100">
              {!isLoaded ? (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-sm text-gray-400">지도 로딩 중...</p>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
                  zoom={16}
                >
                  <Marker position={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }} />
                </GoogleMap>
              )}
            </div>
          </section>
        )}

        {selectedPlace && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className="!mt-auto flex h-[46px] w-full items-center justify-center rounded-[10px] bg-primary text-base font-semibold leading-4 text-white disabled:opacity-50"
          >
            {saveLoading ? '저장 중...' : '확인'}
          </button>
        )}
      </main>
    </div>
  )
}
