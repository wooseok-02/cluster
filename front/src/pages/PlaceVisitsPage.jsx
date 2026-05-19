import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlace } from '../api/place'

function formatRecentDate(date) {
  if (!date) return '-'

  const [year, month, day] = String(date).split(/[.-]/)
  if (!year || !month || !day) return date

  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

export default function PlaceVisitsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [place, setPlace] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlace(id)
      .then((data) => setPlace(data.data))
      .catch(() => setError('방문 기록을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="!p-4">불러오는 중...</p>
  if (error) return <p className="!p-4 text-red-500">{error}</p>

  const logs = place.logs || []
  const latestDate = logs[0]?.date

  return (
    <div className="mx-auto min-h-screen w-full max-w-[448px] bg-white !pb-[64px]">
      <header className="flex items-end !px-[23px] !pt-5 !pb-[31px]">
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
        <h1 className="flex-1 text-center text-base font-semibold leading-4 text-black">방문 기록</h1>
        <div className="h-[30px] w-[30px]" />
      </header>

      <main className="!px-[30px]">
        <section className="flex items-center gap-[19px] rounded-[10px] bg-primary-light !px-[15px] !py-5">
          <div className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-[5px] bg-white/45 text-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 3V6M17 3V6M4 9H20M6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7C4 5.89543 4.89543 5 6 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex flex-col gap-[6px]">
            <p className="text-base font-semibold leading-4 text-black">
              총 <span className="font-medium">{place.visit_count ?? logs.length}</span>번 방문했어요.
            </p>
            <p className="truncate text-xs font-medium leading-4 text-gray-500">
              가장 최근 방문은 {formatRecentDate(latestDate)}이에요.
            </p>
          </div>
        </section>

        {logs.length === 0 ? (
          <p className="!mt-[30px] text-sm text-gray-400">아직 방문 기록이 없습니다.</p>
        ) : (
          <section className="!mt-[30px] rounded-[15px] border border-gray-200 bg-white !px-[22px] !py-[10px]">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1
              const content = (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-4 text-black">{log.schedule_title || log.date}</span>
                    {log.schedule_title && (
                      <span className="!mt-1 block text-xs leading-4 text-gray-400">{log.date}</span>
                    )}
                  </span>
                  {log.schedule_id && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-500" aria-hidden="true">
                      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </>
              )

              return log.schedule_id ? (
                <button
                  key={log.log_id}
                  type="button"
                  onClick={() => navigate(`/schedule/${log.schedule_id}`)}
                  className={`flex w-full items-center justify-between !px-[10px] !py-[12px] text-left ${isLast ? '' : 'border-b border-gray-200'}`}
                >
                  {content}
                </button>
              ) : (
                <div
                  key={log.log_id}
                  className={`flex items-center justify-between !px-[10px] !py-[12px] ${isLast ? '' : 'border-b border-gray-200'}`}
                >
                  {content}
                </div>
              )
            })}
          </section>
        )}

        <div className="!mt-[28px] flex flex-col items-center text-xs font-medium leading-4 text-gray-500">
          <p>이전 기록은 더 불러올 수 있어요.</p>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-90" aria-hidden="true">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </main>
    </div>
  )
}
