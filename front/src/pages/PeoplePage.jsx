// 등록된 사람 목록 페이지 — 목록 없으면 빈 상태 안내, 각 항목 클릭 시 상세 이동
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPeopleList } from '../api/people'
import TabBar from '../components/TabBar'

export default function PeoplePage() {
  const navigate = useNavigate()
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPeopleList()
      .then((data) => setPeople(data.data))
      .catch((err) => {
        // 404는 빈 목록 — 에러가 아니라 빈 상태로 처리
        if (err.response?.status !== 404) {
          setError('목록을 불러오는 데 실패했습니다.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <div className="p-4 max-w-lg mx-auto pb-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">People</h1>
        <button
          onClick={() => navigate('/people/register')}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          + 등록
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {people.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <p>등록된 사람이 없습니다.</p>
          <button
            onClick={() => navigate('/people/register')}
            className="mt-4 text-blue-500 underline text-sm"
          >
            첫 번째 사람 등록하기
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {people.map((person) => (
            <li
              key={person.id}
              onClick={() => navigate(`/people/${person.id}`)}
              className="border rounded p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-gray-500">{person.relation} · {person.age}세</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>만남 {person.count}회</p>
                <p>{person.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TabBar />
    </div>
  )
}
