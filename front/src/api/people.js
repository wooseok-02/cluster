// People 관련 API 함수 모음 — 등록, 목록 조회, 상세 조회
import axiosInstance from './axiosInstance'

export const registerPerson = async ({ name, age, relation, address }) => {
  const response = await axiosInstance.post('/people/register/people', {
    name,
    age,
    relation,
    address,
    embedding: null, // 추후 얼굴 임베딩 기능 연결 시 사용
  })
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
