// 일정 생성 페이지 — 검색 필터로 People·Place 선택, 등록 후 복귀 시 폼 상태 복원
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createSchedule, confirmSchedule } from '../api/schedule'
import { takePendingFiles } from '../lib/pendingPhotos'
import { getPeopleList } from '../api/people'
import { getPlaceList } from '../api/place'

const DRAFT_KEY = 'scheduleFormDraft'

export default function ScheduleCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date') || ''
  // mount 시 한 번만 읽고 저장소 비움 — 다른 경로에서 진입 시 빈 배열
  const [pendingFiles] = useState(() => takePendingFiles())

  const [form, setForm] = useState({ title: '', date: initialDate, start_time: '', end_time: '', memo: '' })
  const [selectedPeopleIds, setSelectedPeopleIds] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)

  const [people, setPeople] = useState([])
  const [places, setPlaces] = useState([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [placeSearch, setPlaceSearch] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 마운트 시 sessionStorage에 저장된 임시 폼 복원 (사람/장소 등록 후 돌아올 때)
  useEffect(() => {
    const draft = sessionStorage.getItem(DRAFT_KEY)
    if (draft) {
      const { form: f, selectedPeopleIds: pIds, selectedPlaceId: plId } = JSON.parse(draft)
      setForm(f)
      setSelectedPeopleIds(pIds)
      setSelectedPlaceId(plId)
      sessionStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  // People·Place 목록 불러오기
  useEffect(() => {
    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })

    getPlaceList()
      .then((data) => setPlaces(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })
  }, [])

  // 이동 전 현재 폼 상태를 sessionStorage에 저장
  const saveDraft = () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, selectedPeopleIds, selectedPlaceId }))
  }

  const handleAddPerson = () => {
    saveDraft()
    navigate('/people/register?from=schedule')
  }

  const handleAddPlace = () => {
    saveDraft()
    navigate('/place/register?from=schedule')
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const togglePerson = (id) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await createSchedule({
        title: form.title,
        date: form.date,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
        memo: form.memo,
        place_id: selectedPlaceId,
        people_ids: selectedPeopleIds,
      })
      // 사진 업로드 플로우에서 넘어온 경우 사진과 함께 즉시 확정
      if (pendingFiles.length > 0) {
        try {
          await confirmSchedule(result.data.id, null, pendingFiles)
        } catch {
          // 확정 실패 시 일정은 유지되며, 사용자가 상세 화면에서 직접 확정 가능
        }
      }
      navigate('/calendar')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'object' ? detail.message : detail || '일정 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 검색 필터 적용
  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(peopleSearch.toLowerCase())
  )
  const filteredPlaces = places.filter((pl) =>
    pl.name.toLowerCase().includes(placeSearch.toLowerCase())
  )

  // 선택된 항목 이름 표시용
  const selectedPeopleNames = people
    .filter((p) => selectedPeopleIds.includes(p.id))
    .map((p) => p.name)
  const selectedPlaceName = places.find((pl) => pl.id === selectedPlaceId)?.name

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/calendar')} className="text-gray-500 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold">일정 생성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-1">일정 이름</label>
          <input
            type="text" name="title" value={form.title}
            onChange={handleChange} required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date" name="date" value={form.date}
            onChange={handleChange} required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* 시간 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">시작 시간</label>
            <input
              type="time" name="start_time" value={form.start_time}
              onChange={handleChange} required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">종료 시간</label>
            <input
              type="time" name="end_time" value={form.end_time}
              onChange={handleChange} required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* 동행인 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium">
              동행인
              {selectedPeopleNames.length > 0 && (
                <span className="ml-2 text-blue-500 font-normal">{selectedPeopleNames.join(', ')}</span>
              )}
            </label>
            <button type="button" onClick={handleAddPerson} className="text-blue-500 text-xs">
              + 새 인물 등록
            </button>
          </div>
          {/* 검색 입력 */}
          <input
            type="text"
            value={peopleSearch}
            onChange={(e) => setPeopleSearch(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full border rounded px-3 py-1.5 text-sm mb-2"
          />
          {/* 필터된 목록 */}
          {people.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 인물이 없습니다.</p>
          ) : filteredPeople.length === 0 ? (
            <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredPeople.map((p) => (
                <button
                  key={p.id} type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedPeopleIds.includes(p.id)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 장소 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium">
              장소
              {selectedPlaceName && (
                <span className="ml-2 text-green-600 font-normal">{selectedPlaceName}</span>
              )}
            </label>
            <button type="button" onClick={handleAddPlace} className="text-blue-500 text-xs">
              + 새 장소 등록
            </button>
          </div>
          {/* 검색 입력 */}
          <input
            type="text"
            value={placeSearch}
            onChange={(e) => setPlaceSearch(e.target.value)}
            placeholder="장소명으로 검색"
            className="w-full border rounded px-3 py-1.5 text-sm mb-2"
          />
          {/* 필터된 목록 */}
          {places.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 장소가 없습니다.</p>
          ) : filteredPlaces.length === 0 ? (
            <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredPlaces.map((pl) => (
                <button
                  key={pl.id} type="button"
                  onClick={() => setSelectedPlaceId(selectedPlaceId === pl.id ? null : pl.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedPlaceId === pl.id
                      ? 'bg-green-500 text-white border-green-500'
                      : 'text-gray-600 border-gray-300 hover:border-green-300'
                  }`}
                >
                  {pl.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea
            name="memo" value={form.memo}
            onChange={handleChange} rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? '생성 중...' : '완료'}
        </button>
      </form>
    </div>
  )
}
