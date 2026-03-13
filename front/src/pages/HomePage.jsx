// 로그인 후 이동하는 홈 페이지 — 유저 정보 표시, 로그아웃 버튼
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logoutAction } = useAuth()

  const handleLogout = () => {
    logoutAction()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">홈</h1>
      {user && (
        <p className="text-gray-600 mb-2">
          {user.nick_name}님 환영합니다 ({user.email})
        </p>
      )}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        로그아웃
      </button>
    </div>
  )
}
