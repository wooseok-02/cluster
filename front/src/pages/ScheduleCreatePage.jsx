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
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')

  const [form, setForm] = useState({ title: '', date: initialDate, start_time: '', end_time: '', memo: '' })
  const [selectedPeopleIds, setSelectedPeopleIds] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)

  const [people, setPeople] = useState([])
  const [places, setPlaces] = useState([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [placeSearch, setPlaceSearch] = useState('')
  const [showPeopleMatches, setShowPeopleMatches] = useState(false)
  const [showPlaceMatches, setShowPlaceMatches] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pendingFiles.length === 0) return
    const url = URL.createObjectURL(pendingFiles[0])
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFiles])

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

  const handleSelectPerson = (person) => {
    setSelectedPeopleIds((prev) => (
      prev.includes(person.id) ? prev : [...prev, person.id]
    ))
    setPeopleSearch('')
    setShowPeopleMatches(false)
  }

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id)
    setPlaceSearch('')
    setShowPlaceMatches(false)
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

  // 선택된 항목 이름 표시용
  const selectedPeopleNames = people
    .filter((p) => selectedPeopleIds.includes(p.id))
    .map((p) => p.name)
  const selectedPlaceName = places.find((pl) => pl.id === selectedPlaceId)?.name
  const trimmedPeopleSearch = peopleSearch.trim().toLowerCase()
  const trimmedPlaceSearch = placeSearch.trim().toLowerCase()
  const matchingPeople = showPeopleMatches && trimmedPeopleSearch
    ? people.filter((p) => p.name.toLowerCase().startsWith(trimmedPeopleSearch))
    : []
  const matchingPlaces = showPlaceMatches && trimmedPlaceSearch
    ? places.filter((pl) => pl.name.toLowerCase().startsWith(trimmedPlaceSearch))
    : []

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-white !pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-center bg-white !px-[23px] !pt-5 !pb-[10px]">
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="absolute left-[23px] top-3 flex size-[30px] items-center justify-center text-text-main"
          aria-label="뒤로"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold leading-4 text-text-main">일정 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[15px] !px-[30px] !pt-[28px]">

        {/* 제목 */}
        <div className="flex flex-col gap-[10px]">
          <label className="text-sm font-medium leading-4 text-text-main">일정 이름</label>
          <input
            type="text" name="title" value={form.title}
            onChange={handleChange} required
            className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-sm text-text-main outline-none focus:border-primary"
          />
        </div>

        {/* 날짜 */}
        <div className="flex flex-col gap-[10px]">
          <label className="text-sm font-medium leading-4 text-text-main">날짜</label>
          <div className="relative w-full min-w-0">
            <input
              type="date" name="date" value={form.date}
              onChange={handleChange} required
              className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] !pr-10 text-xs text-text-main outline-none focus:border-primary"
            />
            <svg className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-text-sub" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 시간 */}
        <div className="grid w-full grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] items-end gap-[10px]">
          <div className="flex min-w-0 flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-text-main">시작 시간</label>
            <input
              type="time" name="start_time" value={form.start_time}
              onChange={handleChange} required
              className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none focus:border-primary"
            />
          </div>
          <span className="flex h-10 items-center justify-center text-xl leading-4 text-gray-400">~</span>
          <div className="flex min-w-0 flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-text-main">종료 시간</label>
            <input
              type="time" name="end_time" value={form.end_time}
              onChange={handleChange} required
              className="block h-10 w-full min-w-0 appearance-none rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 동행인 */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-4 text-text-main">
              동행인
              {selectedPeopleNames.length > 0 && (
                  <span className="!ml-2 text-xs font-normal text-primary">{selectedPeopleNames.join(', ')}</span>
              )}
            </label>
              <button type="button" onClick={handleAddPerson} className="rounded-[3px] bg-primary !px-[5px] text-[8px] font-medium leading-4 text-white">
              + 새 인물 등록
            </button>
            </div>
            <input
              type="text"
              value={peopleSearch}
              onChange={(e) => {
                setPeopleSearch(e.target.value)
                setShowPeopleMatches(true)
              }}
              placeholder="이름으로 검색"
              className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none placeholder:text-gray-400 focus:border-primary"
            />
          </div>
          {matchingPeople.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-[10px] border border-gray-border bg-white">
              {matchingPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleSelectPerson(person)}
                  className={`w-full !px-[10px] !py-2 text-left text-xs leading-4 ${
                    selectedPeopleIds.includes(person.id)
                      ? 'bg-primary-light text-primary'
                      : 'text-text-main active:bg-gray-50'
                  }`}
                >
                  {person.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 장소 */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-4 text-text-main">
              장소
              {selectedPlaceName && (
                  <span className="!ml-2 text-xs font-normal text-primary">{selectedPlaceName}</span>
              )}
            </label>
              <button type="button" onClick={handleAddPlace} className="rounded-[3px] bg-primary !px-[5px] text-[8px] font-medium leading-4 text-white">
              + 새 장소 등록
            </button>
            </div>
            <input
              type="text"
              value={placeSearch}
              onChange={(e) => {
                setPlaceSearch(e.target.value)
                setShowPlaceMatches(true)
              }}
              placeholder="장소명으로 검색"
              className="h-10 w-full rounded-[10px] border border-gray-400 bg-white !px-[10px] text-xs text-text-main outline-none placeholder:text-gray-400 focus:border-primary"
            />
          </div>
          {matchingPlaces.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-[10px] border border-gray-border bg-white">
              {matchingPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className={`w-full !px-[10px] !py-2 text-left text-xs leading-4 ${
                    selectedPlaceId === place.id
                      ? 'bg-primary-light text-primary'
                      : 'text-text-main active:bg-gray-50'
                  }`}
                >
                  {place.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div className="flex flex-col gap-[10px]">
          <label className="text-sm font-medium leading-4 text-text-main">메모</label>
          <textarea
            name="memo" value={form.memo}
            onChange={handleChange} rows={3}
            className="min-h-[50px] w-full resize-none rounded-[10px] border border-gray-400 bg-white !px-[10px] !py-2 text-sm text-text-main outline-none focus:border-primary"
          />
        </div>

        {/* 사진 */}
        <div className="flex flex-col gap-[10px]">
          <label className="text-sm font-medium leading-4 text-text-main">사진</label>
          {photoPreviewUrl ? (
            <div className="w-full overflow-hidden rounded-[10px] border border-gray-300 bg-gray-100">
              <img
                src={photoPreviewUrl}
                alt="첨부된 사진 미리보기"
                className="h-[190px] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[55px] w-[70px] items-center justify-center rounded-[10px] border border-gray-400 text-xl font-extralight leading-4 text-text-sub">
              +
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="!mt-[3px] flex w-full items-center justify-center rounded-[10px] bg-primary !px-[10px] !py-[15px] text-base font-semibold leading-4 text-white disabled:opacity-50"
        >
          {loading ? '생성 중...' : '확인'}
        </button>
      </form>
    </div>
  )
}
