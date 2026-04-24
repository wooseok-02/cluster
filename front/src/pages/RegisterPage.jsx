import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import ClusterLogo from '../components/ClusterLogo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { loginAction } = useAuth()
  const [form, setForm] = useState({
    email: '',
    password: '',
    nick_name: '',
    age: '',
    gender: 'man',
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
      const data = await register({ ...form, age: Number(form.age) })
      loginAction(data)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-700" aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ClusterLogo size={48} />
      </div>

      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">회원가입</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="이메일"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
            required
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
            required
          />

          <input
            type="text"
            name="nick_name"
            value={form.nick_name}
            onChange={handleChange}
            placeholder="닉네임"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
            required
          />

          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="나이"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
            required
          />

          <div className="relative">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all appearance-none bg-white"
              required
            >
              <option value="">성별</option>
              <option value="man">남성</option>
              <option value="woman">여성</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5B40E4] hover:bg-[#4A32C3] text-white font-semibold py-3.5 rounded-xl text-base transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/" className="text-[#5B40E4] font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
