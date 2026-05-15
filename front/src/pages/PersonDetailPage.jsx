import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPersonDetail, updatePersonPhoto } from '../api/people'

const STATUS_LABELS = {
  new: 'New',
  best: 'Best',
  old: 'Old',
  normal: 'Normal',
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '-'
}

function getLogTitle(log) {
  return log.schedule_title || log.schedule?.title || log.title || '만남 기록'
}

function getLogPlace(log) {
  return log.place_name || log.place?.name || '-'
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getPersonDetail(id)
      .then((data) => setPerson(data))
      .catch(() => setError('정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await updatePersonPhoto(id, file)
      setPerson((prev) => ({ ...prev, photo_url: res.data.photo_url }))
    } catch {
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return <p className="!p-4">불러오는 중...</p>
  if (error) return <p className="!p-4 text-red-500">{error}</p>

  return (
    <div className="mx-auto min-h-screen w-full max-w-[448px] bg-white">
      <header className="flex h-[102px] items-end !px-[23px] !pb-[5px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[30px] w-[30px] items-center justify-center text-black"
          aria-label="Go back"
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M18.75 22.5L11.25 15L18.75 7.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <main>
        <section className="flex items-center gap-[18px] !px-[30px]">
          <button
            type="button"
            onClick={handlePhotoClick}
            className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-3xl font-bold text-gray-600"
            disabled={uploading}
            aria-label="프로필 사진 변경"
          >
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              <span>{person.name?.[0]}</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              {uploading ? (
                <span className="text-white text-xs">업로드 중...</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="14" rx="2" stroke="white" strokeWidth="1.8" />
                  <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
                  <path d="M9 7L10.5 4H13.5L15 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-semibold leading-4 text-text-main">{person.name}</h1>
            <div className="!mt-[15px] flex flex-col gap-[2px] text-sm leading-4 text-people-status-old">
              <p className="flex items-center gap-[5px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21V19C17 17.8954 16.1046 17 15 17H9C7.89543 17 7 17.8954 7 19V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>{person.age}세</span>
              </p>
              <p className="flex min-w-0 items-center gap-[5px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21C12 21 18 15.3137 18 10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10C6 15.3137 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 12.5C13.3807 12.5 14.5 11.3807 14.5 10C14.5 8.61929 13.3807 7.5 12 7.5C10.6193 7.5 9.5 8.61929 9.5 10C9.5 11.3807 10.6193 12.5 12 12.5Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="truncate">{person.address || '-'}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="!mx-[30px] !mt-[21px] grid h-[73px] grid-cols-3 overflow-hidden rounded-[10px] border border-gray-200 bg-white text-center shadow-[0_3px_3.5px_rgba(114,114,114,0.3)]">
          <div className="flex flex-col items-center justify-center gap-[5px] border-r border-gray-100">
            <p className="text-[10px] leading-4 text-people-status-old">상태</p>
            <p className="text-base font-medium leading-4 text-primary">{getStatusLabel(person.status)}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-[5px] border-r border-gray-100">
            <p className="text-[10px] leading-4 text-people-status-old">관계</p>
            <p className="max-w-full truncate !px-2 text-base font-medium leading-4 text-primary">{person.relation || '-'}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <p className="text-[10px] leading-4 text-people-status-old">총 만난 횟수</p>
            <p className="text-base font-medium leading-4 text-primary">{person.count ?? 0}</p>
          </div>
        </section>

        <div className="!mt-[21px] h-[5px] bg-gray-200" />

        <section className="!pb-8">
          <div className="flex items-center justify-between bg-white !px-[30px] !pt-[30px] !pb-5">
            <h2 className="text-lg font-bold leading-4 text-black">최근 만남 기록</h2>
            <button
              type="button"
              onClick={() => navigate('/schedule/create')}
              className="flex items-center text-[10px] font-bold leading-4 text-primary"
            >
              <span>일정 등록</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {person.logs.length === 0 ? (
            <p className="!px-[30px] text-sm text-gray-400">아직 만남 기록이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {person.logs.slice(0, 3).map((log) => (
                <button
                  key={log.log_id}
                  type="button"
                  disabled={!log.schedule_id}
                  onClick={() => log.schedule_id && navigate(`/schedule/${log.schedule_id}`)}
                  className="flex w-full items-center bg-white !px-[30px] disabled:opacity-60"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-[6px] text-left">
                    <p className="truncate text-lg font-semibold leading-6 text-black">{getLogTitle(log)}</p>
                    <p className="truncate text-sm leading-5 text-gray-400">{getLogPlace(log)}</p>
                    <p className="text-sm leading-5 text-gray-400">{log.date}</p>
                  </div>
                  {log.schedule_id && (
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="ml-4 shrink-0 text-black" aria-hidden="true">
                      <path d="M11.25 7.5L18.75 15L11.25 22.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
