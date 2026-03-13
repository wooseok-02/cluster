// 사람 상세 페이지 — 기본 정보 + 만남 기록 날짜 목록 (Activity 연결은 추후 스프린트)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPersonDetail } from '../api/people'

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
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/people')} className="text-gray-500 text-sm mb-4 block">
        ← 뒤로
      </button>

      <h1 className="text-2xl font-bold mb-1">{person.name}</h1>
      <p className="text-gray-500 text-sm mb-4">{person.relation}</p>

      <div className="border rounded p-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">나이</span>
          <span>{person.age}세</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">주소</span>
          <span>{person.address || '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">만남 횟수</span>
          <span>{person.count}회</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">상태</span>
          <span>{person.status}</span>
        </div>
      </div>

      <h2 className="font-semibold mb-2">만남 기록</h2>
      {person.logs.length === 0 ? (
        <p className="text-gray-400 text-sm">아직 만남 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-1">
          {person.logs.map((log) => (
            // TODO: Activity 스프린트에서 클릭 시 /activity/:log_id 로 이동 연결
            <li
              key={log.log_id}
              className="border rounded px-3 py-2 text-sm text-gray-700"
            >
              {log.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
