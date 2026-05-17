// People 관련 API 함수 모음 — 등록, 목록 조회, 상세 조회
import axiosInstance from './axiosInstance'

export const registerPerson = async ({ name, age, relation, address, phone, photo }) => {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('age', age)
  formData.append('relation', relation)
  formData.append('address', address || '')
  formData.append('phone', phone || '')
  if (photo) formData.append('photo', photo)
  const response = await axiosInstance.post('/people/register/people', formData)
  return response.data
}

export const getPeopleList = async () => {
  const response = await axiosInstance.get('/people/load/peopleList')
  return response.data
}

export const getPersonDetail = async (peopleId) => {
  const response = await axiosInstance.get(`/people/load/people/${peopleId}`)
  return response.data
}

export const updatePersonPhoto = async (peopleId, photoFile) => {
  const formData = new FormData()
  formData.append('photo', photoFile)
  const response = await axiosInstance.patch(`/people/${peopleId}/photo`, formData)
  return response.data
}
