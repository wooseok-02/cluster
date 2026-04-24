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
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
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
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-center relative">
        <button
          onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/people')}
          className="absolute left-6 text-gray-700"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900">새로운 사람 추가</h2>
      </header>

      <div className="px-6 py-8 flex flex-col items-center">
        {/* 사진 업로드 */}
        <label className="cursor-pointer mb-8 flex flex-col items-center gap-2">
          <div className="w-28 h-28 rounded-full bg-[#EEE9FD] flex flex-col items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="7" width="22" height="17" rx="2.5" stroke="#5B40E4" strokeWidth="1.8" />
                  <circle cx="14" cy="15" r="5" stroke="#5B40E4" strokeWidth="1.8" />
                  <path d="M11 7L12.5 4H15.5L17 7" stroke="#5B40E4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#5B40E4] text-xs font-medium">사진 추가</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>

        {/* 폼 필드 */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해주세요."
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">나이</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="나이를 입력해주세요."
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">관계</label>
            <input
              type="text"
              name="relation"
              value={form.relation}
              onChange={handleChange}
              placeholder="예) 가족, 친구, 직장동료 등"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">주소</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="예) 서울시 강남구"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5B40E4] hover:bg-[#4A32C3] text-white font-semibold py-3.5 rounded-xl text-base transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
