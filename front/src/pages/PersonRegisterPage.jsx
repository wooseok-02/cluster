// 사람 등록 페이지 — name/age/relation/address 입력, embedding은 추후 연결 예정
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { registerPerson } from '../api/people'

export default function PersonRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const [form, setForm] = useState({
    name: '',
    age: '',
    relation: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerPerson({ ...form, age: Number(form.age) })
      navigate(from === 'schedule' ? '/schedule/create' : '/people')
    } catch (err) {
      setError(err.response?.data?.detail || '등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/people')} className="text-gray-500 text-sm">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold">사람 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">나이</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            required
            min="1"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">관계</label>
          <input
            type="text"
            name="relation"
            value={form.relation}
            onChange={handleChange}
            required
            placeholder="예: 친구, 직장동료, 가족"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">주소</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="예: 서울 강남구"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? '등록 중...' : '등록'}
        </button>
      </form>
    </div>
  )
}
