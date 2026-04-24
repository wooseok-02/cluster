import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPersonDetail } from '../api/people'
import StatusBadge from '../components/StatusBadge'

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPersonDetail(id)
      .then((data) => setPerson(data))
      .catch(() => setError('정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="p-4">불러오는 중...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
            {person.name?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{person.name}</h1>
            <p className="text-sm text-gray-500">🎂 {person.age}세</p>
            <p className="text-sm text-gray-500">📍 {person.address || '-'}</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="text-center px-2">
              <p className="text-xs text-gray-500 mb-1">상태</p>
              <StatusBadge status={person.status} />
            </div>
            <div className="text-center px-2">
              <p className="text-xs text-gray-500 mb-1">관계</p>
              <p className="text-[#5B40E4] font-medium text-sm">{person.relation}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-xs text-gray-500 mb-1">총 만남 횟수</p>
              <p className="text-[#5B40E4] font-bold text-sm">{person.count}회</p>
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">최근 만남 기록</h2>
            <button
              onClick={() => navigate('/schedule/create')}
              className="text-sm text-[#5B40E4]"
            >
              일정 등록 +
            </button>
          </div>

          {person.logs.length === 0 ? (
            <p className="text-gray-400 text-sm">아직 만남 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {person.logs.slice(0, 3).map((log) => (
                <div
                  key={log.log_id}
                  className="w-full flex items-center gap-4 bg-white rounded-xl p-3 border border-gray-200"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    📅
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-500">{log.date}</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
