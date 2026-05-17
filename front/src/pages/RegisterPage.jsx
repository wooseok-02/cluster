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
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-white !pb-10">
      <header className="flex items-center justify-between bg-white !px-[23px] !pt-5">
        <button
          onClick={() => navigate('/')}
          className="flex size-[30px] items-center justify-center text-text-main"
          aria-label="Go back"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="!mr-[6px]">
          <ClusterLogo size={72} />
        </div>
      </header>

      <main className="!px-[30px] !pt-12">
        <h1 className="text-[22px] font-bold leading-4 text-text-main">회원가입</h1>

        <form onSubmit={handleSubmit} className="!mt-[44px] flex flex-col gap-5">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="이메일"
            className="h-10 w-full rounded-[10px] border border-people-status-old bg-white !px-5 text-xs leading-4 text-text-main outline-none placeholder:text-people-status-old focus:border-primary focus:ring-2 focus:ring-primary-light"
            required
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호"
            className="h-10 w-full rounded-[10px] border border-people-status-old bg-white !px-5 text-xs leading-4 text-text-main outline-none placeholder:text-people-status-old focus:border-primary focus:ring-2 focus:ring-primary-light"
            required
          />

          <input
            type="text"
            name="nick_name"
            value={form.nick_name}
            onChange={handleChange}
            placeholder="닉네임"
            className="h-10 w-full rounded-[10px] border border-people-status-old bg-white !px-5 text-xs leading-4 text-text-main outline-none placeholder:text-people-status-old focus:border-primary focus:ring-2 focus:ring-primary-light"
            required
          />

          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="나이"
            className="h-10 w-full rounded-[10px] border border-people-status-old bg-white !px-5 text-xs leading-4 text-text-main outline-none placeholder:text-people-status-old focus:border-primary focus:ring-2 focus:ring-primary-light"
            required
          />

          <div className="relative">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="h-10 w-full appearance-none rounded-[10px] border border-people-status-old bg-white !px-5 !pr-10 text-xs leading-4 text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              required
            >
              <option value="">성별</option>
              <option value="man">남성</option>
              <option value="woman">여성</option>
            </select>
            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-people-status-old">
              <svg width="17" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="!mt-5 flex h-10 w-full items-center justify-center rounded-[10px] bg-primary !p-[10px] text-sm font-bold leading-4 text-white disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="!mt-[26px] text-center text-xs font-medium leading-4 text-text-sub">
          이미 계정이 있으신가요?{' '}
          <Link to="/" className="font-bold text-primary">
            로그인
          </Link>
        </p>
      </main>
    </div>
  )
}
