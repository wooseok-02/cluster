// 일정 상세 페이지 — 정보 표시, Planned 상태일 때 수정 및 확정 가능
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSchedule, confirmSchedule, updateSchedule } from '../api/schedule'
import { verifyPhoto } from '../api/activity'
import { getPeopleList } from '../api/people'
import { getPlaceList } from '../api/place'

const formatDateTime = (isoString) => {
  const dt = new Date(isoString)
  const date = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
  const time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

// "2025-07-10T14:00:00" → "2025-07-10"
const toDateInput = (isoString) => new Date(isoString).toISOString().slice(0, 10)
// "2025-07-10T14:00:00" → "14:00"
const toTimeInput = (isoString) => {
  const dt = new Date(isoString)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export default function ScheduleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // 확정 관련 상태
  const [confirmMemo, setConfirmMemo] = useState('')
  const [confirmPhotos, setConfirmPhotos] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  // 사진 검증 팝업 상태
  const [verifyPopup, setVerifyPopup] = useState(null) // { photo_date, photo_place_name, schedule_date, schedule_place_name }

  // 수정 관련 상태
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editPeopleIds, setEditPeopleIds] = useState([])
  const [editPlaceId, setEditPlaceId] = useState(null)
  const [people, setPeople] = useState([])
  const [places, setPlaces] = useState([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [placeSearch, setPlaceSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getSchedule(id)
      .then((data) => setSchedule(data.data))
      .catch(() => setError('일정 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  // 수정 모드 진입 시 people/place 목록 로드
  const handleEditStart = () => {
    setEditForm({
      title: schedule.title,
      date: toDateInput(schedule.start_time),
      start_time: toTimeInput(schedule.start_time),
      end_time: toTimeInput(schedule.end_time),
      memo: schedule.memo || '',
    })
    setEditPeopleIds(schedule.people.map((p) => p.id))
    setEditPlaceId(schedule.place?.id || null)
    setSaveError('')

    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })
    getPlaceList()
      .then((data) => setPlaces(data.data))
      .catch((err) => { if (err.response?.status !== 404) console.error(err) })

    setEditing(true)
  }

  const handleEditCancel = () => {
    setEditing(false)
    setPeopleSearch('')
    setPlaceSearch('')
  }

  const toggleEditPerson = (pid) => {
    setEditPeopleIds((prev) =>
      prev.includes(pid) ? prev.filter((i) => i !== pid) : [...prev, pid]
    )
  }

  const handleSave = async () => {
    setSaveError('')
    setSaving(true)
    try {
      const updated = await updateSchedule(id, {
        title: editForm.title,
        date: editForm.date,
        start_time: editForm.start_time + ':00',
        end_time: editForm.end_time + ':00',
        memo: editForm.memo,
        place_id: editPlaceId ?? 0,
        people_ids: editPeopleIds,
      })
      setSchedule(updated.data)
      setEditing(false)
      setPeopleSearch('')
      setPlaceSearch('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setSaveError(typeof detail === 'object' ? detail.message : detail || '수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const doConfirm = async () => {
    setConfirmError('')
    setConfirming(true)
    try {
      await confirmSchedule(id, confirmMemo, confirmPhotos)
      navigate('/calendar')
    } catch (err) {
      setConfirmError(err.response?.data?.detail || '확정에 실패했습니다.')
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirm = async () => {
    // 사진이 있으면 첫 번째 사진으로 검증 먼저 수행
    if (confirmPhotos.length > 0) {
      setConfirming(true)
      try {
        const result = await verifyPhoto(id, confirmPhotos[0])
        if (result.match) {
          await doConfirm()
        } else {
          setVerifyPopup(result)
          setConfirming(false)
        }
      } catch {
        // 검증 API 실패 시 그냥 확정 진행
        await doConfirm()
      }
    } else {
      await doConfirm()
    }
  }

  if (loading) return <p className="p-4">불러오는 중...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  const start = formatDateTime(schedule.start_time)
  const end = formatDateTime(schedule.end_time)

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(peopleSearch.toLowerCase())
  )
  const filteredPlaces = places.filter((pl) =>
    pl.name.toLowerCase().includes(placeSearch.toLowerCase())
  )

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      {/* 사진 검증 불일치 팝업 */}
      {verifyPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 w-full max-w-sm space-y-4">
            <p className="font-semibold text-sm">사진 정보가 일정과 다릅니다.</p>
            <div className="text-sm space-y-1 text-gray-600">
              <p>사진: {verifyPopup.photo_date ?? '-'} / {verifyPopup.photo_place_name ?? '-'}</p>
              <p>일정: {verifyPopup.schedule_date ?? '-'} / {verifyPopup.schedule_place_name ?? '-'}</p>
            </div>
            <p className="text-sm font-medium">이 일정이 맞나요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setVerifyPopup(null) }}
                className="flex-1 border py-2 rounded text-sm text-gray-600"
              >
                아니다
              </button>
              <button
                onClick={() => { setVerifyPopup(null); doConfirm() }}
                className="flex-1 bg-green-500 text-white py-2 rounded text-sm"
              >
                맞다
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => navigate('/calendar')} className="text-gray-500 text-sm mb-4 block">
        ← 뒤로
      </button>

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{schedule.title}</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            schedule.status === 'Planned' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {schedule.status}
          </span>
          {schedule.status === 'Planned' && !editing && (
            <button
              onClick={handleEditStart}
              className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50"
            >
              수정
            </button>
          )}
        </div>
      </div>

      {/* 수정 폼 */}
      {editing && editForm ? (
        <div className="border rounded p-4 space-y-4 mb-6">
          <h2 className="font-semibold text-sm">일정 수정</h2>

          <div>
            <label className="block text-sm font-medium mb-1">일정 이름</label>
            <input
              type="text" value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">날짜</label>
            <input
              type="date" value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">시작 시간</label>
              <input
                type="time" value={editForm.start_time}
                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">종료 시간</label>
              <input
                type="time" value={editForm.end_time}
                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* 동행인 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              동행인
              {editPeopleIds.length > 0 && (
                <span className="ml-2 text-blue-500 font-normal text-xs">
                  {people.filter((p) => editPeopleIds.includes(p.id)).map((p) => p.name).join(', ')}
                </span>
              )}
            </label>
            <input
              type="text" value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="이름으로 검색"
              className="w-full border rounded px-3 py-1.5 text-sm mb-2"
            />
            {people.length === 0 ? (
              <p className="text-gray-400 text-sm">등록된 인물이 없습니다.</p>
            ) : filteredPeople.length === 0 ? (
              <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredPeople.map((p) => (
                  <button
                    key={p.id} type="button"
                    onClick={() => toggleEditPerson(p.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      editPeopleIds.includes(p.id)
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
            <label className="block text-sm font-medium mb-1">
              장소
              {editPlaceId && (
                <span className="ml-2 text-green-600 font-normal text-xs">
                  {places.find((pl) => pl.id === editPlaceId)?.name}
                </span>
              )}
            </label>
            <input
              type="text" value={placeSearch}
              onChange={(e) => setPlaceSearch(e.target.value)}
              placeholder="장소명으로 검색"
              className="w-full border rounded px-3 py-1.5 text-sm mb-2"
            />
            {places.length === 0 ? (
              <p className="text-gray-400 text-sm">등록된 장소가 없습니다.</p>
            ) : filteredPlaces.length === 0 ? (
              <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredPlaces.map((pl) => (
                  <button
                    key={pl.id} type="button"
                    onClick={() => setEditPlaceId(editPlaceId === pl.id ? null : pl.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      editPlaceId === pl.id
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

          <div>
            <label className="block text-sm font-medium mb-1">메모</label>
            <textarea
              value={editForm.memo}
              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleEditCancel}
              className="flex-1 border py-2 rounded text-sm text-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-500 text-white py-2 rounded text-sm disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        /* 일정 정보 표시 */
        <div className="border rounded p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">날짜</span>
            <span>{start.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">시간</span>
            <span>{start.time} ~ {end.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">장소</span>
            <span>{schedule.place?.name || '없음'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">동행인</span>
            <span>
              {schedule.people.length > 0
                ? schedule.people.map((p) => p.name).join(', ')
                : '없음'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">메모</span>
            <span className="text-right max-w-48">{schedule.memo || '-'}</span>
          </div>

          {/* 사진 목록 */}
          {schedule.photos && schedule.photos.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">사진 ({schedule.photos.length}장)</p>
              <div className="grid grid-cols-3 gap-1">
                {schedule.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="일정 사진"
                    className="w-full aspect-square object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 확정 섹션 — Planned 상태이고 수정 모드가 아닐 때만 표시 */}
      {schedule.status === 'Planned' && !editing && (
        <div className="border rounded p-4 space-y-3">
          <h2 className="font-semibold text-sm">일정 확정</h2>

          <div>
            <label className="block text-sm text-gray-500 mb-1">메모 (선택)</label>
            <textarea
              value={confirmMemo}
              onChange={(e) => setConfirmMemo(e.target.value)}
              rows={2}
              placeholder="확정 메모를 입력하세요"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">사진 첨부 (선택, 최대 10장)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setConfirmPhotos(Array.from(e.target.files))}
              className="text-sm"
            />
            {confirmPhotos.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{confirmPhotos.length}장 선택됨</p>
            )}
          </div>

          {confirmError && <p className="text-red-500 text-sm">{confirmError}</p>}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-green-500 text-white py-2 rounded disabled:opacity-50"
          >
            {confirming ? '확정 중...' : '완료 (확정)'}
          </button>
        </div>
      )}
    </div>
  )
}
