// 회원가입 / 로그인 / 내 정보 조회 API 함수
import axiosInstance from './axiosInstance'

export const login = async (email, password) => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const response = await axiosInstance.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

export const register = async ({ email, password, nick_name, age, gender }) => {
  const response = await axiosInstance.post('/auth/register', {
    email,
    password,
    nick_name,
    age,
    gender,
  })
  return response.data
}

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me')
  return response.data
}

export const updateMyPhoto = async (photoFile) => {
  const formData = new FormData()
  formData.append('photo', photoFile)
  const response = await axiosInstance.patch('/auth/me/photo', formData)
  return response.data
}
