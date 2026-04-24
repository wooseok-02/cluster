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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <button onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/map')} className="p-2 -ml-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-center font-medium text-gray-900">장소 등록</h1>
        <div className="w-10" />
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="장소 검색"
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B40E4]/20"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="px-6 py-3 bg-[#5B40E4] text-white rounded-xl font-medium disabled:opacity-50"
          >
            {searchLoading ? '검색 중' : '검색'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm px-4 mb-2">{error}</p>}

      {/* Results */}
      {searched && results.length === 0 && (
        <p className="text-gray-400 text-sm px-4 mb-3">검색 결과가 없습니다.</p>
      )}
      {results.length > 0 && (
        <div className="flex-1 px-4 space-y-3">
          {results.map((place, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPlace(place)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedPlace?.name === place.name
                  ? 'bg-[#5B40E4]/10 border-[#5B40E4]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <p className="font-medium text-gray-900">{place.name}</p>
              {place.category_name && (
                <p className="text-sm text-[#5B40E4]">{place.category_name}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Place Map Preview */}
      {selectedPlace && (
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">선택된 장소: {selectedPlace.name}</p>
          <div className="rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ height: '128px' }}>
            {!isLoaded ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 text-sm">지도 로딩 중...</p>
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
        </div>
      )}

      {/* Confirm Button */}
      {selectedPlace && (
        <div className="p-4 pb-8">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="w-full py-4 bg-[#5B40E4] text-white rounded-xl font-medium disabled:opacity-50"
          >
            {saveLoading ? '저장 중...' : '확인'}
          </button>
        </div>
      )}
    </div>
  )
}
