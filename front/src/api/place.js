// Place 관련 API 함수 모음 — 카카오 검색, 장소 저장, 목록/상세 조회
import axiosInstance from './axiosInstance'

export const searchKakaoPlace = async (query) => {
  const response = await axiosInstance.get('/place/kakao/find_place', {
    params: { query },
  })
  return response.data
}

export const registerPlace = async ({ name, longitude, latitude, category_code, category_name }) => {
  const response = await axiosInstance.post('/place/create/kakao/place', {
    name,
    longitude,
    latitude,
    category_code,
    category_name,
  })
  return response.data
}

export const getPlaceList = async () => {
  const response = await axiosInstance.get('/place/load/placeList')
  return response.data
}

export const getPlace = async (placeId) => {
  const response = await axiosInstance.get(`/place/${placeId}`)
  return response.data
}
