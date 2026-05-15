// 로그인 유저 정보와 토큰을 앱 전체에서 공유하는 전역 상태
import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading: 앱 시작 시 토큰 유효성 확인이 끝났는지 여부
  const [loading, setLoading] = useState(true)

  // 앱 시작 시 localStorage에 토큰이 있으면 /auth/me로 유저 정보 복원
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem('access_token'))
      .finally(() => setLoading(false))
  }, [])

  // 로그인/회원가입 성공 시 호출 — 토큰 저장 + 유저 정보 세팅
  const loginAction = (data) => {
    localStorage.setItem('access_token', data.access_token)
    setUser(data)
  }

  // 로그아웃 — 토큰 삭제 + 유저 정보 초기화
  const logoutAction = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  // 프로필 사진 URL만 갱신
  const updateUserPhoto = (photoUrl) => {
    setUser((prev) => ({ ...prev, photo_url: photoUrl }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginAction, logoutAction, updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  )
}

// 다른 파일에서 useAuth() 한 줄로 context에 접근
export function useAuth() {
  return useContext(AuthContext)
}
