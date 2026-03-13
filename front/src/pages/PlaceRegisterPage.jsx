// 장소 등록 페이지 — 카카오 검색 → 미니 지도 미리보기 → 저장
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
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/map')} className="text-gray-500 text-sm">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold">장소 등록</h1>
      </div>

      {/* 검색창 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="장소명 검색"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {searchLoading ? '검색 중' : '검색'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* 검색 결과 */}
      {searched && results.length === 0 && (
        <p className="text-gray-400 text-sm mb-3">검색 결과가 없습니다.</p>
      )}
      {results.length > 0 && (
        <ul className="space-y-1 mb-4">
          {results.map((place, idx) => (
            <li
              key={idx}
              onClick={() => setSelectedPlace(place)}
              className={`border rounded px-3 py-2 text-sm cursor-pointer ${
                selectedPlace?.name === place.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <p className="font-medium">{place.name}</p>
              <p className="text-gray-400 text-xs">{place.category_name}</p>
            </li>
          ))}
        </ul>
      )}

      {/* 미니 지도 미리보기 */}
      {selectedPlace && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">선택된 장소: {selectedPlace.name}</p>
          {!isLoaded ? (
            <p className="text-gray-400 text-sm">지도 로딩 중...</p>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '180px', borderRadius: '8px' }}
              center={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
              zoom={16}
            >
              <Marker
                position={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
              />
            </GoogleMap>
          )}
        </div>
      )}

      {/* 확인 버튼 */}
      {selectedPlace && (
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        >
          {saveLoading ? '저장 중...' : '확인'}
        </button>
      )}
    </div>
  )
}
