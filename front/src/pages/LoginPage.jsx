import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import ClusterLogo from '../components/ClusterLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginAction } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
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
      const data = await login(form.email, form.password)
      loginAction(data)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <ClusterLogo size={80} />
          <h1 className="text-3xl font-bold text-gray-900">cluster</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M4 16.5C4 13.5 6.5 11 10 11C13.5 11 16 13.5 16 16.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="8" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 8V6C7 4.343 8.343 3 10 3C11.657 3 13 4.343 13 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5B40E4] focus:ring-2 focus:ring-[#5B40E4]/10 transition-all"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5B40E4] hover:bg-[#4A32C3] text-white font-semibold py-3.5 rounded-xl text-base transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-[#5B40E4] font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
